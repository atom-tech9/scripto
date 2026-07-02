import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
}: DialogProps) {
  const { t } = useLanguage()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
            className={cn(
              'relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl',
              sizeClass[size],
              className,
            )}
          >
            {(title || description) && (
              <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
                  {description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('ui.close')}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </header>
            )}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <footer className="flex justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
