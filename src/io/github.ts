import { getErrorMessage } from '@/lib/logger'

/**
 * Fetches and normalises a GitHub repository README so it renders identically to
 * how GitHub shows it — chiefly by rewriting relative image/link URLs to their
 * absolute `raw.githubusercontent.com` equivalents.
 *
 * Both `api.github.com` and `raw.githubusercontent.com` send permissive CORS
 * headers for anonymous GET, so no proxy or token is required.
 */

export interface RepoRef {
  owner: string
  repo: string
}

export interface ReadmeResult {
  markdown: string
  name: string
}

interface GithubReadmeResponse {
  content?: string
  encoding?: string
  download_url?: string
  name?: string
}

const SEGMENT_RE = /^[\w.-]+$/

/**
 * Parse an `owner/repo` reference from a GitHub URL or bare slug. Accepts full
 * URLs (with optional `/tree/branch`, `.git`, query/hash, trailing slashes) and
 * bare `owner/repo`. Returns null when the input is not a valid repo reference.
 */
export function parseRepo(input: string): RepoRef | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  let path = trimmed
  // Strip a scheme + host (github.com / www.github.com) if present.
  const urlMatch = /^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i.exec(trimmed)
  if (urlMatch) {
    path = urlMatch[1]
  } else if (/^https?:\/\//i.test(trimmed) || trimmed.includes('://')) {
    // A URL on some other host is not a GitHub repo.
    return null
  }

  // Drop query string / hash, then split into path segments.
  path = path.split(/[?#]/)[0]
  const segments = path.split('/').filter(Boolean)
  if (segments.length < 2) return null

  const owner = segments[0]
  const repo = segments[1].replace(/\.git$/i, '')
  if (!SEGMENT_RE.test(owner) || !SEGMENT_RE.test(repo)) return null

  return { owner, repo }
}

/** Decode a base64 string (possibly newline-wrapped) into a UTF-8 string. */
function decodeBase64Utf8(base64: string): string {
  const clean = base64.replace(/\s/g, '')
  const binary = atob(clean)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Build the raw directory base for a README from its `download_url`, e.g.
 * `https://raw.githubusercontent.com/owner/repo/main/docs/README.md`
 * → `https://raw.githubusercontent.com/owner/repo/main/docs/` and the repo root
 * `https://raw.githubusercontent.com/owner/repo/main/`.
 */
function deriveRawBases(downloadUrl: string, ref: RepoRef): { dirBase: string; rootBase: string } {
  try {
    const url = new URL(downloadUrl)
    const dirBase = downloadUrl.slice(0, downloadUrl.lastIndexOf('/') + 1)
    // Path is /owner/repo/branch/...; the root base keeps owner/repo/branch.
    const parts = url.pathname.split('/').filter(Boolean)
    const branch = parts[2] ?? 'HEAD'
    const rootBase = `${url.origin}/${ref.owner}/${ref.repo}/${branch}/`
    return { dirBase, rootBase }
  } catch {
    const fallback = `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/HEAD/`
    return { dirBase: fallback, rootBase: fallback }
  }
}

/** True for URLs that should never be rewritten (already absolute / special). */
function isAbsoluteOrSpecial(url: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(url) || // any scheme: http:, https:, mailto:, data:, etc.
    url.startsWith('//') ||
    url.startsWith('#')
  )
}

/** Resolve a single relative URL against the directory or root raw base. */
function resolveUrl(raw: string, dirBase: string, rootBase: string): string {
  const url = raw.trim()
  if (!url || isAbsoluteOrSpecial(url)) return raw
  if (url.startsWith('/')) return rootBase + url.replace(/^\/+/, '')
  return dirBase + url.replace(/^\.\//, '')
}

/**
 * Rewrite relative URLs in Markdown image/link targets and inline HTML
 * `src`/`href` attributes so they resolve against the repository's raw host.
 */
function rewriteRelativeUrls(markdown: string, dirBase: string, rootBase: string): string {
  // Markdown links and images: ](target) or ](target "title")
  const mdLink = /(!?\]\()(\s*)([^()\s]+)(\s+"[^"]*")?(\s*\))/g
  let out = markdown.replace(mdLink, (_m, open, lead, target, title = '', close) => {
    return `${open}${lead}${resolveUrl(target, dirBase, rootBase)}${title}${close}`
  })

  // HTML attributes: src="..." / href="..." (single or double quoted)
  const htmlAttr = /\b(src|href)\s*=\s*("([^"]*)"|'([^']*)')/gi
  out = out.replace(htmlAttr, (_m, attr, _q, dq, sq) => {
    const value = dq ?? sq ?? ''
    return `${attr}="${resolveUrl(value, dirBase, rootBase)}"`
  })

  return out
}

/**
 * Fetch a repository's README, decode it, and rewrite relative URLs to absolute.
 * Throws a friendly Error on 404 / rate-limit / network failures.
 */
export async function fetchReadme(owner: string, repo: string): Promise<ReadmeResult> {
  let response: Response
  try {
    response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
  } catch (error) {
    throw new Error(`Couldn’t reach GitHub. Check your connection. (${getErrorMessage(error)})`)
  }

  if (response.status === 404) throw new Error('Repo or README not found.')
  if (response.status === 403) {
    throw new Error('GitHub rate limit reached (60/hour for anonymous). Try again later.')
  }
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}). Try again later.`)
  }

  let data: GithubReadmeResponse
  try {
    data = (await response.json()) as GithubReadmeResponse
  } catch (error) {
    throw new Error(`Couldn’t read GitHub’s response. (${getErrorMessage(error)})`)
  }

  if (typeof data.content !== 'string' || data.encoding !== 'base64') {
    throw new Error('Repo or README not found.')
  }

  const decoded = decodeBase64Utf8(data.content)
  const ref: RepoRef = { owner, repo }
  const { dirBase, rootBase } = deriveRawBases(
    data.download_url ?? `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${data.name ?? 'README.md'}`,
    ref,
  )
  const markdown = rewriteRelativeUrls(decoded, dirBase, rootBase)

  return { markdown, name: repo }
}
