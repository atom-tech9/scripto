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
import { AnimatePresence, motion } from 'motion/react'
import { Info } from 'lucide-react'
import { MarkdownRenderer } from '@/markdown/MarkdownRenderer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useLanguage } from '@/i18n'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { buildCoverHtml } from '@/pdf/pageStyles'
import { extractToc, MIN_TOC_HEADINGS } from '@/pdf/buildExportContent'
import { documentClassName, documentDataAttrs, documentStyleVars } from '@/pdf/documentStyle'
import { resolvePageDimensions } from '@/lib/constants'
import { transitionQuick } from '@/lib/motion'
import { StageBackdrop } from './stage/StageBackdrop'
import { PaperFrame } from './stage/PaperFrame'
import { stageFor } from './stage/stages'
import { loadHand } from '@/lib/handwriting/fonts'
import { resolveMargins } from '@/lib/handwriting/rules'
import { SKIN_OPTIONS } from '@/data/skins'
import { isPreviewMode, isStageLevel, type PreviewMode, type StageLevel } from './stage/types'
import { useStageTransition } from './motion/useStageTransition'
import { PreviewToolbar } from './chrome/PreviewToolbar'
import { SkinPalette } from './chrome/SkinPalette'
import { PageRuler } from './chrome/PageRuler'
import { FocusOverlay } from './chrome/FocusOverlay'
import { PreviewEmpty } from './chrome/PreviewEmpty'
import type { DocumentSkin, PdfConfig, ResolvedTheme, TocEntry } from '@/types'
import './stage/stage.css'

const MM_TO_PX = 96 / 25.4
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5

export interface PreviewHandle {
  /** The live document element — cloned by the PDF engine for export. */
  getDocElement: () => HTMLElement | null
}

export interface PreviewSurfaceProps {
  content: string
  config: PdfConfig
  resolvedTheme: ResolvedTheme
  /** Reports the scroll container up (for scroll sync); null on unmount. */
  onScrollElement?: (el: HTMLElement | null) => void
  /** Scroll-sync toggle — rendered only when provided (i.e. in split view). */
  syncEnabled?: boolean
  onToggleSync?: () => void
  /** Commits a skin picked from the rail. */
  onSkinChange?: (skin: DocumentSkin) => void
  /** Opens the paginated print preview, where page breaks are exact. */
  onOpenPrint?: () => void
  /** Focus mode collapses the stage to `minimal`. */
  forceMinimal?: boolean
  /** True when the document body is empty. */
  isEmpty?: boolean
  onUseTemplate?: () => void
  onUseSample?: () => void
}

function defaultStageLevel(): StageLevel {
  // Small screens start at `minimal`; the full stage stays one menu click away.
  if (typeof window === 'undefined') return 'full'
  return window.matchMedia('(min-width: 1024px)').matches ? 'full' : 'minimal'
}

/**
 * The live preview: a screen-only Stage wrapped around the sacred Sheet.
 *
 * Everything decorative — ground, texture, lighting, paper treatment, motion,
 * rulers and overlays — lives outside `.scripto-doc`, which is cloned verbatim
 * into the PDF, HTML and Word exports.
 */
