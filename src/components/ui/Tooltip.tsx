import { useState, type ReactNode } from 'react'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'

interface TooltipProps {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const sideClasses: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

/** Under RTL the logical start/end swap, so a left tooltip renders on the right and vice versa. */
function resolveSide(
  side: NonNullable<TooltipProps['side']>,
  dir: 'ltr' | 'rtl',
): NonNullable<TooltipProps['side']> {
  if (dir !== 'rtl') return side
  if (side === 'left') return 'right'
  if (side === 'right') return 'left'
  return side
}

/** Lightweight, accessible-on-focus tooltip with no external dependency. */
export function Tooltip({ label, children, side = 'bottom', className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const { dir } = useLanguage()

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1',
            'text-xs font-medium text-background shadow-lg animate-fade-in',
            sideClasses[resolveSide(side, dir)],
            className,
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
