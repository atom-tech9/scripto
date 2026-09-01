import { useEffect, useState } from 'react'
import { resolvePageDimensions } from '@/lib/constants'
import { useLanguage } from '@/i18n'
import type { PdfConfig } from '@/types'

/** CSS reference pixels per millimetre at 96 dpi. */
const MM_TO_PX = 96 / 25.4

/** Runaway guard for pathological configs (e.g. margins ≈ page height). */
const MAX_BREAKS = 400

interface PageRulerProps {
  /** The rendered document. Read-only — the ruler never styles or mutates it. */
  docEl: HTMLElement | null
  config: PdfConfig
  /** Bumped whenever the rendered content may have changed height. */
  revision: number
}

/**
 * Screen-only page-boundary estimate.
 *
 * This is geometry, not pagination: it divides the rendered height by the usable
 * page height. It does not run Paged.js, so it cannot account for
 * `break-inside: avoid`, `::page-break`, `:::keep-together`, repeated table
 * headers or code-block chunking. The UI labels it as approximate for exactly
 * that reason.
 */
export function PageRuler({ docEl, config, revision }: PageRulerProps) {
  const { t } = useLanguage()
  const [offsets, setOffsets] = useState<number[]>([])

  useEffect(() => {
    if (!docEl) {
      setOffsets([])
      return
    }

    const page = resolvePageDimensions(config)
    const usableMm = page.height - config.margins.top - config.margins.bottom
    if (usableMm <= 0) {
      setOffsets([])
      return
    }
    const usablePx = usableMm * MM_TO_PX

    const measure = () => {
      // `offsetHeight` is layout px and is unaffected by the container's CSS
      // `zoom`, which keeps the estimate stable while the user zooms.
      const height = docEl.offsetHeight
      const top = docEl.offsetTop
      const count = Math.min(MAX_BREAKS, Math.floor(height / usablePx))
      setOffsets(Array.from({ length: count }, (_, i) => top + (i + 1) * usablePx))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(docEl)
    return () => observer.disconnect()
  }, [docEl, config, revision])

  if (offsets.length === 0) return null

  return (
    <div className="stage-ruler" aria-hidden>
      {offsets.map((top, index) => (
        <div key={index} className="stage-ruler__break" style={{ top }}>
          <span className="stage-ruler__no">
            {t('preview.pages.pageLabel')} {index + 2}
          </span>
        </div>
      ))}
    </div>
  )
}
