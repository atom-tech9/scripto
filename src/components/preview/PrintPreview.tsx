import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, Download, FileWarning, Loader2, Minus, Plus, Printer, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { renderPagedPreview } from '@/pdf/renderPaged'
import { buildPrintPageRule } from '@/pdf/pageStyles'
import { logger } from '@/lib/logger'
import { useLanguage } from '@/i18n'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { ExportProgress, PdfConfig } from '@/types'

interface PrintPreviewProps {
  open: boolean
  onClose: () => void
  getDocElement: () => HTMLElement | null
  config: PdfConfig
}

const INITIAL_PROGRESS: ExportProgress = { stage: 'idle', message: '', percent: 0 }

export function PrintPreview({ open, onClose, getDocElement, config }: PrintPreviewProps) {
  const { t, lang } = useLanguage()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const renderingRef = useRef(false)
  const [progress, setProgress] = useState<ExportProgress>(INITIAL_PROGRESS)
  const [pageCount, setPageCount] = useState(0)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  zoomRef.current = zoom
  const setZoomClamped = useCallback((z: number) => setZoom(Math.min(3, Math.max(0.3, z))), [])
  // Cover + Contents are excluded from the export by default; this toggle adds them back.
  const [includeFrontMatter, setIncludeFrontMatter] = useLocalStorage('scripto:export-front-matter', false)

  const exportConfig = useMemo<PdfConfig>(
    () => ({ ...config, coverPage: includeFrontMatter, tableOfContents: includeFrontMatter }),
    [config, includeFrontMatter],
  )

  const render = useCallback(async () => {
    const liveDoc = getDocElement()
    const container = pagesRef.current
    if (!liveDoc || !container) return
    // Guard against concurrent runs (e.g. React StrictMode double-invoke) which
    // would paginate twice and leave duplicate pages in the container.
    if (renderingRef.current) return
    renderingRef.current = true
    try {
      setProgress({ stage: 'preparing', message: t('print.preparing'), percent: 8 })
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
      const { pageCount: count } = await renderPagedPreview({
        liveDoc,
        config: exportConfig,
        container,
        onProgress: setProgress,
        strings: { contents: t('pdf.contents'), locale: lang },
      })
      setPageCount(count)
      // Auto-fit the A4 page to the available width (never upscale past 100%).
      // Measure an actual page element — its offsetWidth is the true (unscaled)
      // page width, whereas the wrapping container just fills the surface width.
      window.requestAnimationFrame(() => {
        const surface = surfaceRef.current
        const page = container.querySelector<HTMLElement>('.pagedjs_page')
        const pageW = page?.offsetWidth ?? 0
        if (surface && pageW > 0) {
          const gutter = window.innerWidth < 640 ? 24 : 48
          setZoomClamped(Math.min(1, (surface.clientWidth - gutter) / pageW))
        }
      })
    } catch (error) {
      logger.error('Print preview failed', error)
    } finally {
      renderingRef.current = false
    }
  }, [exportConfig, getDocElement, t, lang])

  useEffect(() => {
    if (open) void render()
    else {
      setProgress(INITIAL_PROGRESS)
      setPageCount(0)
      if (pagesRef.current) pagesRef.current.innerHTML = ''
    }
  }, [open, render])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Pinch-to-zoom on touch devices. Native non-passive listeners so the pinch
  // can preventDefault the browser's page zoom/scroll while two fingers are down.
  useEffect(() => {
    const el = surfaceRef.current
    if (!open || !el) return
    let startDist = 0
    let startZoom = 1
    let pinching = false
    const distance = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      )
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinching = true
        startDist = distance(e.touches)
        startZoom = zoomRef.current
      }
    }
    const onMove = (e: TouchEvent) => {
      if (!pinching || e.touches.length !== 2 || startDist === 0) return
      e.preventDefault()
      setZoomClamped(startZoom * (distance(e.touches) / startDist))
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinching = false
    }
    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [open, setZoomClamped])

  const handlePrint = useCallback(() => {
    const styleId = 'scripto-print-page-rule'
    document.getElementById(styleId)?.remove()
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = buildPrintPageRule(exportConfig)
    document.head.appendChild(style)

    // Browsers pre-fill the "Save as PDF" filename from document.title, so swap
    // it to the document's title for the duration of the print.
    const previousTitle = document.title
    const safeTitle = (exportConfig.meta.title || 'document').replace(/[\\/:*?"<>|]+/g, ' ').trim()
    document.title = safeTitle || 'document'

    document.body.classList.add('scripto-printing')
    const cleanup = () => {
      document.body.classList.remove('scripto-printing')
      document.title = previousTitle
      style.remove()
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)

    window.requestAnimationFrame(() => {
      window.print()
      // Fallback cleanup in case `afterprint` never fires (some browsers).
      window.setTimeout(cleanup, 2000)
    })
  }, [exportConfig])

  const isRendering = progress.stage !== 'idle' && progress.stage !== 'done' && progress.stage !== 'error'
  const isError = progress.stage === 'error'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="scripto-print-portal fixed inset-0 z-[120] flex flex-col bg-muted/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="print-chrome flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 shadow-sm sm:gap-3 sm:px-4 sm:py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Printer size={18} className="shrink-0 text-primary" />
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-sm font-semibold leading-tight">{t('action.printPreview')}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {isRendering
                    ? progress.message
                    : isError
                      ? t('print.renderFailed')
                      : `${pageCount} ${pageCount === 1 ? t('print.page') : t('print.pages')} · ${t('print.exactOutput')}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="me-1 flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted active:scale-90 motion-reduce:active:scale-100"
                  onClick={() => setZoomClamped(zoomRef.current - 0.1)}
                  aria-label={t('print.zoomOut')}
                >
                  <Minus size={14} />
                </button>
                <span className="w-11 text-center text-xs tabular-nums text-muted-foreground sm:w-12">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted active:scale-90 motion-reduce:active:scale-100"
                  onClick={() => setZoomClamped(zoomRef.current + 0.1)}
                  aria-label={t('print.zoomIn')}
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIncludeFrontMatter((v) => !v)}
                aria-pressed={includeFrontMatter}
                disabled={isRendering}
                className={`me-1 inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  includeFrontMatter
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <BookOpen size={14} />
                <span className="hidden sm:inline">{t('print.frontMatter')}</span>
              </button>
              <Button variant="ghost" size="sm" onClick={() => void render()} disabled={isRendering}>
                <RefreshCw size={14} className={isRendering ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{t('print.reRender')}</span>
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrint} disabled={isRendering || isError}>
                <Download size={14} />
                {t('print.savePdf')}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('print.close')}>
                <X size={18} />
              </Button>
            </div>
          </div>

          {isRendering && (
            <div className="h-0.5 w-full overflow-hidden bg-border">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
              />
            </div>
          )}

          <div
            ref={surfaceRef}
            className="scripto-print-surface scrollbar-thin relative flex-1 overflow-auto"
          >
            {isRendering && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm shadow-lg">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  {progress.message}
                </div>
              </div>
            )}
            {isError && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <FileWarning size={32} className="text-destructive" />
                <p className="max-w-md text-sm text-muted-foreground">{progress.message}</p>
                <Button variant="outline" size="sm" onClick={() => void render()}>
                  {t('print.tryAgain')}
                </Button>
              </div>
            )}
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              className="transition-transform"
            >
              <div ref={pagesRef} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
