import { Previewer } from 'pagedjs'
import { buildExportContent, type ExportStrings } from './buildExportContent'
import { flattenImages } from './flattenImages'
import { buildPageCss } from './pageStyles'
import { fitToPage } from './fitToPage'
import { getErrorMessage, logger } from '@/lib/logger'
import type { ExportProgress, PdfConfig, TocEntry } from '@/types'

interface RenderOptions {
  liveDoc: HTMLElement
  config: PdfConfig
  container: HTMLElement
  onProgress?: (progress: ExportProgress) => void
  /** Localized cover/TOC strings so the generated pages match the UI language. */
  strings?: ExportStrings
}

export interface RenderResult {
  pageCount: number
  toc: TocEntry[]
  /** Content too wide for the page: scaled down to fit, or still clipped. */
  fit: { scaled: number; clipped: number }
}

// A dead/slow image host must never hang the export.
const IMAGE_TIMEOUT_MS = 6000
const RENDER_TIMEOUT_MS = 45000

// A dead image has no measurable size, so the paginator can never place it —
// tag failures so CSS can give them a fixed fallback box.
function markImageUnavailable(img: HTMLImageElement): void {
  img.removeAttribute('src')
  img.removeAttribute('srcset')
  img.setAttribute('data-unavailable', 'true')
}

/** Decode images so Paged.js measures heights correctly, giving up on a slow or
 * unreachable host after a short timeout. */
async function preloadImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  // The renderer marks images `loading="lazy"`, which never resolves for
  // anything below the fold -- and the export clone is never scrolled at all.
  // Left lazy, an image reports no intrinsic size and Paged.js has to lay out a
  // box it cannot measure.
  images.forEach((img) => {
    img.loading = 'eager'
    img.decoding = 'sync'
  })
  await Promise.allSettled(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const src = img.getAttribute('src')
          if (!src) {
            markImageUnavailable(img)
            resolve()
            return
          }
          const probe = new Image()
          const fail = () => {
            window.clearTimeout(timer)
            markImageUnavailable(img)
            resolve()
          }
          const timer = window.setTimeout(fail, IMAGE_TIMEOUT_MS)
          probe.onload = () => {
            window.clearTimeout(timer)
            resolve()
          }
          probe.onerror = fail
          probe.src = src
        }),
    ),
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), ms)),
  ])
}

/**
 * Run pagination with a no-op ResizeObserver. Paged.js runs a post-layout resize
 * re-check that can dereference a null node and log an uncaught error — harmless
 * (the pages are already laid out) but noisy. Our content is pre-sized (images
 * preloaded, fonts ready), so the re-check is unnecessary; disabling the observer
 * for the render avoids the error without patching Paged.js.
 */
async function withResizeObserverDisabled<T>(fn: () => Promise<T>): Promise<T> {
  const RealResizeObserver = window.ResizeObserver
  class NoopResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  window.ResizeObserver = NoopResizeObserver as unknown as typeof ResizeObserver
  try {
    return await fn()
  } finally {
    window.ResizeObserver = RealResizeObserver
  }
}

/**
 * Paginate the live document into print-ready pages using Paged.js, rendering
 * the result into `container`. The pages produced are sized exactly to the
 * configured paper size — this is the WYSIWYG source for the PDF.
 */
export async function renderPagedPreview({
  liveDoc,
  config,
  container,
  onProgress,
  strings,
}: RenderOptions): Promise<RenderResult> {
  try {
    onProgress?.({
      stage: 'preparing',
      message: strings?.preparing ?? 'Preparing document…',
      percent: 12,
    })
    const { content, toc } = buildExportContent(liveDoc, config, strings)
    const pageCss = buildPageCss(config)

    onProgress?.({
      stage: 'rendering',
      message: strings?.loadingImages ?? 'Loading images…',
      percent: 28,
    })
    await preloadImages(content)
    // Only now do the images report intrinsic sizes, which is what turning them
    // into measurable non-replaced boxes depends on.
    flattenImages(content)

    container.innerHTML = ''
    // Paginate in an LTR context: under the app's RTL UI (<html dir="rtl">),
    // Paged.js's page-box measurement misfires and collapses to one page. Each
    // document keeps its own direction via `.scripto-doc[dir]`, so RTL text is
    // unaffected — only the page mechanics are forced LTR.
    container.setAttribute('dir', 'ltr')
    onProgress?.({
      stage: 'paginating',
      message: strings?.paginating ?? 'Laying out pages…',
      percent: 45,
    })

    const previewer = new Previewer()
    const flow = await withResizeObserverDisabled(() =>
      withTimeout(
        previewer.preview(content, [{ pageStyle: pageCss }], container),
        RENDER_TIMEOUT_MS,
        strings?.timedOut ??
          'PDF layout took too long. Try removing broken images or simplifying the document, then retry.',
      ),
    )

    // Anything that could not reflow into the page box is scaled to fit now
    // that real widths exist. Shrinking only frees space, so the layout holds.
    const fit = fitToPage(container)

    const pageCount = flow?.total ?? container.querySelectorAll('.pagedjs_page').length
    onProgress?.({
      stage: 'done',
      message: strings?.pagesReady
        ? `${pageCount} ${strings.pagesReady}`
        : `${pageCount} page${pageCount === 1 ? '' : 's'} ready`,
      percent: 100,
    })
    return { pageCount, toc, fit }
  } catch (error) {
    logger.error('Paged.js rendering failed', error)
    onProgress?.({ stage: 'error', message: getErrorMessage(error), percent: 0 })
    throw error
  }
}