export const PreviewSurface = forwardRef<PreviewHandle, PreviewSurfaceProps>(
  function PreviewSurface(
    {
      content,
      config,
      resolvedTheme,
      onScrollElement,
      syncEnabled,
      onToggleSync,
      onSkinChange,
      onOpenPrint,
      forceMinimal = false,
      isEmpty = false,
      onUseTemplate,
      onUseSample,
    },
    ref,
  ) {
    const { t, lang } = useLanguage()
    const scrollRef = useRef<HTMLDivElement>(null)
    const docRef = useRef<HTMLDivElement | null>(null)
    // Mirrored into state as well: the ruler and focus overlay need to re-render
    // when the element appears, and a ref alone would never notify them.
    const [docEl, setDocEl] = useState<HTMLDivElement | null>(null)
    const attachDoc = useCallback((el: HTMLDivElement | null) => {
      docRef.current = el
      setDocEl(el)
    }, [])
    const [paperEl, setPaperEl] = useState<HTMLDivElement | null>(null)
    const [progress, setProgress] = useState(0)
    const [toc, setToc] = useState<TocEntry[]>([])

    const [zoom, setZoom] = useState(1)
    const zoomRef = useRef(1)
    zoomRef.current = zoom
    const setZoomClamped = useCallback(
      (value: number) => setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value))),
      [],
    )

    const [showFrontMatter, setShowFrontMatter] = useLocalStorage(
      'scripto:preview-front-matter',
      false,
    )
    const [storedMode, setStoredMode] = useLocalStorage<PreviewMode>('scripto:preview-mode', 'flow')
    const [storedLevel, setStoredLevel] = useLocalStorage<StageLevel>(
      'scripto:preview-stage',
      defaultStageLevel,
    )
    const mode: PreviewMode = isPreviewMode(storedMode) ? storedMode : 'flow'
    const stored: StageLevel = isStageLevel(storedLevel) ? storedLevel : 'full'
    const level: StageLevel =
      stored === 'full' && (forceMinimal || mode === 'focus') ? 'minimal' : stored

    // Hovering a card previews a skin without ever writing to `config`.
    const [hoverSkin, setHoverSkin] = useState<DocumentSkin | null>(null)
    const [skinsOpen, setSkinsOpen] = useState(false)
    const closeSkins = useCallback(() => setSkinsOpen(false), [])
    const toggleSkins = useCallback(() => setSkinsOpen((value) => !value), [])
    const activeSkin = hoverSkin ?? config.skin
    const viewConfig = useMemo<PdfConfig>(
      () => (hoverSkin ? { ...config, skin: hoverSkin } : config),
      [config, hoverSkin],
    )
    const stage = stageFor(activeSkin)
    const transition = useStageTransition(stage, level)

    useImperativeHandle(ref, () => ({ getDocElement: () => docRef.current }))

    useEffect(() => {
      onScrollElement?.(scrollRef.current)
      return () => onScrollElement?.(null)
    }, [onScrollElement])

    // A hand can arrive from front-matter or a template, not just the picker,
    // so the face has to be fetched here too — otherwise the document silently
    // renders in the fallback and the PDF paginates against the wrong metrics.
    const activeHand = viewConfig.hand.hand
    const activeHeadingHand = viewConfig.hand.headingHand
    useEffect(() => {
      if (activeHand === 'none') return
      void loadHand(activeHand)
      if (activeHeadingHand !== 'same') void loadHand(activeHeadingHand)
    }, [activeHand, activeHeadingHand])

    // Pinch-to-zoom on touch devices. Native non-passive listeners so the
    // gesture can preventDefault the browser's own page zoom.
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
      () => (viewConfig.coverPage ? buildCoverHtml(viewConfig, lang) : ''),
      [viewConfig, lang],
    )
    const docStyle = documentStyleVars(viewConfig)
    const docAttrs = documentDataAttrs(viewConfig)
    const pageAspect = viewConfig.orientation === 'landscape' ? '1.414 / 1' : '1 / 1.414'
    const tocReady = viewConfig.tableOfContents && toc.length >= MIN_TOC_HEADINGS
    const hasFrontMatter = viewConfig.coverPage || tocReady

    // In Pages mode the sheet takes the real page geometry, so the estimated
    // breaks line up with how the text will actually wrap when printed.
    const pageGeometry = useMemo(() => {
      if (mode !== 'pages') return null
      const page = resolvePageDimensions(config)
      const margins = resolveMargins(
        config.margins,
        config.hand.stationery,
        config.hand.hand !== 'none',
      )
      return {
        width: Math.round(page.width * MM_TO_PX),
        paddingTop: Math.round(margins.top * MM_TO_PX),
        paddingBottom: Math.round(margins.bottom * MM_TO_PX),
        paddingInlineStart: Math.round(margins.left * MM_TO_PX),
        paddingInlineEnd: Math.round(margins.right * MM_TO_PX),
      }
    }, [mode, config])

    const previewSkin = useCallback((skin: DocumentSkin | null) => setHoverSkin(skin), [])
    const commitSkin = useCallback(
      (skin: DocumentSkin) => {
        setHoverSkin(null)
        onSkinChange?.(skin)
      },
      [onSkinChange],
    )

    const stackStyle: CSSProperties = {
      zoom,
      ...(pageGeometry ? { maxWidth: pageGeometry.width } : null),
    } as CSSProperties

    const paperStyle: CSSProperties | undefined = pageGeometry
      ? {
          width: pageGeometry.width,
          paddingTop: pageGeometry.paddingTop,
          paddingBottom: pageGeometry.paddingBottom,
          paddingInlineStart: pageGeometry.paddingInlineStart,
          paddingInlineEnd: pageGeometry.paddingInlineEnd,
        }
      : undefined

    return (
      <div
        className="scripto-stage h-full"
        data-stage={activeSkin}
        data-stage-level={level}
        style={{ ['--stage-accent' as string]: viewConfig.accentColor }}
      >
        <PreviewToolbar
          mode={mode}
          onMode={setStoredMode}
          zoom={zoom}
          onZoom={setZoomClamped}
          onResetZoom={() => setZoom(1)}
          stageLevel={stored}
          onStageLevel={setStoredLevel}
          skinsOpen={skinsOpen}
          onToggleSkins={onSkinChange ? toggleSkins : undefined}
          skinName={
            t(
              SKIN_OPTIONS.find((o) => o.value === activeSkin)?.labelKey ?? 'skin.modern.label',
            ).split(' — ')[0]
          }
          hasFrontMatter={hasFrontMatter}
          showFrontMatter={showFrontMatter}
          onToggleFrontMatter={() => setShowFrontMatter((value) => !value)}
          syncEnabled={syncEnabled}
          onToggleSync={onToggleSync}
        />

        {mode === 'pages' && (
          <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/70 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-900 dark:text-amber-200">
            <Info size={12} className="shrink-0" />
            <span className="min-w-0">{t('preview.pages.approx')}</span>
            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="font-semibold underline underline-offset-2 hover:opacity-80"
              >
                {t('preview.pages.openPrint')}
              </button>
            )}
          </div>
        )}

        <div className="stage-body">
          <StageBackdrop
            stage={stage}
            accentColor={viewConfig.accentColor}
            title={viewConfig.meta.title}
            level={level}
          />
          <div
            ref={scrollRef}
            className="stage-scroll scrollbar-thin"
            onScroll={(event) => {
              const el = event.currentTarget
              const max = el.scrollHeight - el.clientHeight
              setProgress(max > 0 ? el.scrollTop / max : 0)
            }}
          >
            <div
              className="pointer-events-none sticky top-0 z-[4] h-0.5 bg-primary/80 transition-[width] duration-75"
              style={{ width: `${progress * 100}%` }}
              aria-hidden
            />

            <div className="stage-stack" style={stackStyle}>
              {showFrontMatter && viewConfig.coverPage && coverHtml && (
                <div
                  className="stage-paper stage-paper--flush overflow-hidden bg-white"
                  style={{
                    aspectRatio: pageAspect,
                    ...(paperStyle ? { width: paperStyle.width } : null),
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `<div style="height:100%">${coverHtml}</div>`,
                  }}
                />
              )}

              {showFrontMatter && tocReady && (
                <div className="stage-paper" style={paperStyle}>
                  <div className={documentClassName(viewConfig)} style={docStyle} {...docAttrs}>
                    <h2>{t('pdf.contents')}</h2>
                    <nav aria-label={t('pdf.contents')}>
                      {toc.map((entry, index) => (
                        <a
                          key={`${entry.id}-${index}`}
                          href={`#${entry.id}`}
                          onClick={(event) => {
                            event.preventDefault()
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

              <PaperFrame
                stage={stage}
                level={level}
                controls={transition.sheet}
                veil={transition.veil}
              >
                <div ref={setPaperEl} className="stage-paper" style={paperStyle}>
                  <ErrorBoundary titleKey="error.documentRender">
                    {viewConfig.customCss?.trim() && (
                      <style dangerouslySetInnerHTML={{ __html: viewConfig.customCss }} />
                    )}
                    <div
                      ref={attachDoc}
                      className={documentClassName(viewConfig)}
                      style={docStyle}
                      {...docAttrs}
                    >
                      {!isEmpty && (
                        <MarkdownRenderer
                          content={content}
                          resolvedTheme={resolvedTheme}
                          hand={viewConfig.hand}
                        />
                      )}
                    </div>
                  </ErrorBoundary>

                  {isEmpty && onUseTemplate && onUseSample && (
                    <PreviewEmpty onUseTemplate={onUseTemplate} onUseSample={onUseSample} />
                  )}

                  {mode === 'pages' && !isEmpty && (
                    <PageRuler docEl={docEl} config={config} revision={content.length} />
                  )}

                  <FocusOverlay
                    docEl={docEl}
                    frameEl={paperEl}
                    enabled={mode === 'focus' && !isEmpty}
                  />
                </div>
              </PaperFrame>
            </div>
          </div>
        </div>

        {onSkinChange && (
          <SkinPalette
            open={skinsOpen}
            onClose={closeSkins}
            skin={config.skin}
            accentColor={viewConfig.accentColor}
            onPreview={previewSkin}
            onCommit={commitSkin}
          />
        )}

        <AnimatePresence>
          {transition.labelVisible && (
            <motion.div
              className="stage-label"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={transitionQuick}
            >
              {t(stage.nameKey)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  },
)
