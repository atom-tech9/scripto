import { Suspense, lazy } from 'react'
import { ClientOnly, Head } from 'vite-react-ssg'

const AppShell = lazy(() => import('./AppShell'))

/**
 * Splash shown in the prerendered /app HTML and while the editor chunk loads.
 * `body.app-shell` (set by AppShell on mount) hides it via CSS.
 */
function Splash() {
  return (
    <div className="app-splash" role="status" aria-label="Loading Scripto">
      <img src="/logo-192.png" alt="" width={64} height={64} />
      <p>Scripto</p>
      <noscript>
        <p style={{ maxInlineSize: '38ch', textAlign: 'center' }}>
          Scripto is an interactive Markdown → PDF studio and needs JavaScript. Please enable it, or
          read about the product on the <a href="/">home page</a>.
        </p>
      </noscript>
    </div>
  )
}

export function AppPage() {
  return (
    <>
      <Head>
        <title>Scripto Studio — Markdown Editor & PDF Export</title>
        <meta name="robots" content="noindex, follow" />
        <meta
          name="description"
          content="The Scripto editor: write Markdown, preview real pages, export a pixel-perfect PDF — free and 100% in your browser."
        />
        <link rel="canonical" href="https://md.atom.sa/app" />
      </Head>
      <Splash />
      <ClientOnly>
        {() => (
          <Suspense fallback={null}>
            <AppShell />
          </Suspense>
        )}
      </ClientOnly>
    </>
  )
}

export const Component = AppPage
