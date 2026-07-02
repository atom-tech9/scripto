import { ViteReactSSG } from 'vite-react-ssg'
import './index.css'
import { routes } from './routes'

/**
 * Site entry. vite-react-ssg prerenders every marketing route to static HTML
 * at build time; in the browser it hydrates only where needed (the /app
 * editor — marketing pages ship without scripts).
 */
export const createRoot = ViteReactSSG({ routes, basename: import.meta.env.BASE_URL }, ({ isClient }) => {
  if (isClient) {
    // Service worker for offline support (auto-updates in the background).
    // Dynamic import keeps the PWA virtual module out of the SSG render.
    void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
  }
})
