import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/Button'
import { translate } from '@/lib/i18n'
import type { UiLanguage } from '@/types'

/**
 * Read the persisted UI language without React context — an error boundary may
 * render after the provider tree has thrown, so it can't rely on the hook.
 */
function persistedLang(): UiLanguage {
  try {
    return (localStorage.getItem('scripto:ui-lang') ?? '').includes('ar') ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  message: string
}

/** Catches render errors in a subtree so a bad document never blanks the app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Render error boundary caught an error', { error, info })
  }

  reset = () => this.setState({ hasError: false, message: '' })

  render(): ReactNode {
    if (this.state.hasError) {
      const lang = persistedLang()
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {this.props.fallbackTitle ?? translate(lang, 'error.boundaryTitle')}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">{this.state.message}</p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            {translate(lang, 'error.tryAgain')}
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
