import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import { DEFAULT_CONFIG } from '@/lib/constants'
import { buildPageCss } from '@/pdf/pageStyles'
import type { PdfConfig } from '@/types'

export const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '')
const FIXTURES = `${ROOT}/tests/visual/fixtures`

/** Chrome locations to try, in order, when CHROME_PATH is not set. */
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

/** Resolve a headless Chrome binary, or null when none is installed. */
export function findChrome(): string | null {
  const fromEnv = process.env.CHROME_PATH
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  return CHROME_CANDIDATES.find((path) => existsSync(path)) ?? null
}

/**
 * Every code line in a fenced block, in source order, for the whole document.
 *
 * An unclosed fence runs to the end of the document (CommonMark 4.5), and the
 * `tables` fixture has one on purpose. Matching only closed fences made this
 * report nothing while the renderer correctly emitted the block, so the suite
 * blamed the renderer for the harness's own reading of the source.
 */
export function sourceCodeLines(markdown: string): string[] {
  const lines: string[] = []
  const fence = /^([ \t]*)(?:```|~~~)([^\n]*)\n([\s\S]*?)(?:^[ \t]*(?:```|~~~)[ \t]*$|(?![\s\S]))/gm
  for (const match of markdown.matchAll(fence)) {
    const language = match[2].trim().split(/\s+/)[0] ?? ''
    // Mermaid and ASCII fences render as figures, not `.code-line` runs.
    if (language === 'mermaid') continue
    // An indented opening fence strips up to that much leading whitespace from
    // every content line (CommonMark 4.5). The renderer does this; reading the
    // raw source without it made correct output look like a rendering bug.
    const indent = match[1].length
    const strip = (line: string) => line.replace(new RegExp(`^[ \\t]{0,${indent}}`), '')
    lines.push(...match[3].replace(/\n$/, '').split('\n').map(strip))
  }
  return lines
}

/** What the in-page probe reports back after pagination settles. */
export interface PageReport {
  pages: number
  /** Elements sticking out past the page content box, per page. */
  overflowing: { page: number; tag: string; cls: string; by: number }[]
  /** Rendered code lines, in page then document order. */
  codeLines: { line: number; text: string }[]
  /** Any element whose text was dropped by the paginator. */
  emptiedElements: string[]
}

/**
 * Paged.js preloads every @font-face before it lays out, and stalls silently —
 * zero pages, no error — when a face cannot load. KaTeX ships relative font
 * URLs that resolve nowhere from a temp page, and Chrome blocks file:// fetches
 * across directories anyway, so the faces are embedded instead. Data URIs also
 * keep the real glyph metrics, without which the math-overflow assertions would
 * be measuring a fallback font.
 */
function inlineKatexFonts(): string {
  const dist = `${ROOT}/node_modules/katex/dist`
  const css = readFileSync(`${dist}/katex.min.css`, 'utf8')
  return css.replace(/@font-face\{[^}]*\}/g, (face) => {
    const woff2 = face.match(/url\(fonts\/([\w-]+\.woff2)\)/)
    if (!woff2) return ''
    const data = readFileSync(`${dist}/fonts/${woff2[1]}`).toString('base64')
    return face.replace(/src:[^;}]+/, `src:url(data:font/woff2;base64,${data}) format("woff2")`)
  })
}

/**
 * Bundle the export-time DOM transforms for the browser. The harness runs the
 * real `buildExportContent` pipeline rather than a copy of it, so a regression
 * in chunking or table labelling fails here too.
 */
async function bundleTransforms(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'scripto-visual-'))
  const entry = join(dir, 'entry.ts')
  const out = join(dir, 'out.js')
  writeFileSync(
    entry,
    `import { prepareForPaging } from '${ROOT}/src/pdf/prepareForPaging'
     import { flattenImages } from '${ROOT}/src/pdf/flattenImages'
     window.__prepare = (config) => {
       // Same order as renderPaged: chunk and stack, then flatten images once
       // they have loaded and can report an intrinsic size.
       document.querySelectorAll('.scripto-doc').forEach((doc) => {
         prepareForPaging(doc, config)
         flattenImages(doc)
       })
       document.documentElement.dataset.scriptoPrepared = 'yes'
     }`,
  )
  await build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    format: 'iife',
    alias: { '@': `${ROOT}/src` },
    logLevel: 'silent',
  })
  return readFileSync(out, 'utf8')
}

/**
 * Assemble a self-contained page that renders `markdown` exactly the way the
 * export does — same stylesheet, same page CSS, same DOM transforms, same
 * paginator — then probes the laid-out result.
 */
