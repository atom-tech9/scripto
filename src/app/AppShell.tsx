import { useLayoutEffect } from 'react'
import { MotionConfig } from 'motion/react'
import '../styles/document.css'
import '../styles/print.css'
import { AppRoot } from '../AppRoot'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ConfirmProvider } from '../components/ui/Confirm'
import { LanguageProvider } from '../i18n'
import { ModeProvider } from '../mode'

/**
 * The full editor with its provider stack. Loaded lazily, client-only, so the
 * prerendered marketing pages and the /app shell HTML never evaluate editor
 * code (localStorage, Paged.js, CodeMirror) during static generation.
 */
export default function AppShell() {
  // The editor needs the locked viewport (h-screen layout); marketing pages
  // need normal document scrolling. Scope the global overflow rules here.
  useLayoutEffect(() => {
    document.body.classList.add('app-shell')
    return () => document.body.classList.remove('app-shell')
  }, [])

  return (
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
  )
}
