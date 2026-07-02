import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-64.png', 'logo.webp', 'logo-192.png', 'logo-512.png'],
      manifest: {
        name: 'Scripto — Markdown to PDF',
        short_name: 'Scripto',
        description: 'A world-class Markdown editor with pixel-perfect, paginated PDF export.',
        theme_color: '#6366f1',
        background_color: '#0b0f17',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff,woff2}'],
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
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
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
})
