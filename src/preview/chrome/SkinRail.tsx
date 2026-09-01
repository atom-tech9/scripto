import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { SKIN_GROUPS, SKIN_OPTIONS } from '@/data/skins'
import { STAGES } from '@/preview/stage/stages'
import { useLanguage } from '@/i18n'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { cn } from '@/lib/utils'
import type { DocumentSkin } from '@/types'

interface SkinRailProps {
  /** The committed skin — what the rail marks as selected. */
  skin: DocumentSkin
  /** Keeps the thumbnails on the document's own accent colour. */
  accentColor: string
  /** Applies a skin to the live preview only; null restores the committed one. */
  onPreview: (skin: DocumentSkin | null) => void
  onCommit: (skin: DocumentSkin) => void
}

/**
 * Hover to try a skin, click to keep it.
 *
 * Each thumbnail is a real `.scripto-doc` in that skin, shrunk down — so it
 * shows the actual heading, body and rule treatment rather than an
 * approximation, and a new skin gets a correct thumbnail for free.
 */
export const SkinRail = memo(function SkinRail({
  skin,
  accentColor,
  onPreview,
  onCommit,
}: SkinRailProps) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useLocalStorage('scripto:preview-rail', true)
  const listRef = useRef<HTMLDivElement>(null)

  // Flat, in group order — the order the arrow keys walk.
  const ordered = useMemo(
    () => SKIN_GROUPS.flatMap((group) => SKIN_OPTIONS.filter((o) => o.group === group.id)),
    [],
  )
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      ordered.findIndex((option) => option.value === skin),
    ),
  )

  useEffect(() => {
    const index = ordered.findIndex((option) => option.value === skin)
    if (index >= 0) setActive(index)
  }, [skin, ordered])

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
      const last = ordered.length - 1
      let next: number | null = null
      if (event.key === 'ArrowDown') next = active >= last ? 0 : active + 1
      else if (event.key === 'ArrowUp') next = active <= 0 ? last : active - 1
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = last
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onCommit(ordered[active].value)
        return
      } else if (event.key === 'Escape') {
        onPreview(null)
        return
      }
      if (next === null) return
      event.preventDefault()
      setActive(next)
      onPreview(ordered[next].value)
      focusAt(next)
    },
    [active, ordered, focusAt, onCommit, onPreview],
  )

  return (
    <div
      className={cn('stage-rail', expanded ? 'stage-rail--open' : 'stage-rail--closed')}
      onMouseLeave={() => onPreview(null)}
    >
      <div className="stage-rail__inner">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={expanded ? t('preview.rail.collapse') : t('preview.rail.expand')}
          className="stage-rail__toggle"
        >
          {expanded ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>

        {expanded && (
          <div
            ref={listRef}
            role="listbox"
            aria-label={t('preview.rail.title')}
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="stage-rail__list scrollbar-thin"
          >
            {SKIN_GROUPS.map((group) => (
              <div key={group.id} className="stage-rail__group">
                <div className="stage-rail__groupLabel">{t(group.labelKey)}</div>
                {SKIN_OPTIONS.filter((option) => option.group === group.id).map((option) => {
                  const index = ordered.findIndex((entry) => entry.value === option.value)
                  const selected = option.value === skin
                  const name = t(option.labelKey).split(' — ')[0]
                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={selected}
                      aria-label={name}
                      tabIndex={index === active ? 0 : -1}
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
                      <span className="skin-thumb__paper" aria-hidden>
                        <span
                          className="skin-thumb__doc scripto-doc"
                          data-skin={option.value}
                          data-table-style="lines"
                          data-code-theme="github-light"
                          dir="ltr"
                          style={{ ['--doc-accent' as string]: accentColor }}
                        >
                          <h2>Aa</h2>
                          <p>The quick brown fox jumps over the lazy dog and keeps on running.</p>
                        </span>
                      </span>
                      <span className="skin-thumb__name">{name}</span>
                      <span className="skin-thumb__flyout" aria-hidden>
                        <strong>{name}</strong>
                        <em>{t(STAGES[option.value].nameKey)}</em>
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
