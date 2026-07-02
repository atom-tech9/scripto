import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { transitionSpring } from '@/lib/motion'
import { useLanguage } from '@/i18n'

export interface Command {
  id: string
  label: string
  hint?: string
  group: string
  icon: LucideIcon
  keywords?: string
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands: Command[]
}

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q),
    )
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filtered[active]
        if (cmd) {
          onClose()
          cmd.run()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, filtered, active, onClose])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('palette.title')}
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={transitionSpring}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search size={18} className="text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('palette.placeholder')}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>
            <div ref={listRef} className="scrollbar-thin max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {t('palette.empty')}
                </p>
              ) : (
                filtered.map((cmd, i) => {
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={() => {
                        onClose()
                        cmd.run()
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors active:scale-[0.99] motion-reduce:active:scale-100',
                        i === active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted',
                      )}
                    >
                      <Icon size={16} />
                      <span className="flex-1">{cmd.label}</span>
                      <span
                        className={cn(
                          'text-xs',
                          i === active ? 'text-primary-foreground/70' : 'text-muted-foreground',
                        )}
                      >
                        {cmd.hint ?? cmd.group}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
