import { useCallback, useEffect, useState } from 'react'

/** A top-level block in the paginated output, mapped back to its source line. */
export interface PageBlock {
  /** 1-based body source line the block starts on. */
  readonly line: number
  /** Last body source line the block covers. */
  readonly endLine: number
  /** Position within the pages container, in unscaled pixels. */
  readonly top: number
  readonly left: number
  readonly width: number
  readonly height: number
  /** True when the block already sits at the top of its page. */
  readonly atPageTop: boolean
  /** True when the block is wider than the page can hold. */
  readonly overflows: boolean
}

/** An existing `::page-break` directive, as rendered on a page. */
export interface PageBreakMarker {
  readonly line: number
  readonly top: number
  readonly left: number
  readonly width: number
}

export interface PageGeometry {
  readonly blocks: PageBlock[]
  readonly markers: PageBreakMarker[]
}

const EMPTY: PageGeometry = { blocks: [], markers: [] }

/** Treat "within a few pixels of the content top" as sitting at the page top. */
const PAGE_TOP_SLACK = 6

function sourceLine(el: Element): number | null {
  const raw = el.getAttribute('data-source-line')
  if (raw === null) return null
  const line = Number(raw)
  return Number.isFinite(line) ? line : null
}

/**
 * Read the paginated DOM and map every top-level block back to the Markdown
 * line it came from, using the `data-source-line` anchors `rehypeSourceLine`
 * stamps — the same anchors scroll sync already relies on. Read-only: the
 * paginated output is never mutated here.
 */
export function usePageBlocks(
  container: HTMLElement | null,
  zoom: number,
  revision: number,
  enabled: boolean,
): PageGeometry {
  const [geometry, setGeometry] = useState<PageGeometry>(EMPTY)

  const measure = useCallback(() => {
    if (!container || !enabled) {
      setGeometry(EMPTY)
      return
    }
    const origin = container.getBoundingClientRect()
    // The pages sit inside a scale transform; divide it out so the overlay's
    // coordinates match the untransformed layer it is rendered into.
    const scale = zoom || 1
    const toLocal = (rect: DOMRect) => ({
      top: (rect.top - origin.top) / scale,
      left: (rect.left - origin.left) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    })

    const blocks: PageBlock[] = []
    const markers: PageBreakMarker[] = []

    container.querySelectorAll<HTMLElement>('.pagedjs_page_content').forEach((content) => {
      const contentRect = content.getBoundingClientRect()
      const doc = content.querySelector<HTMLElement>('.scripto-doc')
      if (!doc) return

      const children = Array.from(doc.children) as HTMLElement[]
      children.forEach((el, index) => {
        const line = sourceLine(el)
        if (line === null) return
        const rect = el.getBoundingClientRect()

        // A break marker is a zero-height rule, so it has to be recognised
        // before the "is this visible?" guard below rejects it. Paged.js leaves
        // a copy on both sides of the split, hence the dedupe.
        if (el.classList.contains('page-break')) {
          if (markers.some((marker) => marker.line === line)) return
          markers.push({
            line,
            top: (rect.top - origin.top) / scale,
            left: (contentRect.left - origin.left) / scale,
            width: contentRect.width / scale,
          })
          return
        }

        if (rect.height <= 0 || rect.width <= 0) return
        const local = toLocal(rect)

        // A block covers everything up to the next block's first line.
        let endLine = line
        for (let next = index + 1; next < children.length; next++) {
          const nextLine = sourceLine(children[next])
          if (nextLine !== null && nextLine > line) {
            endLine = nextLine - 1
            break
          }
        }

        blocks.push({
          line,
          endLine: Math.max(line, endLine),
          ...local,
          atPageTop: rect.top - contentRect.top <= PAGE_TOP_SLACK,
          overflows: Math.max(el.scrollWidth, rect.width) > contentRect.width + 1,
        })
      })
    })

    setGeometry({ blocks, markers })
  }, [container, zoom, enabled])

  useEffect(() => {
    if (!container || !enabled) {
      setGeometry(EMPTY)
      return
    }
    // Measure after layout has settled for the freshly paginated pages.
    const frame = window.requestAnimationFrame(measure)
    return () => window.cancelAnimationFrame(frame)
  }, [measure, container, enabled, revision])

  return geometry
}
