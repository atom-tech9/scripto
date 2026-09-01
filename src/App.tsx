import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import type { EditorView } from '@codemirror/view'
import { FileDown, Minimize2, Moon, Settings2 } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { StatusBar } from '@/components/layout/StatusBar'
import {
  ONBOARDING_DEFAULT,
  OnboardingChecklist,
  type OnboardingState,
} from '@/components/layout/OnboardingChecklist'
import { OutlineNavigator } from '@/components/layout/OutlineNavigator'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { TemplatesDialog } from '@/components/layout/TemplatesDialog'
import { ThemeGalleryDialog } from '@/components/layout/ThemeGalleryDialog'
import { ShortcutsDialog } from '@/components/layout/ShortcutsDialog'
import { FormattingHelpDialog } from '@/components/layout/FormattingHelpDialog'
import { DocumentsDialog } from '@/components/layout/DocumentsDialog'
import { StatsDialog } from '@/components/layout/StatsDialog'
import { PresetsDialog } from '@/components/layout/PresetsDialog'
import { SecurityDialog } from '@/components/security/SecurityDialog'
import { useConfirm } from '@/components/ui/Confirm'
import { getSelectionText, insertText } from '@/components/editor/editorCommands'
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SimpleHintBar } from '@/components/editor/SimpleHintBar'
import { SelectionToolbar } from '@/components/editor/SelectionToolbar'
import { AiSuggestionCard } from '@/components/editor/AiSuggestionCard'
import { Preview, type PreviewHandle } from '@/components/preview/Preview'
import { ConfigPanel } from '@/components/config/ConfigPanel'

import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/i18n'
import { useMode } from '@/mode'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useDocumentLibrary } from '@/hooks/useDocumentLibrary'
import { useScrollSync } from '@/hooks/useScrollSync'
import { useDialogs } from '@/hooks/useDialogs'
import { useAiActions } from '@/hooks/useAiActions'
import { useDeepLinks } from '@/hooks/useDeepLinks'
import { useCommands } from '@/hooks/useCommands'
import { useExportPresets } from '@/hooks/useExportPresets'

import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/lib/constants'
import { mergePreset } from '@/lib/presets'
import { countHeadings } from '@/lib/utils'
import { getErrorMessage } from '@/lib/logger'
import { parseFrontmatter, applyFrontmatter } from '@/lib/frontmatter'
import { SAMPLE_DOCUMENT } from '@/data/sampleDocument'
import { DOCUMENT_PRESETS } from '@/data/presets'
import { fillResumePlaceholders, type DocumentTemplate, type ResumeDetails } from '@/data/templates'
import { ResumeDetailsDialog } from '@/components/layout/ResumeDetailsDialog'
import { GithubDialog } from '@/components/layout/GithubDialog'
import { AiSettingsDialog } from '@/components/layout/AiSettingsDialog'
import { AiDashboardDialog } from '@/components/layout/AiDashboardDialog'
import { AiInputDialog } from '@/components/layout/AiInputDialog'
import { DEFAULT_AI_CONFIG, isAiConfigured, type AiConfig } from '@/lib/ai'
import { ACCEPTED_IMPORT, importFile } from '@/io/importers'
import { trackEvent } from '@/lib/analytics'
import { exportHtml, exportMarkdown, exportWord } from '@/io/exporters'
import type { AppLockApi } from '@/hooks/useAppLock'
import type { DocumentSkin, ExportPreset, PdfConfig, ViewMode } from '@/types'

// The PDF engine (Paged.js) is heavy — load it only when a PDF/print is requested.
const PrintPreview = lazy(() =>
  import('@/components/preview/PrintPreview').then((m) => ({ default: m.PrintPreview })),
)

// A generated TOC is wrapped in HTML comment markers (invisible via rehype-raw) so it can be removed later.
const TOC_START = '<!-- toc -->'
const TOC_END = '<!-- /toc -->'
const TOC_BLOCK_RE = /\n*<!-- toc -->[\s\S]*?<!-- \/toc -->\n*/

