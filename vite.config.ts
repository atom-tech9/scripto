import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA, type VitePluginPWAAPI } from 'vite-plugin-pwa'
// Importing the type activates vite-react-ssg's `ssgOptions` UserConfig augmentation.
import type { ViteReactSSGOptions } from 'vite-react-ssg'
import {
  VERCEL_ANALYTICS_SNIPPET,
  buildPrefetchSnippet,
  buildRobotsTxt,
  buildSitemapXml,
  collectSitemapUrls,
  extractAppAssets,
  htmlFileToRoute,
  injectBeforeHeadEnd,
  stripHydrationArtifacts,
} from './src/seo/postbuild.ts'

const log = (message: string): void => {
  process.stdout.write(`[scripto-seo] ${message}\n`)
}

const walkHtmlFiles = (root: string, dir = root): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkHtmlFiles(root, full)
    return entry.isFile() && entry.name.endsWith('.html') ? [path.relative(root, full)] : []
  })

const pwa = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon-64.png', 'logo.webp', 'logo-192.png', 'logo-512.png', 'atom-logo.png'],
  manifest: {
    name: 'Scripto — Markdown to PDF',
    short_name: 'Scripto',
    description: 'A world-class Markdown editor with pixel-perfect, paginated PDF export.',
    theme_color: '#6366f1',
    background_color: '#0b0f17',
    display: 'standalone',
    // The editor lives at /app now; the root is the static marketing site.
    start_url: '/app',
    scope: '/',
    icons: [
      { src: 'logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: 'logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
  workbox: {
    // Precache the app shell + assets and the two landing pages (for offline
    // PWA startup at '/'), but not the dozens of marketing pages.
    globPatterns: ['**/*.{js,css,svg,png,webp,woff,woff2}', 'index.html', 'ar/index.html', 'app/index.html'],
    navigateFallback: '/app/index.html',
    navigateFallbackAllowlist: [/^\/app/],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cdn-assets',
          expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})

let strippedPages = 0
let removedScriptTags = 0

const ssgOptions: ViteReactSSGOptions = {
  entry: 'src/main.tsx',
  dirStyle: 'nested',
  concurrency: 12,
  onPageRendered(route, renderedHTML) {
    // /app keeps its scripts; its analytics come from <Analytics/> in AppShell.
    if (route === '/app' || route.startsWith('/app/')) return renderedHTML
    const stripped = stripHydrationArtifacts(renderedHTML)
    strippedPages += 1
    removedScriptTags += stripped.removedScripts + stripped.removedPreloads
    return injectBeforeHeadEnd(stripped.html, VERCEL_ANALYTICS_SNIPPET)
  },
  async onFinished(dir) {
    const htmlFiles = walkHtmlFiles(dir)
    const routes = htmlFiles.map(htmlFileToRoute)

    // 1. Vercel serves dist/404.html for unmatched URLs.
    const notFoundSource = path.join(dir, '404', 'index.html')
    if (fs.existsSync(notFoundSource)) {
      fs.copyFileSync(notFoundSource, path.join(dir, '404.html'))
    }

    // 2. Warm the landing → /app hop with prefetch hints.
    const appShellPath = path.join(dir, 'app', 'index.html')
    if (fs.existsSync(appShellPath)) {
      // Entry scripts come first in the extraction; a dozen hints is enough to
      // warm the /app hop without competing with the landing page's own load.
      const assets = extractAppAssets(fs.readFileSync(appShellPath, 'utf8')).slice(0, 12)
      const snippet = buildPrefetchSnippet(assets)
      for (const landing of ['index.html', path.join('ar', 'index.html')]) {
        const landingPath = path.join(dir, landing)
        if (!fs.existsSync(landingPath)) continue
        fs.writeFileSync(
          landingPath,
          injectBeforeHeadEnd(fs.readFileSync(landingPath, 'utf8'), snippet),
        )
      }
      log(`prefetch hints for ${assets.length} app assets injected into landing pages`)
    }

    // 3. sitemap.xml + robots.txt from the actual prerendered output.
    const sitemapUrls = collectSitemapUrls(routes)
    const lastmod = new Date().toISOString().slice(0, 10)
    fs.writeFileSync(path.join(dir, 'sitemap.xml'), buildSitemapXml(sitemapUrls, lastmod))
    fs.writeFileSync(path.join(dir, 'robots.txt'), buildRobotsTxt())

    const counts = {
      total: routes.length,
      templates: routes.filter((route) => route.startsWith('/templates/')).length,
      skins: routes.filter((route) => route.startsWith('/skins/')).length,
      blog: routes.filter((route) => route.startsWith('/blog/')).length,
      arabic: routes.filter((route) => route === '/ar' || route.startsWith('/ar/')).length,
    }
    log(
      `prerendered ${counts.total} pages (templates: ${counts.templates}, skins: ${counts.skins}, ` +
        `blog posts: ${counts.blog}, arabic: ${counts.arabic})`,
    )
    log(`stripped hydration JS from ${strippedPages} marketing pages (${removedScriptTags} tags removed)`)
    log(`sitemap.xml: ${sitemapUrls.length} URLs · robots.txt written`)

    // 4. Regenerate the service worker so its precache manifest includes the
    //    HTML files created after the client build (vite-plugin-pwa runs
    //    before SSG rendering otherwise).
    const api = pwa
      .map((plugin) => (plugin as { api?: VitePluginPWAAPI }).api)
      .find((candidate): candidate is VitePluginPWAAPI => Boolean(candidate))
    if (api && !api.disabled) {
      await api.generateSW()
      log('service worker regenerated with final precache manifest')
    }
  },
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), pwa],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ssgOptions,
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // manualChunks only applies to the client build — in the SSR pass
        // react is external and rollup rejects externals in manual chunks.
        manualChunks: isSsrBuild
          ? undefined
          : {
              react: ['react', 'react-dom'],
              codemirror: [
                '@uiw/react-codemirror',
                '@codemirror/lang-markdown',
                '@codemirror/language-data',
              ],
              markdown: ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex'],
            },
      },
    },
  },
}))
