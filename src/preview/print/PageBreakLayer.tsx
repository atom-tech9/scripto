import { useCallback, useMemo, useState } from 'react'
import { Scissors, X } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import { usePageBlocks, type PageBlock } from './usePageBlocks'
import './pageBreaks.css'

export interface BlockRange {
  readonly from: number
  readonly to: number
}

interface PageBreakLayerProps {
  /** The element the paginated pages were rendered into. */
  container: HTMLElement | null
  /** Current zoom on the print surface, so the overlay can divide it out. */
  zoom: number
  /** Bumped after each pagination so the overlay re-measures. */
  revision: number
  enabled: boolean
  onInsertBreak: (line: number) => void
  onRemoveBreak: (line: number) => void
  onSelect: (range: BlockRange | null) => void
  selection: BlockRange | null
  onLandscape: (range: BlockRange) => void
}

/**
 * The interactive layer over the paginated pages: insert a break between two
 * blocks, remove one that already exists, select a run of blocks, and promote an
 * over-wide block to its own landscape page.
 *
 * Every action is reported upward as a source-line range; nothing here writes to
 * the rendered DOM, which stays a pure projection of the Markdown.
 */
export function PageBreakLayer({
  container,
  zoom,
  revision,
  enabled,
  onInsertBreak,
  onRemoveBreak,
  onSelect,
  selection,
  onLandscape,
}: PageBreakLayerProps) {
  const { t } = useLanguage()
  const { blocks, markers } = usePageBlocks(container, zoom, revision, enabled)
  const [hovered, setHovered] = useState<number | null>(null)

  const firstLine = useMemo(
    () => blocks.reduce((min, block) => Math.min(min, block.line), Number.POSITIVE_INFINITY),
    [blocks],
  )

  const handleBlockClick = useCallback(
    (block: PageBlock, extend: boolean) => {
      if (extend && selection) {
        onSelect({
          from: Math.min(selection.from, block.line),
          to: Math.max(selection.to, block.endLine),
        })
        return
      }
      const same = selection?.from === block.line && selection?.to === block.endLine
      onSelect(same ? null : { from: block.line, to: block.endLine })
    },
    [onSelect, selection],
  )

  if (!enabled) return null

  return (
    <div className="break-layer" aria-hidden={false}>
      {blocks.map((block) => {
        const selected =
          selection !== null && block.line >= selection.from && block.line <= selection.to
        const isHovered = hovered === block.line
        // A break before the first block, or before a block already starting a
        // page, would change nothing — so don't offer one.
        const canBreak = block.line !== firstLine && !block.atPageTop

        return (
          <div
            key={`${block.line}-${block.top}`}
            className={cn('break-block', selected && 'break-block--selected')}
            style={{
              top: block.top,
              left: block.left,
              width: block.width,
              height: block.height,
            }}
            onMouseEnter={() => setHovered(block.line)}
            onMouseLeave={() => setHovered((line) => (line === block.line ? null : line))}
          >
            <button
              type="button"
              className="break-block__hit"
              onClick={(event) => handleBlockClick(block, event.shiftKey)}
              aria-pressed={selected}
              aria-label={t('print.break.selectBlock')}
            />

            {canBreak && (
              <button
                type="button"
                className={cn('break-insert', isHovered && 'break-insert--visible')}
                onClick={() => onInsertBreak(block.line)}
                title={t('print.break.here')}
              >
                <span className="break-insert__rule" />
                <span className="break-insert__pill">
                  <Scissors size={11} />
                  {t('print.break.here')}
                </span>
              </button>
            )}

            {block.overflows && (
              <button
                type="button"
                className="break-wide"
                onClick={() => onLandscape({ from: block.line, to: block.endLine })}
              >
                {t('print.break.wide')}
              </button>
            )}
          </div>
        )
      })}

      {markers.map((marker) => (
        <div
          key={`marker-${marker.line}-${marker.top}`}
          className="break-marker"
          style={{ top: marker.top, left: marker.left, width: marker.width }}
        >
          <span className="break-marker__chip">
            <Scissors size={11} />
            {t('print.break.chip')}
            <button
              type="button"
              onClick={() => onRemoveBreak(marker.line)}
              aria-label={t('print.break.remove')}
              title={t('print.break.remove')}
              className="break-marker__remove"
            >
              <X size={11} />
            </button>
          </span>
        </div>
      ))}
    </div>
  )
}
