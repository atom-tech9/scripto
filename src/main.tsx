import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import './styles/document.css'
import './styles/print.css'
import { AppRoot } from './AppRoot.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ConfirmProvider } from './components/ui/Confirm'
import { LanguageProvider } from './i18n'
import { ModeProvider } from './mode'
import { registerSW } from 'virtual:pwa-register'

// Register the service worker for offline support (auto-updates in the background).
registerSW({ immediate: true })

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ErrorBoundary fallbackTitle="Scripto hit an unexpected error.">
        <LanguageProvider>
          <ModeProvider>
            <ConfirmProvider>
              <AppRoot />
            </ConfirmProvider>
          </ModeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>,
)
