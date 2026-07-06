import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Eye, EyeOff, Link2, Link2Off, Minus, Plus } from 'lucide-react'
import { MarkdownRenderer } from '@/markdown/MarkdownRenderer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useLanguage } from '@/i18n'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { buildCoverHtml } from '@/pdf/pageStyles'
import { extractToc, MIN_TOC_HEADINGS } from '@/pdf/buildExportContent'
import {
  documentClassName,
  documentDataAttrs,
  documentStyleVars,
} from '@/pdf/documentStyle'
import type { PdfConfig, ResolvedTheme, TocEntry } from '@/types'

export interface PreviewHandle {
  /** The live document element — cloned by the PDF engine for export. */
  getDocElement: () => HTMLElement | null
}

interface PreviewProps {
  content: string
  config: PdfConfig
  resolvedTheme: ResolvedTheme
  /** Reports the scroll container up (for scroll sync); null on unmount. */
  onScrollElement?: (el: HTMLElement | null) => void
  /** Scroll-sync toggle — rendered only when provided (i.e. in split view). */
  syncEnabled?: boolean
  onToggleSync?: () => void
}

const pageCard = 'rounded-xl bg-surface shadow-sm ring-1 ring-border/60'

/** The live, scrollable rendered document. Shows the same cover + contents pages
 * the PDF will, so the preview matches the export. */
export const Preview = forwardRef<PreviewHandle, PreviewProps>(function Preview(
  { content, config, resolvedTheme, onScrollElement, syncEnabled, onToggleSync },
  ref,
) {
  const { t, lang } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  zoomRef.current = zoom
  const setZoomClamped = useCallback((z: number) => setZoom(Math.min(2.5, Math.max(0.5, z))), [])
  const [toc, setToc] = useState<TocEntry[]>([])
  // Cover/Contents preview cards are hidden by default; export is unaffected.
  const [showFrontMatter, setShowFrontMatter] = useLocalStorage('scripto:preview-front-matter', false)

  useImperativeHandle(ref, () => ({
    getDocElement: () => docRef.current,
  }))

  // Report the scroll container to the parent so the scroll-sync hook can wire
  // native listeners to it.
  useEffect(() => {
    onScrollElement?.(scrollRef.current)
    return () => onScrollElement?.(null)
  }, [onScrollElement])

  // Pinch-to-zoom the preview on touch devices (native non-passive listeners so
  // the gesture can preventDefault the browser's own page zoom).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let startDist = 0
    let startZoom = 1
    let pinching = false
    const distance = (touches: TouchList) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
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
  }, [setZoomClamped])

  // Build the table of contents from the rendered headings (after each render).
  useEffect(() => {
    if (!config.tableOfContents) {
      setToc([])
      return
    }
    const id = window.requestAnimationFrame(() => {
      if (docRef.current) setToc(extractToc(docRef.current, config.tocDepth))
    })
    return () => window.cancelAnimationFrame(id)
  }, [content, config.tableOfContents, config.tocDepth])

  const coverHtml = useMemo(
    () => (config.coverPage ? buildCoverHtml(config, lang) : ''),
    [config, lang],
  )
  const docStyle = documentStyleVars(config)
  const docAttrs = documentDataAttrs(config)
  const pageAspect = config.orientation === 'landscape' ? '1.414 / 1' : '1 / 1.414'
  const tocReady = config.tableOfContents && toc.length >= MIN_TOC_HEADINGS
  const hasFrontMatter = config.coverPage || tocReady

  return (
    <div className="relative flex h-full flex-col">
      {hasFrontMatter && (
        <div className="flex items-center justify-end border-b border-border bg-surface/60 px-3 py-1.5">
          <button
            type="button"
            onClick={() => setShowFrontMatter((v) => !v)}
            aria-pressed={showFrontMatter}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              showFrontMatter
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {showFrontMatter ? <Eye size={13} /> : <EyeOff size={13} />}
            {t('preview.frontMatter.toggle')}
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        className="scrollbar-thin relative min-h-0 flex-1 overflow-auto bg-muted/40"
        onScroll={(e) => {
          const el = e.currentTarget
          const max = el.scrollHeight - el.clientHeight
          setProgress(max > 0 ? el.scrollTop / max : 0)
        }}
      >
        <div
          className="pointer-events-none sticky top-0 z-10 h-0.5 bg-primary/80 transition-[width] duration-75"
          style={{ width: `${progress * 100}%` }}
          aria-hidden
        />
        <div
          className="mx-auto max-w-[820px] space-y-6 px-4 py-8 sm:px-8 sm:py-12"
          style={{ zoom } as CSSProperties}
        >
          {showFrontMatter && config.coverPage && coverHtml && (
            <div
              className={`overflow-hidden bg-white ${pageCard}`}
              style={{ aspectRatio: pageAspect }}
              dangerouslySetInnerHTML={{ __html: `<div style="height:100%">${coverHtml}</div>` }}
            />
          )}

          {showFrontMatter && tocReady && (
            <div className={`px-7 py-10 sm:px-12 sm:py-14 ${pageCard}`}>
              <div className={documentClassName(config)} style={docStyle} {...docAttrs}>
                <h2>{t('pdf.contents')}</h2>
                <nav aria-label="Table of contents">
                  {toc.map((entry, i) => (
                    <a
                      key={`${entry.id}-${i}`}
                      href={`#${entry.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        docRef.current
                          ?.querySelector(`#${CSS.escape(entry.id)}`)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="block py-0.5"
                      style={{ paddingInlineStart: `${(entry.depth - 1) * 1}rem` }}
                    >
                      {entry.text}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          )}

          <div className={`px-7 py-10 sm:px-12 sm:py-14 ${pageCard}`}>
            <ErrorBoundary fallbackTitle="This document couldn't be rendered.">
              {config.customCss?.trim() && (
                <style dangerouslySetInnerHTML={{ __html: config.customCss }} />
              )}
              <div ref={docRef} className={documentClassName(config)} style={docStyle} {...docAttrs}>
                <MarkdownRenderer content={content} resolvedTheme={resolvedTheme} />
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Scroll-sync toggle — only in split view (when the editor is visible). */}
      {onToggleSync && (
        <button
          type="button"
          onClick={onToggleSync}
          aria-pressed={syncEnabled}
          title={syncEnabled ? t('preview.sync.on') : t('preview.sync.off')}
          aria-label={syncEnabled ? t('preview.sync.on') : t('preview.sync.off')}
          className={`absolute end-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-colors ${
            syncEnabled
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-surface/90 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {syncEnabled ? <Link2 size={15} /> : <Link2Off size={15} />}
        </button>
      )}

      {/* Floating zoom control — most useful on touch / small screens. */}
      <div className="absolute bottom-3 end-3 z-20 flex items-center gap-0.5 rounded-full border border-border bg-surface/90 p-0.5 shadow-lg backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setZoomClamped(zoomRef.current - 0.1)}
          aria-label={t('print.zoomOut')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 motion-reduce:active:scale-100"
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          aria-label={t('print.zoomReset')}
          className="w-11 text-center text-xs font-medium tabular-nums text-muted-foreground hover:text-foreground"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoomClamped(zoomRef.current + 0.1)}
          aria-label={t('print.zoomIn')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 motion-reduce:active:scale-100"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
})