async function buildHarnessPage(
  markdown: string,
  config: PdfConfig,
  rtl: boolean,
): Promise<string> {
  const body = renderToStaticMarkup(
    createElement((await import('@/markdown/MarkdownRenderer')).MarkdownRenderer, {
      content: markdown,
      resolvedTheme: 'light',
    }),
  )
  const documentCss = readFileSync(`${ROOT}/src/styles/document.css`, 'utf8')
  const katexCss = inlineKatexFonts()
  const printCss = readFileSync(`${ROOT}/src/styles/print.css`, 'utf8')
  const polyfill = readFileSync(`${ROOT}/node_modules/pagedjs/dist/paged.polyfill.js`, 'utf8')
  const transforms = await bundleTransforms()

  return `<!doctype html><meta charset="utf-8">
<style>
body { margin: 0; background: #eef1f6; }
${katexCss}
${documentCss.replace(/@import[^;]+;/g, '')}
${printCss}
${buildPageCss(config)}
</style>
<div class="scripto-print-surface">
  <div class="scripto-doc"${rtl ? ' dir="rtl" style="direction:rtl"' : ''}>${body}</div>
</div>
<script>${transforms}</script>
<script>
  const fail = (message) => {
    const out = document.createElement('pre')
    out.id = 'scripto-probe-result'
    out.textContent = JSON.stringify({ error: String(message) })
    document.body.appendChild(out)
  }
  window.addEventListener('error', (event) => fail(event.message))
  window.addEventListener('unhandledrejection', (event) => fail(event.reason && event.reason.stack || event.reason))
  // PagedConfig.before runs while the source DOM is still intact, so the
  // export's own transforms are applied exactly as in production; .after fires
  // once pagination has finished, which avoids racing a timer.
  window.PagedConfig = {
    before: () => window.__prepare(${JSON.stringify(config)}),
    after: () => probe(),
  }

  const probe = () => {
    const pages = [...document.querySelectorAll('.pagedjs_page')]
    const report = { pages: pages.length, overflowing: [], codeLines: [], emptiedElements: [],
      imgs: document.querySelectorAll('.scripto-doc img').length,
      imgBoxes: document.querySelectorAll('.scripto-doc div[role="img"]').length }

    pages.forEach((page, index) => {
      const content = page.querySelector('.pagedjs_page_content')
      if (!content) return
      const box = content.getBoundingClientRect()

      page.querySelectorAll('.scripto-doc *').forEach((el) => {
        // KaTeX ships a MathML twin of every formula for screen readers. It is
        // hidden by clipping rather than by zero size, so it still measures at
        // full width and reported dozens of overflows that no reader can see.
        if (el.closest('.katex-mathml')) return
        const r = el.getBoundingClientRect()
        if (r.width <= 0 || r.height <= 0) return
        const by = Math.round(Math.max(r.right - box.right, box.left - r.left))
        // Ignore sub-pixel rounding; anything more is real clipping.
        if (by > 2) {
          report.overflowing.push({
            page: index + 1,
            tag: el.tagName.toLowerCase(),
            cls: el.className.toString().slice(0, 60),
            by,
          })
        }
      })

      page.querySelectorAll('.code-line[line]').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.height <= 0 || r.top < box.top - 1 || r.bottom > box.bottom + 1) return
        report.codeLines.push({ line: Number(el.getAttribute('line')), text: el.textContent ?? '' })
      })
    })

    // Paged.js replaces the body with its own pages, so the probe element can
    // only be created once it is done.
    const out = document.createElement('pre')
    out.id = 'scripto-probe-result'
    out.textContent = JSON.stringify(report)
    document.body.appendChild(out)
  }
</script>
<script type="text/plain" id="pagedjs-src">${polyfill}</script>
<script>
  // Paged.js must not start until every image has loaded: the export transforms
  // a clone of an on-screen document, so its images always report intrinsic
  // sizes, and flattenImages needs the same guarantee here. Waiting on load
  // rather than decode() -- decode() on a not-yet-rendered document can never
  // settle, which stalls the whole polyfill before it lays out a single page.
  (async () => {
    document.documentElement.dataset.step = 'start'
    await Promise.all(
      [...document.images].map((img) => {
        // renderPaged does the same: a lazy image below the fold never loads,
        // so it would report no intrinsic size and hang this wait forever.
        img.loading = 'eager'
        img.decoding = 'sync'
        if (img.complete && img.naturalWidth) return null
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve
          setTimeout(resolve, 5000)
        })
      }),
    )
    document.documentElement.dataset.step = 'images-loaded'
    const script = document.createElement('script')
    script.textContent = document.getElementById('pagedjs-src').textContent
    document.body.appendChild(script)
    document.documentElement.dataset.step = 'injected'
  })().catch((e) => { document.documentElement.dataset.step = 'threw:' + e })
</script>`
}

/** How long to wait for Paged.js to finish laying a fixture out. */
const PROBE_TIMEOUT_MS = Number(process.env.SCRIPTO_VISUAL_TIMEOUT_MS) || 180_000
const PROBE_POLL_MS = 250

interface CdpTarget {
  type: string
  webSocketDebuggerUrl?: string
}

