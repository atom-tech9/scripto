/**
 * Some content cannot reflow to fit a page: display math is typeset at a fixed
 * width, and a diagram or table can be intrinsically wider than the page box.
 * On screen `overflow-x: auto` hides that behind a scrollbar; on paper the
 * excess is simply cut off, with no way to recover it.
 *
 * So after pagination, anything still wider than its page is scaled down to
 * fit. Type size is reduced rather than a transform applied, because that also
 * shrinks the element's box — a transform would leave the original height
 * behind as a gap. Shrinking only ever frees vertical space, so the pages
 * already laid out stay valid and no re-pagination is needed.
 */

/** Things that can be intrinsically too wide and cannot wrap their way out. */
const UNSHRINKABLE = '.katex-display, .mermaid-figure, .ascii-diagram, .table-wrap, pre'

/** Leave a hair of slack so rounding can't re-trigger the overflow. */
const SAFETY = 0.985
/** Below this the content is unreadable; clamp and report instead. */
const MIN_SCALE = 0.55

export interface FitResult {
  /** Elements that were scaled down to fit. */
  scaled: number
  /** Elements still wider than the page even at the minimum scale. */
  clipped: number
}

export function fitToPage(container: HTMLElement): FitResult {
  let scaled = 0
  let clipped = 0

  container.querySelectorAll<HTMLElement>('.pagedjs_page_content').forEach((content) => {
    const available = content.getBoundingClientRect().width
    if (available <= 0) return

    content.querySelectorAll<HTMLElement>(UNSHRINKABLE).forEach((el) => {
      // A chunked code block reports its `pre` and its wrapper; measure the
      // widest thing actually painted inside.
      const width = Math.max(el.scrollWidth, el.getBoundingClientRect().width)
      if (width <= available + 1) return

      const wanted = (available / width) * SAFETY
      const scale = Math.max(MIN_SCALE, wanted)
      const current = parseFloat(getComputedStyle(el).fontSize) || 16
      el.style.fontSize = `${current * scale}px`
      el.style.maxWidth = '100%'
      scaled += 1
      if (wanted < MIN_SCALE) clipped += 1
    })
  })

  return { scaled, clipped }
}
