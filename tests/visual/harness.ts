import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { execFile } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { build } from 'esbuild'
import { DEFAULT_CONFIG } from '@/lib/constants'
import { buildPageCss } from '@/pdf/pageStyles'
import type { PdfConfig } from '@/types'

const execFileAsync = promisify(execFile)

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

/** Every code line in a fenced block, in source order, for the whole document. */
export function sourceCodeLines(markdown: string): string[] {
  const lines: string[] = []
  const fence = /^([ \t]*)(?:```|~~~)([^\n]*)\n([\s\S]*?)^[ \t]*(?:```|~~~)[ \t]*$/gm
  for (const match of markdown.matchAll(fence)) {
    const language = match[2].trim().split(/\s+/)[0] ?? ''
    // Mermaid and ASCII fences render as figures, not `.code-line` runs.
    if (language === 'mermaid') continue
    lines.push(...match[3].replace(/\n$/, '').split('\n'))
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
    return face.replace(
      /src:[^;}]+/,
      `src:url(data:font/woff2;base64,${data}) format("woff2")`,
    )
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
     window.__prepare = (config) => {
       document.querySelectorAll('.scripto-doc').forEach((doc) => prepareForPaging(doc, config))
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
async function buildHarnessPage(markdown: string, config: PdfConfig, rtl: boolean): Promise<string> {
  const body = renderToStaticMarkup(
    createElement(
      (await import('@/markdown/MarkdownRenderer')).MarkdownRenderer,
      { content: markdown, resolvedTheme: 'light' },
    ),
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
    out.id = 'probe'
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
    const report = { pages: pages.length, overflowing: [], codeLines: [], emptiedElements: [] }

    pages.forEach((page, index) => {
      const content = page.querySelector('.pagedjs_page_content')
      if (!content) return
      const box = content.getBoundingClientRect()

      page.querySelectorAll('.scripto-doc *').forEach((el) => {
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
    out.id = 'probe'
    out.textContent = JSON.stringify(report)
    document.body.appendChild(out)
  }
</script>
<script>${polyfill}</script>`
}

/** Render a fixture through the full export pipeline and report the layout. */
export async function paginate(
  fixture: string,
  overrides: Partial<PdfConfig> = {},
): Promise<PageReport> {
  const chrome = findChrome()
  if (!chrome) throw new Error('no Chrome binary found')

  const config = { ...DEFAULT_CONFIG, ...overrides } as PdfConfig
  const markdown = readFileSync(`${FIXTURES}/${fixture}.md`, 'utf8')
  const html = await buildHarnessPage(markdown, config, fixture.startsWith('rtl'))

  const dir = mkdtempSync(join(tmpdir(), 'scripto-page-'))
  const page = join(dir, `${fixture}.html`)
  writeFileSync(page, html)

  const { stdout } = await execFileAsync(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--virtual-time-budget=120000',
      '--dump-dom',
      `file://${page}`,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  )

  const match = stdout.match(/<pre id="probe">([\s\S]*?)<\/pre>/)
  if (!match || !match[1].trim()) {
    if (process.env.SCRIPTO_VISUAL_DEBUG) {
      // eslint-disable-next-line no-console
      console.error(`[visual] page kept at ${page}`)
    }
    throw new Error('probe produced no output')
  }

  const decoded = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
  const report = JSON.parse(decoded) as PageReport & { error?: string }
  if (report.error) throw new Error(`pagination failed: ${report.error}`)
  return report
}

export const fixtureSource = (fixture: string): string =>
  readFileSync(`${FIXTURES}/${fixture}.md`, 'utf8')
