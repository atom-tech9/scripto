import { describe, expect, it } from 'vitest'
import {
  buildPrefetchSnippet,
  buildRobotsTxt,
  buildSitemapXml,
  collectSitemapUrls,
  extractAppAssets,
  htmlFileToRoute,
  injectBeforeHeadEnd,
  stripHydrationArtifacts,
} from '../src/seo/postbuild'

const PAGE = `<!doctype html>
<html class="dark"><head>
<script type="module" crossorigin src="/assets/index-abc.js"></script>
<link rel="modulepreload" crossorigin href="/assets/react-def.js">
<link rel="stylesheet" href="/assets/index-xyz.css">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">{"@context":"https://schema.org"}</script>
</head><body><div id="root"><h1>Hello</h1></div></body></html>`

describe('stripHydrationArtifacts', () => {
  it('removes module scripts and modulepreload links only', () => {
    const result = stripHydrationArtifacts(PAGE)
    expect(result.removedScripts).toBe(1)
    expect(result.removedPreloads).toBe(1)
    expect(result.html).not.toContain('type="module"')
    expect(result.html).not.toContain('modulepreload')
    // Inline enhancement script, JSON-LD, and stylesheet survive.
    expect(result.html).toContain("classList.add('js')")
    expect(result.html).toContain('application/ld+json')
    expect(result.html).toContain('stylesheet')
    expect(result.html).toContain('<h1>Hello</h1>')
  })

  it('is a no-op on already-clean HTML', () => {
    const clean = '<html><head></head><body>x</body></html>'
    const result = stripHydrationArtifacts(clean)
    expect(result.html).toBe(clean)
    expect(result.removedScripts).toBe(0)
  })

  it('refuses (loudly) to strip module scripts with inline bodies', () => {
    const inline = '<script type="module">const s = "</scr" + "ipt>";</script>'
    expect(() => stripHydrationArtifacts(inline)).toThrow(/non-empty body/)
  })
})

describe('injectBeforeHeadEnd', () => {
  it('injects immediately before </head>', () => {
    const html = '<html><head><title>t</title></head><body></body></html>'
    const out = injectBeforeHeadEnd(html, '<meta name="x">')
    expect(out.indexOf('<meta name="x">')).toBeLessThan(out.indexOf('</head>'))
    expect(out.match(/<meta name="x">/g)).toHaveLength(1)
  })

  it('returns input unchanged when </head> is missing', () => {
    expect(injectBeforeHeadEnd('<body></body>', 'x')).toBe('<body></body>')
  })
})

describe('extractAppAssets + buildPrefetchSnippet', () => {
  it('collects module script src and modulepreload href without duplicates', () => {
    const appHtml = `
      <script type="module" crossorigin src="/assets/index-abc.js"></script>
      <link rel="modulepreload" crossorigin href="/assets/react-def.js">
      <link rel="modulepreload" crossorigin href="/assets/react-def.js">`
    const assets = extractAppAssets(appHtml)
    expect(assets).toEqual(['/assets/index-abc.js', '/assets/react-def.js'])
    const snippet = buildPrefetchSnippet(assets)
    expect(snippet).toContain('rel="prefetch"')
    expect(snippet.match(/<link/g)).toHaveLength(2)
  })
})

describe('htmlFileToRoute', () => {
  it('maps nested index.html files to routes', () => {
    expect(htmlFileToRoute('index.html')).toBe('/')
    expect(htmlFileToRoute('markdown-to-pdf/index.html')).toBe('/markdown-to-pdf')
    expect(htmlFileToRoute('ar/markdown-to-pdf-arabic/index.html')).toBe('/ar/markdown-to-pdf-arabic')
    expect(htmlFileToRoute('404.html')).toBe('/404')
  })
})

describe('collectSitemapUrls', () => {
  const routes = ['/', '/ar', '/app', '/404', '/markdown-to-pdf', '/markdown-to-pdf-arabic', '/ar/markdown-to-pdf-arabic']
  const urls = collectSitemapUrls(routes, 'https://example.com')

  it('excludes /app and /404', () => {
    const locs = urls.map((url) => url.loc)
    expect(locs).not.toContain('https://example.com/app')
    expect(locs.some((loc) => loc.includes('404'))).toBe(false)
    expect(locs).toHaveLength(5)
  })

  it('emits bidirectional hreflang clusters for translated pages', () => {
    const en = urls.find((url) => url.loc === 'https://example.com/markdown-to-pdf-arabic')
    const ar = urls.find((url) => url.loc === 'https://example.com/ar/markdown-to-pdf-arabic')
    expect(en?.alternates).toBeDefined()
    expect(ar?.alternates).toBeDefined()
    expect(en?.alternates).toEqual(ar?.alternates)
    expect(en?.alternates?.find((alt) => alt.hreflang === 'x-default')?.href).toBe(
      'https://example.com/markdown-to-pdf-arabic',
    )
    // Root pairs with /ar.
    const root = urls.find((url) => url.loc === 'https://example.com/')
    expect(root?.alternates?.find((alt) => alt.hreflang === 'ar')?.href).toBe('https://example.com/ar')
  })

  it('leaves untranslated pages without alternates', () => {
    const plain = urls.find((url) => url.loc === 'https://example.com/markdown-to-pdf')
    expect(plain?.alternates).toBeUndefined()
  })
})

describe('buildSitemapXml / buildRobotsTxt', () => {
  it('produces valid-looking XML with alternates and lastmod', () => {
    const xml = buildSitemapXml(
      [
        { loc: 'https://example.com/' },
        {
          loc: 'https://example.com/ar',
          alternates: [{ hreflang: 'en', href: 'https://example.com/?a=1&b=2' }],
        },
      ],
      '2026-07-02',
    )
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('xmlns:xhtml')
    expect(xml).toContain('<lastmod>2026-07-02</lastmod>')
    expect(xml).toContain('hreflang="en"')
    // Ampersands must be escaped.
    expect(xml).toContain('&amp;b=2')
    expect(xml).not.toContain('?a=1&b=2"')
  })

  it('robots.txt allows everything and points at the sitemap', () => {
    const robots = buildRobotsTxt('https://example.com')
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://example.com/sitemap.xml')
  })
})
