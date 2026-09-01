import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { SKIN_OPTIONS } from '@/data/skins'
import { STAGES } from '@/preview/stage/stages'
import { useLanguage } from '@/i18n'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { cn } from '@/lib/utils'
import type { DocumentSkin } from '@/types'

interface SkinRailProps {
  /** The committed skin — what the rail marks as selected. */
  skin: DocumentSkin
  /** Applies a skin to the live preview only; null restores the committed one. */
  onPreview: (skin: DocumentSkin | null) => void
  onCommit: (skin: DocumentSkin) => void
}

/**
 * Hover to try a skin, click to keep it.
 *
 * Thumbnails are static CSS: each one inherits the stage's `--stage-*` tokens
 * from its `data-stage` attribute, so all 21 render without mounting a single
 * Markdown renderer.
 */
export const SkinRail = memo(function SkinRail({ skin, onPreview, onCommit }: SkinRailProps) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useLocalStorage('scripto:preview-rail', true)
  const [active, setActive] = useState(() => SKIN_OPTIONS.findIndex((o) => o.value === skin))
  const listRef = useRef<HTMLDivElement>(null)

  // Keep the roving tabindex on the committed skin when it changes elsewhere.
  useEffect(() => {
    const index = SKIN_OPTIONS.findIndex((option) => option.value === skin)
    if (index >= 0) setActive(index)
  }, [skin])

  // A collapsed rail must not leave a hover preview applied behind it.
  useEffect(() => {
    if (!expanded) onPreview(null)
  }, [expanded, onPreview])

  const focusAt = useCallback((index: number) => {
    const options = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')
    options?.[index]?.focus()
  }, [])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const last = SKIN_OPTIONS.length - 1
      let next: number | null = null
      if (event.key === 'ArrowDown') next = active >= last ? 0 : active + 1
      else if (event.key === 'ArrowUp') next = active <= 0 ? last : active - 1
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = last
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onCommit(SKIN_OPTIONS[active].value)
        return
      } else if (event.key === 'Escape') {
        onPreview(null)
        return
      }
      if (next === null) return
      event.preventDefault()
      setActive(next)
      onPreview(SKIN_OPTIONS[next].value)
      focusAt(next)
    },
    [active, focusAt, onCommit, onPreview],
  )

  return (
    <div
      className={cn('stage-rail', expanded ? 'w-[68px]' : 'w-8')}
      onMouseLeave={() => onPreview(null)}
    >
      <div className="flex w-full flex-col border-s border-border/70 bg-surface/70 backdrop-blur">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={expanded ? t('preview.rail.collapse') : t('preview.rail.expand')}
          className="flex h-8 shrink-0 items-center justify-center border-b border-border/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {expanded ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>

        {expanded && (
          <div
            ref={listRef}
            role="listbox"
            aria-label={t('preview.rail.title')}
            aria-orientation="vertical"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-1.5"
          >
            {SKIN_OPTIONS.map((option, index) => {
              const selected = option.value === skin
              const label = t(option.labelKey).split(' — ')[0]
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  title={`${label} · ${t(STAGES[option.value].nameKey)}`}
                  tabIndex={index === active ? 0 : -1}
                  data-stage={option.value}
                  onMouseEnter={() => onPreview(option.value)}
                  onFocus={() => {
                    setActive(index)
                    onPreview(option.value)
                  }}
                  onBlur={(event) => {
                    if (!listRef.current?.contains(event.relatedTarget as Node)) onPreview(null)
                  }}
                  onClick={() => onCommit(option.value)}
                  className={cn('skin-thumb', selected && 'skin-thumb--selected')}
                >
                  <span className="skin-thumb__sheet" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="sr-only">{label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})