interface AppProps {
  lock: AppLockApi
}

export default function App({ lock }: AppProps) {
  const { mode: themeMode, resolvedTheme, cycleTheme } = useTheme()
  const ui = useLanguage()
  const { t } = ui
  const isRtl = ui.dir === 'rtl'
  const { isSimple, toggle: toggleMode } = useMode()
  const confirm = useConfirm()

  const library = useDocumentLibrary()
  const { activeDoc } = library
  const markdown = activeDoc.content
  const setMarkdown = library.updateContent
  const setConfig = library.updateConfig

  // Normalise stored configs against the defaults so documents saved before a
  // new option existed never carry `undefined` fields.
  const config = useMemo<PdfConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...activeDoc.config,
      meta: { ...DEFAULT_CONFIG.meta, ...activeDoc.config?.meta },
      margins: { ...DEFAULT_CONFIG.margins, ...activeDoc.config?.margins },
      customSize: { ...DEFAULT_CONFIG.customSize, ...activeDoc.config?.customSize },
    }),
    [activeDoc.config],
  )

  // Every overlay/chrome flag lives in one reducer (see hooks/useDialogs.ts).
  // `openDialog`/`closeDialog`/`toggleDialog` and the thunk lookups are
  // identity-stable, so effects and memos below never re-run on a dialog toggle.
  const dialogs = useDialogs()
  const {
    open: openDialog,
    close: closeDialog,
    toggle: toggleDialog,
    opener,
    closer,
    toggler,
  } = dialogs
  const zen = dialogs.state.zen

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(STORAGE_KEYS.viewMode, 'split')
  const [splitRatio, setSplitRatio] = useLocalStorage<number>('scripto:split', 0.5)
  const [onboarding, setOnboarding] = useLocalStorage<OnboardingState>(
    'scripto:onboarding',
    ONBOARDING_DEFAULT,
  )
  const markOnboarding = useCallback(
    (step: 'template' | 'edit' | 'export') =>
      setOnboarding((prev) => (prev[step] ? prev : { ...prev, [step]: true })),
    [setOnboarding],
  )
  // Track the completing transition only — never on load for returning users.
  const onboardingBaselineRef = useRef<boolean | null>(null)
  useEffect(() => {
    const done = onboarding.template && onboarding.edit && onboarding.export
    if (onboardingBaselineRef.current === null) {
      onboardingBaselineRef.current = done
      return
    }
    if (done && !onboardingBaselineRef.current) {
      onboardingBaselineRef.current = true
      trackEvent('Onboarding Completed')
    }
  }, [onboarding])

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [pendingResume, setPendingResume] = useState<DocumentTemplate | null>(null)
  const [aiConfig, setAiConfig] = useLocalStorage<AiConfig>('scripto:ai', DEFAULT_AI_CONFIG)
  const [saving, setSaving] = useState(false)

  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const [previewScrollEl, setPreviewScrollEl] = useState<HTMLElement | null>(null)
  const previewRef = useRef<PreviewHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  // Editor AI overlays (floating toolbar + inline streaming suggestion).
  const editorWrapRef = useRef<HTMLDivElement>(null)
  const [activityTick, setActivityTick] = useState(0)
  const activityRaf = useRef<number | undefined>(undefined)
  const bumpActivity = useCallback(() => {
    if (activityRaf.current !== undefined) return
    activityRaf.current = window.requestAnimationFrame(() => {
      activityRaf.current = undefined
      setActivityTick((tick) => tick + 1)
    })
  }, [])
  // Never leave a queued frame behind on unmount.
  useEffect(
    () => () => {
      if (activityRaf.current !== undefined) window.cancelAnimationFrame(activityRaf.current)
    },
    [],
  )

  const debouncedMarkdown = useDebouncedValue(markdown, 120)
  const parsed = useMemo(() => parseFrontmatter(debouncedMarkdown), [debouncedMarkdown])
  const effectiveConfig = useMemo(
    () => applyFrontmatter(config, parsed.data),
    [config, parsed.data],
  )
  const headingCount = useMemo(() => countHeadings(parsed.body), [parsed.body])
  const bodyEmpty = parsed.body.trim().length === 0

  // Resolve single/double pane for small screens.
  const effectiveView: ViewMode = isDesktop ? viewMode : viewMode === 'split' ? 'editor' : viewMode
  const showEditor = effectiveView !== 'preview'
  const showPreview = effectiveView !== 'editor'
  const isSplit = showEditor && showPreview && isDesktop

  // Anchor-based scroll sync between the editor and preview (split view only).
  const [syncEnabled, setSyncEnabled] = useLocalStorage('scripto:scroll-sync', true)
  const getDoc = useCallback(() => previewRef.current?.getDocElement() ?? null, [])
  useScrollSync({
    view: editorView,
    previewScroll: previewScrollEl,
    getPreviewDoc: getDoc,
    bodyLineOffset: parsed.bodyLineOffset,
    enabled: syncEnabled && isSplit,
  })

  const startResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const container = mainRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const onMove = (e: MouseEvent) => {
        const fromStart = isRtl ? rect.right - e.clientX : e.clientX - rect.left
        const ratio = Math.min(0.8, Math.max(0.2, fromStart / rect.width))
        setSplitRatio(ratio)
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [setSplitRatio, isRtl],
  )

  // Autosave indicator + keep the encrypted vault in sync when locked.
  useEffect(() => {
    setSaving(true)
    lock.mirror()
    const id = window.setTimeout(() => setSaving(false), 500)
    return () => window.clearTimeout(id)
  }, [markdown, config, viewMode, lock])

  // Open the settings panel by default on desktop.
  useEffect(() => {
    if (isDesktop) openDialog('config')
  }, [isDesktop, openDialog])

  // Warn when the browser's storage quota is exceeded (usually large images).
  useEffect(() => {
    const onQuota = () =>
      toast.error(t('toast.quotaExceeded'), {
        duration: 6000,
      })
    window.addEventListener('scripto:quota-exceeded', onQuota)
    return () => window.removeEventListener('scripto:quota-exceeded', onQuota)
  }, [t])

  const updateConfig = useCallback(
    (patch: Partial<PdfConfig>) => setConfig((prev) => ({ ...prev, ...patch })),
    [setConfig],
  )

  // Stable identity matters: a fresh onChange each render makes the CodeMirror
  // wrapper reconfigure the editor, which drops dynamically-appended
  // extensions (e.g. the ⌘F search panel) the moment they open.
  const handleEditorChange = useCallback(
    (value: string) => {
      setMarkdown(value)
      markOnboarding('edit')
    },
    [setMarkdown, markOnboarding],
  )

  const openFormattingHelp = opener('formattingHelp')

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = DOCUMENT_PRESETS.find((p) => p.id === presetId)
      if (!preset) return
      setConfig((prev) => mergePreset(prev, preset.config))
      toast.success(`${t('toast.themeApplied')} “${t(preset.nameKey)}”`)
    },
    [setConfig, t],
  )

  // ---- user export presets -------------------------------------------------
  const exportPresets = useExportPresets()

  const applyExportPreset = useCallback(
    (preset: ExportPreset) => {
      setConfig((prev) => mergePreset(prev, preset.config))
      toast.success(`${t('toast.presetApplied')} “${preset.name}”`)
    },
    [setConfig, t],
  )

  const saveExportPreset = useCallback(
    (name: string) => {
      if (!exportPresets.save(name, config)) return
      toast.success(t('toast.presetSaved'))
    },
    [exportPresets, config, t],
  )

  const deleteExportPreset = useCallback(
    (id: string) => {
      exportPresets.remove(id)
      toast.success(t('toast.presetDeleted'))
    },
    [exportPresets, t],
  )

  const importExportPresets = useCallback(
    (incoming: ExportPreset[]) => {
      exportPresets.merge(incoming)
      toast.success(t('toast.presetsImported'))
    },
    [exportPresets, t],
  )

  const handleImportClick = useCallback(() => fileInputRef.current?.click(), [])

  const handleFileSelected = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      try {
        const result = await importFile(file)
        library.createDoc(result.markdown, result.name)
        trackEvent('Import', { source: file.name.split('.').pop()?.toLowerCase() || 'file' })
        toast.success(`${t('toast.imported')} “${file.name}”`)
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    },
    [library, t],
  )

  const handleEditorError = useCallback((message: string) => toast.error(message), [])

  const ensureDoc = useCallback((): HTMLElement | null => {
    const doc = getDoc()
    if (!doc || bodyEmpty) {
      toast.error(t('toast.nothingToExport'))
      return null
    }
    return doc
  }, [getDoc, bodyEmpty, t])

  const openPrint = useCallback(() => {
    if (bodyEmpty) {
      toast.error(t('toast.nothingToExport'))
      return
    }
    openDialog('print')
    trackEvent('Export PDF', { skin: effectiveConfig.skin, paper: effectiveConfig.paperSize })
    markOnboarding('export')
  }, [bodyEmpty, t, openDialog, markOnboarding, effectiveConfig.skin, effectiveConfig.paperSize])

  const handleExportWord = useCallback(() => {
    const doc = ensureDoc()
    if (!doc) return
    exportWord(doc, effectiveConfig, effectiveConfig.meta.title || 'document')
    trackEvent('Document Exported', { format: 'word' })
    toast.success(t('toast.wordExported'))
  }, [ensureDoc, effectiveConfig, t])

  const handleExportHtml = useCallback(() => {
    const doc = ensureDoc()
    if (!doc) return
    exportHtml(doc, effectiveConfig, effectiveConfig.meta.title || 'document')
    trackEvent('Document Exported', { format: 'html' })
    toast.success(t('toast.htmlExported'))
  }, [ensureDoc, effectiveConfig, t])

  const handleExportMarkdown = useCallback(() => {
    exportMarkdown(markdown, effectiveConfig.meta.title || 'document')
    trackEvent('Document Exported', { format: 'markdown' })
    toast.success(t('toast.markdownExported'))
  }, [markdown, effectiveConfig.meta.title, t])

  // Load a document's content and adopt any look declared in its front-matter
  // (skin, accent, margins, font) so the settings panel matches what renders.
  const loadResumeContent = useCallback(
    (content: string, name: string) => {
      setMarkdown(content)
      const { data } = parseFrontmatter(content)
      if (Object.keys(data).length > 0) setConfig((prev) => applyFrontmatter(prev, data))
      setPendingResume(null)
      toast.success(`${t('toast.templateLoaded')} “${name}”`)
    },
    [setMarkdown, setConfig, t],
  )

  const handleTemplate = useCallback(
    (template: DocumentTemplate) => {
      markOnboarding('template')
      trackEvent('Template Used', { template: template.id, source: 'picker' })
      // Résumé templates first collect the user's header details.
      if (template.resume) {
        setPendingResume(template)
        return
      }
      setMarkdown(template.content)
      toast.success(
        `${t('toast.templateLoaded')} “${template.nameKey ? t(template.nameKey) : template.name}”`,
      )
    },
    [setMarkdown, t, markOnboarding],
  )

  const handleResumeFill = useCallback(
    (details: ResumeDetails) => {
      if (!pendingResume) return
      loadResumeContent(
        fillResumePlaceholders(pendingResume.content, details),
        pendingResume.nameKey ? t(pendingResume.nameKey) : pendingResume.name,
      )
    },
    [pendingResume, loadResumeContent, t],
  )

  const handleResumeSkip = useCallback(() => {
    if (!pendingResume) return
    loadResumeContent(
      pendingResume.content,
      pendingResume.nameKey ? t(pendingResume.nameKey) : pendingResume.name,
    )
  }, [pendingResume, loadResumeContent, t])

  // Deep links from the marketing pages: /app?template=<id>&skin=<id>.
  useDeepLinks({ createDoc: library.createDoc, setConfig, markOnboarding })

  const handleClear = useCallback(async () => {
    const ok = await confirm({
      title: t('confirm.clear.title'),
      description: t('confirm.clear.body'),
      confirmLabel: t('action.clear'),
      destructive: true,
    })
    if (ok) {
      setMarkdown('# Untitled\n\n')
      toast.success(t('toast.documentCleared'))
    }
  }, [setMarkdown, confirm, t])

  const tocPresent = useMemo(() => markdown.includes(TOC_START), [markdown])

  // Insert a table of contents at the cursor, or remove it when one is already present.
  const handleToggleToc = useCallback(() => {
    if (tocPresent) {
      setMarkdown(markdown.replace(TOC_BLOCK_RE, '\n\n'))
      toast.success(t('toast.tocRemoved'))
      return
    }
    const doc = getDoc()
    if (!doc || !editorView) {
      toast.error(t('toast.addHeadingsFirst'))
      return
    }
    const headings = Array.from(doc.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')).filter(
      (h) => h.id && h.textContent?.trim(),
    )
    if (headings.length === 0) {
      toast.error(t('toast.noHeadingsForToc'))
      return
    }
    const lines = headings.map((h) => {
      const depth = Number(h.tagName.substring(1))
      const indent = '  '.repeat(Math.max(0, depth - 1))
      return `${indent}- [${h.textContent?.trim()}](#${h.id})`
    })
    insertText(editorView, `\n${TOC_START}\n${lines.join('\n')}\n${TOC_END}\n\n`)
    toast.success(t('toast.tocInserted'))
  }, [tocPresent, markdown, setMarkdown, getDoc, editorView, t])

  // Subtle one-time toast the first time rich content is pasted as Markdown.
  const [pasteHintSeen, setPasteHintSeen] = useLocalStorage('scripto:paste-hint-seen', false)
  const handlePastedAsMarkdown = useCallback(() => {
    if (pasteHintSeen) return
    setPasteHintSeen(true)
    toast.success(t('toast.pastedAsMarkdown'))
  }, [pasteHintSeen, setPasteHintSeen, t])

  const handleCopyHtml = useCallback(async () => {
    const doc = ensureDoc()
    if (!doc) return
    try {
      await navigator.clipboard.writeText(doc.innerHTML)
      toast.success(t('toast.htmlCopied'))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }, [ensureDoc, t])

  // ---- AI assist (bring your own key) --------------------------------------
  const openAiSettings = opener('aiSettings')
  const ai = useAiActions({ view: editorView, aiConfig, onNeedsSettings: openAiSettings })

  const handleRemoveAiKey = useCallback(async () => {
    const ok = await confirm({
      title: t('confirm.removeKey.title'),
      description: t('confirm.removeKey.body'),
      confirmLabel: t('confirm.removeKey.confirm'),
      destructive: true,
    })
    if (!ok) return
    setAiConfig((prev) => ({ ...prev, apiKey: '' }))
    closeDialog('aiDashboard')
    toast.success(t('toast.apiKeyRemoved'))
  }, [confirm, setAiConfig, closeDialog, t])

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'k') {
        e.preventDefault()
        toggleDialog('palette')
      } else if (key === 's' || key === 'p') {
        e.preventDefault()
        openPrint()
      } else if (key === 'o') {
        e.preventDefault()
        handleImportClick()
      } else if (key === '/') {
        e.preventDefault()
        toggleDialog('shortcuts')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openPrint, handleImportClick, toggleDialog])

  // Escape exits focus mode.
  useEffect(() => {
    if (!zen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog('zen')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [zen, closeDialog])

  const toggleSync = useCallback(() => setSyncEnabled((value) => !value), [setSyncEnabled])

  const handleSkinChange = useCallback(
    (skin: DocumentSkin) => {
      updateConfig({ skin })
      trackEvent('Skin Applied', { skin, source: 'rail' })
    },
    [updateConfig],
  )

  const handleHandFontError = useCallback(
    (family: string) => toast.error(`${t('toast.handFontFailed')} (${family})`),
    [t],
  )

  const handleNewDocument = useCallback(() => library.createDoc(), [library])
  const handleLoadSample = useCallback(() => setMarkdown(SAMPLE_DOCUMENT), [setMarkdown])
  const handleLockNow = useCallback(() => void lock.lockNow(), [lock])

  const commands = useCommands({
    openDialog: opener,
    toggleDialog: toggler,
    onExportPdf: openPrint,
    onExportWord: handleExportWord,
    onExportHtml: handleExportHtml,
    onExportMarkdown: handleExportMarkdown,
    onCopyHtml: handleCopyHtml,
    tocPresent,
    onToggleToc: handleToggleToc,
    onAi: ai.handleAction,
    onNewDocument: handleNewDocument,
    onImport: handleImportClick,
    onLoadSample: handleLoadSample,
    onClear: handleClear,
    isSimple,
    onToggleSimpleMode: toggleMode,
    onViewMode: setViewMode,
    onCycleTheme: cycleTheme,
    canLock: lock.status === 'unlocked',
    onLockNow: handleLockNow,
    onApplyPreset: applyPreset,
  })

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {!zen && (
        <Header
          title={config.meta.title}
          onTitleChange={(title) =>
            setConfig((prev) => ({ ...prev, meta: { ...prev.meta, title } }))
          }
          viewMode={viewMode}
          onViewMode={setViewMode}
          outlineOpen={dialogs.state.outline}
          onToggleOutline={toggler('outline')}
          themeMode={themeMode}
          onCycleTheme={cycleTheme}
          saving={saving}
          configOpen={dialogs.state.config}
          onToggleConfig={toggler('config')}
          onOpenTemplates={opener('templates')}
          onOpenThemes={opener('gallery')}
          onOpenDocuments={opener('docs')}
          onToggleZen={opener('zen')}
          onImport={handleImportClick}
          onImportGithub={opener('github')}
          onExportPdf={openPrint}
          onPrintPreview={openPrint}
          onExportWord={handleExportWord}
          onExportHtml={handleExportHtml}
          onExportMarkdown={handleExportMarkdown}
          onShortcuts={opener('shortcuts')}
          onOpenFormattingHelp={openFormattingHelp}
          onOpenSecurity={opener('security')}
          onOpenAi={opener('aiDashboard')}
          onOpenCommand={opener('palette')}
          uiLang={ui.lang}
          onToggleLang={ui.toggle}
          secured={lock.status === 'unlocked'}
          aiActive={isAiConfigured(aiConfig)}
        />
      )}

      <div ref={mainRef} className="relative flex min-h-0 flex-1">
        {!zen && dialogs.state.outline && (
          <aside className="hidden w-60 shrink-0 border-e border-border bg-surface sm:block">
            <div className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('action.outline')}
            </div>
            <div className="h-[calc(100%-2.6rem)]">
              <OutlineNavigator content={parsed.body} getDocElement={getDoc} />
            </div>
          </aside>
        )}

        <section
          style={isSplit ? { flex: `0 0 ${splitRatio * 100}%` } : undefined}
          className={`flex min-w-0 flex-col border-e border-border ${
            showEditor ? (isSplit ? '' : 'flex-1') : 'hidden'
          }`}
        >
          <EditorToolbar
            view={editorView}
            tocPresent={tocPresent}
            onToggleToc={handleToggleToc}
            onAi={ai.handleAction}
          />
          {isSimple && <SimpleHintBar onOpenFormattingHelp={openFormattingHelp} />}
          <div ref={editorWrapRef} className="relative min-h-0 flex-1 bg-surface">
            <MarkdownEditor
              value={markdown}
              onChange={handleEditorChange}
              resolvedTheme={resolvedTheme}
              direction={effectiveConfig.direction === 'auto' ? ui.dir : effectiveConfig.direction}
              onReady={setEditorView}
              onActivity={bumpActivity}
              slashAi={ai.handleAction}
              onSlashHelp={openFormattingHelp}
              onPastedAsMarkdown={handlePastedAsMarkdown}
              ghostComplete={
                aiConfig.autocomplete && isAiConfigured(aiConfig) ? ai.ghostComplete : undefined
              }
              onError={handleEditorError}
            />
            <SelectionToolbar
              view={editorView}
              wrapperRef={editorWrapRef}
              tick={activityTick}
              suppressed={ai.suggestion !== null}
              onAction={ai.handleAction}
            />
            {ai.suggestion && (
              <AiSuggestionCard
                view={editorView}
                wrapperRef={editorWrapRef}
                tick={activityTick}
                suggestion={ai.suggestion}
                onAccept={ai.accept}
                onReject={ai.reject}
                onRegenerate={ai.regenerate}
              />
            )}
          </div>
        </section>

        {isSplit && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t('aria.resize')}
            onMouseDown={startResize}
            className="group relative w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/50"
          >
            <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
          </div>
        )}

        {/* Preview (kept mounted for export even when visually hidden) */}
        <section className={`min-w-0 flex-1 ${showPreview ? 'block' : 'hidden'}`}>
          <Preview
            ref={previewRef}
            content={parsed.body}
            config={effectiveConfig}
            resolvedTheme={resolvedTheme}
            onScrollElement={setPreviewScrollEl}
            syncEnabled={isSplit ? syncEnabled : undefined}
            onToggleSync={isSplit ? toggleSync : undefined}
            onSkinChange={handleSkinChange}
            onOpenPrint={openPrint}
            forceMinimal={zen}
            isEmpty={bodyEmpty}
            onUseTemplate={opener('templates')}
            onUseSample={handleLoadSample}
          />
        </section>

        {!zen && dialogs.state.config && (
          <aside className="absolute inset-y-0 end-0 z-20 w-80 max-w-[85vw] border-s border-border bg-surface shadow-xl lg:static lg:z-0 lg:max-w-none lg:shadow-none">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold">{t('config.exportSettings')}</span>
              <button
                onClick={closer('config')}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                aria-label={t('aria.closeSettings')}
              >
                <Settings2 size={16} />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <ConfigPanel
                config={config}
                onChange={updateConfig}
                onApplyPreset={applyPreset}
                onManagePresets={opener('presets')}
                onHandFontError={handleHandFontError}
              />
            </div>
          </aside>
        )}
      </div>

      {!zen && (
        <StatusBar
          content={parsed.body}
          config={effectiveConfig}
          headingCount={headingCount}
          onOpenStats={opener('stats')}
        />
      )}

      {!zen && (
        <OnboardingChecklist
          state={onboarding}
          onDismiss={() => setOnboarding((prev) => ({ ...prev, dismissed: true }))}
          onOpenTemplates={opener('templates')}
        />
      )}

      {zen && (
        <div className="absolute end-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-border bg-surface/90 p-1 shadow-lg backdrop-blur animate-fade-in">
          <button
            onClick={openPrint}
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground hover:bg-muted"
          >
            <FileDown size={14} /> {t('zen.pdf')}
          </button>
          <button
            onClick={cycleTheme}
            aria-label={t('command.cycleTheme')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Moon size={15} />
          </button>
          <button
            onClick={closer('zen')}
            aria-label={t('zen.exitAria')}
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Minimize2 size={14} /> {t('zen.exit')}
          </button>
        </div>
      )}

      <CommandPalette
        open={dialogs.state.palette}
        onClose={closer('palette')}
        commands={commands}
      />
      <DocumentsDialog
        open={dialogs.state.docs}
        onClose={closer('docs')}
        docs={library.docs}
        activeId={library.activeId}
        onSelect={library.selectDoc}
        onCreate={handleNewDocument}
        onDuplicate={library.duplicateDoc}
        onDelete={library.deleteDoc}
        onImport={library.importDocs}
        onNotify={(type, message) =>
          type === 'success' ? toast.success(message) : toast.error(message)
        }
      />
      <SecurityDialog open={dialogs.state.security} onClose={closer('security')} lock={lock} />
      <StatsDialog open={dialogs.state.stats} onClose={closer('stats')} markdown={parsed.body} />
      <TemplatesDialog
        open={dialogs.state.templates}
        onClose={closer('templates')}
        onSelect={handleTemplate}
      />
      <ThemeGalleryDialog
        open={dialogs.state.gallery}
        onClose={closer('gallery')}
        config={config}
        onApply={updateConfig}
        onApplyPreset={applyPreset}
        userPresets={exportPresets.presets}
        onApplyUserPreset={applyExportPreset}
        onManagePresets={opener('presets')}
      />
      <PresetsDialog
        open={dialogs.state.presets}
        onClose={closer('presets')}
        presets={exportPresets.presets}
        config={config}
        onSave={saveExportPreset}
        onRename={exportPresets.rename}
        onDelete={deleteExportPreset}
        onApply={applyExportPreset}
        onImport={importExportPresets}
        onNotify={(type, message) =>
          type === 'success' ? toast.success(message) : toast.error(message)
        }
      />
      <ResumeDetailsDialog
        open={pendingResume !== null}
        onClose={() => setPendingResume(null)}
        templateName={pendingResume?.name ?? ''}
        onFill={handleResumeFill}
        onSkip={handleResumeSkip}
      />
      <GithubDialog
        open={dialogs.state.github}
        onClose={closer('github')}
        onImport={(md, name) => library.createDoc(md, name)}
      />
      <AiDashboardDialog
        open={dialogs.state.aiDashboard}
        onClose={closer('aiDashboard')}
        config={aiConfig}
        encryptedAtRest={lock.status !== 'open'}
        hasSelection={!!editorView && getSelectionText(editorView).trim().length > 0}
        onRun={ai.handleAction}
        onEditSettings={() => {
          closeDialog('aiDashboard')
          openDialog('aiSettings')
        }}
        onRemoveKey={handleRemoveAiKey}
        onOpenSecurity={opener('security')}
      />
      <AiSettingsDialog
        open={dialogs.state.aiSettings}
        onClose={closer('aiSettings')}
        config={aiConfig}
        onSave={setAiConfig}
      />
      <AiInputDialog
        open={ai.inputRequest !== null}
        request={ai.inputRequest}
        onClose={ai.closeInput}
        onSubmit={ai.submitInput}
      />
      <ShortcutsDialog open={dialogs.state.shortcuts} onClose={closer('shortcuts')} />
      <FormattingHelpDialog
        open={dialogs.state.formattingHelp}
        onClose={closer('formattingHelp')}
      />
      {dialogs.state.print && (
        <Suspense fallback={null}>
          <PrintPreview
            open={dialogs.state.print}
            onClose={closer('print')}
            getDocElement={getDoc}
            config={effectiveConfig}
            markdown={markdown}
            onMarkdownChange={setMarkdown}
            bodyLineOffset={parsed.bodyLineOffset}
            docRevision={parsed.body}
          />
        </Suspense>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMPORT}
        className="hidden"
        onChange={(e) => {
          void handleFileSelected(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <Toaster
        position="bottom-center"
        theme={resolvedTheme}
        richColors
        toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
      />
    </div>
  )
}
