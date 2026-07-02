import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  className?: string
}

/** A small accessible dropdown menu with click-outside and Escape handling. */
export function Menu({ trigger, children, align = 'right', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-xl',
              align === 'right' ? 'end-0' : 'start-0',
              className,
            )}
            role="menu"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MenuItemProps {
  icon?: ReactNode
  children: ReactNode
  onClick: () => void
  hint?: string
}

export function MenuItem({ icon, children, onClick, hint }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm text-foreground transition-colors hover:bg-muted active:scale-[0.98] motion-reduce:active:scale-100"
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </button>
  )
}
