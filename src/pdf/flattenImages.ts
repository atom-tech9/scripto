/**
 * Replace every `<img>` with an equivalent non-replaced box before pagination.
 *
 * Paged.js 0.4.3 stalls outright when a replaced element has to be placed at a
 * page boundary: two pages lay out and the chunker stops dead, never firing its
 * `after` hook (docs/PAGEDJS_IMAGE_STALL.md). A `div` carrying the same picture
 * as a `background-image` paginates cleanly every time.
 *
 * Sizing comes from the image's *intrinsic* dimensions rather than a measured
 * box: the transform runs against the live editor pane, whose width is not the
 * printed page's width, so a baked pixel size would be wrong on paper.
 * `width` + `max-width: 100%` + `aspect-ratio` reproduces exactly how an
 * `<img>` with `height: auto` behaves in flow.
 */

/** Escape a URL for safe use inside a CSS `url("…")` token. */
function cssUrl(src: string): string {
  return src.replace(/[\\"]/g, '\\$&').replace(/[\r\n]+/g, '')
}

/**
 * @param root   The tree to transform — the detached export clone.
 * @param source The live, laid-out tree to read intrinsic sizes from. A cloned
 *               `<img>` is detached and may report `naturalWidth === 0` until it
 *               loads, so the original is the only reliable source. Defaults to
 *               `root` for callers that transform a live tree in place.
 */
export function flattenImages(root: HTMLElement, source: HTMLElement = root): void {
  const targets = [...root.querySelectorAll('img')]
  const originals = source === root ? targets : [...source.querySelectorAll('img')]

  targets.forEach((img, index) => {
    const origin = originals[index] ?? img
    // Intrinsic size first; the width/height attributes are the fallback for an
    // image that has not decoded yet.
    const width = origin.naturalWidth || Number(img.getAttribute('width')) || 0
    const height = origin.naturalHeight || Number(img.getAttribute('height')) || 0
    const src = img.getAttribute('src')
    // No intrinsic size means a broken image or an SVG that sizes from CSS
    // alone; neither can be reproduced faithfully, so leave it as an <img>.
    if (!width || !height || !src) return

    const box = img.ownerDocument.createElement('div')
    box.className = img.className
    box.setAttribute('role', 'img')
    const alt = img.getAttribute('alt')
    if (alt) box.setAttribute('aria-label', alt)

    box.style.cssText =
      [
        `background-image:url("${cssUrl(src)}")`,
        'background-size:contain',
        'background-repeat:no-repeat',
        'background-position:center',
        `width:${width}px`,
        'max-width:100%',
        `aspect-ratio:${width}/${height}`,
        // The picture is the content, not decoration: it must survive the print
        // dialog's "Background graphics" toggle being off, which is its default.
        'print-color-adjust:exact',
        '-webkit-print-color-adjust:exact',
      ].join(';') +
      // Author styles last so an explicit width or height still wins.
      (img.style.cssText ? `;${img.style.cssText}` : '')

    img.replaceWith(box)
  })
}
