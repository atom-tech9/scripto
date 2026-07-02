import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { Dialog } from './Dialog'
import { Button } from './Button'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

interface PendingState extends ConfirmOptions {
  open: boolean
  resolve: (value: boolean) => void
}

/** Provides an imperative, promise-based `confirm()` backed by a styled dialog. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const [state, setState] = useState<PendingState | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, open: true, resolve })
    })
  }, [])

  const settle = useCallback(
    (result: boolean) => {
      setState((prev) => {
        prev?.resolve(result)
        return prev ? { ...prev, open: false } : null
      })
    },
    [],
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={state?.open ?? false}
        onClose={() => settle(false)}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => settle(false)}>
              {state?.cancelLabel ?? t('confirm.cancel')}
            </Button>
            <Button
              variant={state?.destructive ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => settle(true)}
              autoFocus
            >
              {state?.confirmLabel ?? t('confirm.confirm')}
            </Button>
          </>
        }
      >
        <div className="flex gap-3.5">
          {state?.destructive && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle size={20} />
            </div>
          )}
          <div className="space-y-1 pt-0.5">
            <h2 className="text-base font-semibold text-foreground">{state?.title}</h2>
            {state?.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{state.description}</p>
            )}
          </div>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

/** Access the imperative confirm function. Throws if used outside the provider. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
