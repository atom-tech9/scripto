import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { SKIN_GROUPS, SKIN_OPTIONS, type HandAffinity } from '@/data/skins'
import { STAGES } from '@/preview/stage/stages'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import type { DocumentSkin } from '@/types'

interface SkinPaletteProps {
  open: boolean
  onClose: () => void
  /** The committed skin — what the palette marks as selected. */
  skin: DocumentSkin
  /** Keeps the miniatures on the document's own accent colour. */
  accentColor: string
  /**
   * True when the document is being written by hand. Affinity badges only
   * appear then -- on a typeset document they would be noise about a setting
   * that is off.
   */
  handwritten: boolean
  /** Applies a skin to the live preview only; null restores the committed one. */
  onPreview: (skin: DocumentSkin | null) => void
  onCommit: (skin: DocumentSkin) => void
}

/**
 * Browse the skins over the preview: hover to try one, click to keep it.
 *
 * A panel rather than a permanent rail — 29 skins need room for a readable
 * miniature and a name, and the preview should not surrender that width for
 * the whole session to a picker used occasionally.
 *
 * Each card is a real `.scripto-doc` in that skin, scaled down, so the card is
 * the skin itself rather than a drawing of it and a new skin needs no artwork.
 */
export const SkinPalette = memo(function SkinPalette({
  open,
  onClose,
  skin,
  accentColor,
  handwritten,
  onPreview,
  onCommit,
}: SkinPaletteProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return SKIN_GROUPS.map((group) => ({
      ...group,
      options: SKIN_OPTIONS.filter(
        (option) =>
          option.group === group.id &&
          (needle === '' || t(option.labelKey).toLowerCase().includes(needle)),
      ),
    })).filter((group) => group.options.length > 0)
  }, [query, t])

  const ordered = useMemo(() => groups.flatMap((group) => group.options), [groups])

  // Closing must never leave a hover preview applied behind the panel.
  useEffect(() => {
    if (!open) {
      onPreview(null)
      setQuery('')
    }
  }, [open, onPreview])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    const onDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, onClose])

  const move = useCallback(
    (from: DocumentSkin, delta: number) => {
      const index = ordered.findIndex((option) => option.value === from)
      if (index < 0 || ordered.length === 0) return
      const next = (index + delta + ordered.length) % ordered.length
      const value = ordered[next].value
      onPreview(value)
      panelRef.current?.querySelector<HTMLElement>(`[data-skin-option='${value}']`)?.focus()
    },
    [ordered, onPreview],
  )

  if (!open) return null

  return (
    <div ref={panelRef} className="skin-palette" role="dialog" aria-label={t('preview.rail.title')}>
      <div className="skin-palette__head">
        <div className="skin-palette__search">
          <Search size={14} aria-hidden />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('preview.skins.search')}
            aria-label={t('preview.skins.search')}
          />
        </div>
        <button type="button" onClick={onClose} aria-label={t('print.close')}>
          <X size={15} />
        </button>
      </div>

      <div
        className="skin-palette__body scrollbar-thin"
        role="listbox"
        aria-label={t('preview.rail.title')}
      >
        {groups.length === 0 && <p className="skin-palette__empty">{t('preview.skins.empty')}</p>}

        {groups.map((group) => (
          <section key={group.id} className="skin-palette__group">
            <h4>{t(group.labelKey)}</h4>
            <div className="skin-palette__grid">
              {group.options.map((option) => {
                const selected = option.value === skin
                const name = t(option.labelKey).split(' — ')[0]
                // 'good' is the unremarkable case: badging it would put a label
                // on most of the grid and tell the reader nothing.
                const affinity: HandAffinity | null =
                  handwritten && option.handAffinity !== 'good' ? option.handAffinity : null
                return (
                  <div
                    key={option.value}
                    role="option"
                    data-skin-option={option.value}
                    aria-selected={selected}
                    aria-label={name}
                    tabIndex={0}
                    onMouseEnter={() => onPreview(option.value)}
                    onFocus={() => onPreview(option.value)}
                    onClick={() => {
                      onCommit(option.value)
                      onClose()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onCommit(option.value)
                        onClose()
                      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                        event.preventDefault()
                        move(option.value, event.key === 'ArrowDown' ? 2 : 1)
                      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                        event.preventDefault()
                        move(option.value, event.key === 'ArrowUp' ? -2 : -1)
                      }
                    }}
                    className={cn('skin-card', selected && 'skin-card--selected')}
                  >
                    {affinity && (
                      <span
                        className={`skin-card__affinity skin-card__affinity--${affinity}`}
                        title={t(`skin.affinity.${affinity}` as 'skin.affinity.native')}
                      >
                        {t(`skin.affinity.${affinity}` as 'skin.affinity.native')}
                      </span>
                    )}
                    <span className="skin-card__paper" aria-hidden>
                      <span
                        className="skin-card__doc scripto-doc"
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
                    <span className="skin-card__meta">
                      <strong>{name}</strong>
                      <em>{t(STAGES[option.value].nameKey)}</em>
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="skin-palette__hint">{t('preview.skins.hint')}</p>
    </div>
  )
})