/** Minimal DevTools Protocol client: enough to evaluate one expression. */
class CdpSession {
  private readonly socket: WebSocket
  private nextId = 1
  private readonly pending = new Map<number, (result: unknown) => void>()

  private constructor(socket: WebSocket) {
    this.socket = socket
    this.socket.addEventListener('message', (event) => {
      const frame = JSON.parse(String((event as MessageEvent).data)) as {
        id?: number
        result?: unknown
      }
      if (frame.id === undefined) return
      this.pending.get(frame.id)?.(frame.result)
      this.pending.delete(frame.id)
    })
  }

  static async connect(url: string): Promise<CdpSession> {
    const socket = new WebSocket(url)
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener('open', () => resolve(), { once: true })
      socket.addEventListener('error', () => reject(new Error('CDP socket failed')), { once: true })
    })
    return new CdpSession(socket)
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = this.nextId++
    return new Promise((resolve) => {
      this.pending.set(id, resolve)
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close(): void {
    this.socket.close()
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Poll DevTools for the debugging port Chrome wrote into its profile. */
async function readDevToolsPort(profile: string): Promise<number> {
  const file = join(profile, 'DevToolsActivePort')
  for (let attempt = 0; attempt < 120; attempt++) {
    if (existsSync(file)) {
      const port = Number(readFileSync(file, 'utf8').split('\n')[0])
      if (Number.isFinite(port) && port > 0) return port
    }
    await delay(100)
  }
  throw new Error('Chrome never reported a DevTools port')
}

async function findPageTarget(port: number): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`)
    const targets = (await response.json()) as CdpTarget[]
    const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
    if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    await delay(100)
  }
  throw new Error('no DevTools page target appeared')
}

/**
 * Render a fixture through the full export pipeline and report the layout.
 *
 * Driven over the DevTools Protocol rather than `--dump-dom`: Chrome 132
 * removed the old headless mode, and the new one ignores
 * `--virtual-time-budget`, so a DOM dump snapshots the page long before
 * Paged.js has finished paginating. Polling for the probe element waits for the
 * real thing instead of a timer.
 */
export async function paginate(
  fixture: string,
  overrides: Partial<PdfConfig> = {},
  options: { timeoutMs?: number } = {},
): Promise<PageReport> {
  const chrome = findChrome()
  if (!chrome) throw new Error('no Chrome binary found')

  const config = { ...DEFAULT_CONFIG, ...overrides } as PdfConfig
  const markdown = readFileSync(`${FIXTURES}/${fixture}.md`, 'utf8')
  const html = await buildHarnessPage(markdown, config, fixture.startsWith('rtl'))

  const dir = mkdtempSync(join(tmpdir(), 'scripto-page-'))
  const page = join(dir, `${fixture}.html`)
  writeFileSync(page, html)

  const profile = mkdtempSync(join(tmpdir(), 'scripto-profile-'))
  const browser = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-first-run',
      '--disable-extensions',
      '--force-device-scale-factor=1',
      `--user-data-dir=${profile}`,
      '--remote-debugging-port=0',
      `file://${page}`,
    ],
    { stdio: 'ignore' },
  )

  let session: CdpSession | undefined
  try {
    const port = await readDevToolsPort(profile)
    session = await CdpSession.connect(await findPageTarget(port))

    const deadline = Date.now() + (options.timeoutMs ?? PROBE_TIMEOUT_MS)
    while (Date.now() < deadline) {
      const result = (await session.send('Runtime.evaluate', {
        expression: "document.getElementById('scripto-probe-result')?.textContent ?? ''",
        returnByValue: true,
      })) as { result?: { value?: string } } | undefined
      const value = result?.result?.value
      if (value) {
        const report = JSON.parse(value) as PageReport & { error?: string }
        if (report.error) throw new Error(`pagination failed: ${report.error}`)
        return report
      }
      await delay(PROBE_POLL_MS)
    }

    if (process.env.SCRIPTO_VISUAL_DEBUG) {
      // eslint-disable-next-line no-console
      console.error(`[visual] page kept at ${page}`)
    }
    // A stall leaves no probe element, so report what the page did manage --
    // how far the chunker got, and whether the DOM transforms ran at all.
    const snapshot = (await session.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        pages: document.querySelectorAll('.pagedjs_page').length,
        imgs: document.querySelectorAll('img').length,
        imgBoxes: document.querySelectorAll('div[role="img"]').length,
        prepared: document.documentElement.dataset.scriptoPrepared ?? 'no',
        step: document.documentElement.dataset.step ?? 'never-ran',
      })`,
      returnByValue: true,
    })) as { result?: { value?: string } } | undefined
    throw new Error(`probe produced no output; page state: ${snapshot?.result?.value ?? 'unknown'}`)
  } finally {
    session?.close()
    browser.kill('SIGKILL')
  }
}

export const fixtureSource = (fixture: string): string =>
  readFileSync(`${FIXTURES}/${fixture}.md`, 'utf8')
