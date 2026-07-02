import { Previewer } from 'pagedjs'
import { buildExportContent, type ExportStrings } from './buildExportContent'
import { buildPageCss } from './pageStyles'
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
    onProgress?.({ stage: 'preparing', message: 'Preparing document…', percent: 12 })
    const { content, toc } = buildExportContent(liveDoc, config, strings)
    const pageCss = buildPageCss(config)

    onProgress?.({ stage: 'rendering', message: 'Loading images…', percent: 28 })
    await preloadImages(content)

    container.innerHTML = ''
    // Paginate in an LTR context: under the app's RTL UI (<html dir="rtl">),
    // Paged.js's page-box measurement misfires and collapses to one page. Each
    // document keeps its own direction via `.scripto-doc[dir]`, so RTL text is
    // unaffected — only the page mechanics are forced LTR.
    container.setAttribute('dir', 'ltr')
    onProgress?.({ stage: 'paginating', message: 'Laying out pages…', percent: 45 })

    const previewer = new Previewer()
    const flow = await withResizeObserverDisabled(() =>
      withTimeout(
        previewer.preview(content, [{ pageStyle: pageCss }], container),
        RENDER_TIMEOUT_MS,
        'PDF layout took too long. Try removing broken images or simplifying the document, then retry.',
      ),
    )

    const pageCount = flow?.total ?? container.querySelectorAll('.pagedjs_page').length
    onProgress?.({ stage: 'done', message: `${pageCount} page${pageCount === 1 ? '' : 's'} ready`, percent: 100 })
    return { pageCount, toc }
  } catch (error) {
    logger.error('Paged.js rendering failed', error)
    onProgress?.({ stage: 'error', message: getErrorMessage(error), percent: 0 })
    throw error
  }
}
