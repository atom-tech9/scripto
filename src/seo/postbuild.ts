/**
 * Pure string transforms used by the SSG build (vite.config.ts) to turn
 * prerendered pages into zero-JS static HTML and to emit sitemap/robots.
 *
 * Deliberately free of node imports so it compiles under every tsconfig and
 * unit-tests without mocks. All filesystem work lives in vite.config.ts.
 */

export const SITE_ORIGIN = 'https://md.atom.sa'

export const PLAUSIBLE_SNIPPET =
  '<script defer data-domain="md.atom.sa" src="https://plausible.io/js/script.js"></script>'

export interface StripResult {
  html: string
  removedScripts: number
  removedPreloads: number
}

/**
 * Remove the framework hydration payload from a prerendered page:
 * `<script type="module">` tags and `<link rel="modulepreload">` hints.
 * Inline scripts (progressive enhancement, redirects) and JSON-LD survive.
 *
 * The regex assumes module scripts are external references with empty bodies
 * (Vite's client build always emits them that way). If that ever changes, an
 * inline `</script>` substring could truncate the match — so the invariant is
 * asserted loudly instead of corrupting pages silently.
 */
export const stripHydrationArtifacts = (html: string): StripResult => {
  let removedScripts = 0
  let removedPreloads = 0
  const withoutScripts = html.replace(
    /[ \t]*<script\b[^>]*\btype="module"[^>]*>([\s\S]*?)<\/script>\s*?\n?/g,
    (_match, body: string) => {
      if (body.trim() !== '') {
        throw new Error(
          'stripHydrationArtifacts: module script with a non-empty body — refusing to strip (regex would be unsafe)',
        )
      }
      removedScripts += 1
      return ''
    },
  )
  const withoutPreloads = withoutScripts.replace(
    /[ \t]*<link\b[^>]*\brel="modulepreload"[^>]*>\s*?\n?/g,
    () => {
      removedPreloads += 1
      return ''
    },
  )
  return { html: withoutPreloads, removedScripts, removedPreloads }
}

/** Insert a snippet immediately before `</head>` (first occurrence). */
export const injectBeforeHeadEnd = (html: string, snippet: string): string => {
  const index = html.indexOf('</head>')
  if (index === -1) return html
  return `${html.slice(0, index)}${snippet}\n${html.slice(index)}`
}

/** Asset URLs (module scripts + modulepreloads) referenced by a page. */
export const extractAppAssets = (appHtml: string): string[] => {
  const assets = new Set<string>()
  for (const match of appHtml.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g)) {
    assets.add(match[1])
  }
  for (const match of appHtml.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/g)) {
    assets.add(match[1])
  }
  return [...assets]
}

/** Prefetch hints so the landing → /app hop starts with warm caches. */
export const buildPrefetchSnippet = (assets: string[]): string =>
  assets
    .map((href) => `<link rel="prefetch" href="${href}" as="script" crossorigin="anonymous">`)
    .join('\n')

/** Map a dist-relative HTML path to its route ('index.html' → '/'). */
export const htmlFileToRoute = (relativePath: string): string => {
  const normalized = relativePath.replace(/\\/g, '/')
  if (normalized === 'index.html') return '/'
  if (normalized.endsWith('/index.html')) return `/${normalized.slice(0, -'/index.html'.length)}`
  return `/${normalized.replace(/\.html$/, '')}`
}

const EXCLUDED_FROM_SITEMAP = new Set(['/app', '/404', '/404.html'])

export interface SitemapUrl {
  loc: string
  alternates?: { hreflang: string; href: string }[]
}

/**
 * Turn the list of prerendered routes into sitemap entries. `/ar/x` pages are
 * folded into their English counterpart as hreflang alternates (and also
 * listed as their own URL, per Google's bidirectional-annotation requirement).
 */
export const collectSitemapUrls = (routes: string[], origin: string = SITE_ORIGIN): SitemapUrl[] => {
  const routeSet = new Set(routes)
  const absolute = (route: string): string => (route === '/' ? `${origin}/` : `${origin}${route}`)

  return routes
    .filter((route) => !EXCLUDED_FROM_SITEMAP.has(route))
    .map((route) => {
      const isArabic = route === '/ar' || route.startsWith('/ar/')
      const counterpart = isArabic ? (route === '/ar' ? '/' : route.slice(3)) : route === '/' ? '/ar' : `/ar${route}`
      if (!routeSet.has(counterpart)) return { loc: absolute(route) }
      const en = isArabic ? counterpart : route
      const ar = isArabic ? route : counterpart
      return {
        loc: absolute(route),
        alternates: [
          { hreflang: 'en', href: absolute(en) },
          { hreflang: 'ar', href: absolute(ar) },
          { hreflang: 'x-default', href: absolute(en) },
        ],
      }
    })
    .sort((a, b) => a.loc.localeCompare(b.loc))
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const buildSitemapXml = (urls: SitemapUrl[], lastmod: string): string => {
  const entries = urls
    .map((url) => {
      const alternates = (url.alternates ?? [])
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}"/>`,
        )
        .join('\n')
      return [
        '  <url>',
        `    <loc>${escapeXml(url.loc)}</loc>`,
        alternates,
        `    <lastmod>${lastmod}</lastmod>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entries,
    '</urlset>',
    '',
  ].join('\n')
}

export const buildRobotsTxt = (origin: string = SITE_ORIGIN): string =>
  ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')
