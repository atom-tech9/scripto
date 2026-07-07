import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import type { EditorView } from '@codemirror/view'
import {
  BookOpen,
  Eye,
  FileCode2,
  FileDown,
  FilePlus,
  FileText,
  FileType2,
  FolderOpen,
  Github,
  GraduationCap,
  Import,
  BarChart3,
  Keyboard,
  KeyRound,
  Languages,
  LayoutTemplate,
  ListTree,
  Lock,
  Maximize2,
  Minimize2,
  Moon,
  Palette,
  Sparkles,
  Wand2,
  Pencil,
  Printer,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { StatusBar } from '@/components/layout/StatusBar'
import {
  ONBOARDING_DEFAULT,
  OnboardingChecklist,
  type OnboardingState,
} from '@/components/layout/OnboardingChecklist'
import { OutlineNavigator } from '@/components/layout/OutlineNavigator'
import { CommandPalette, type Command } from '@/components/layout/CommandPalette'
import { TemplatesDialog } from '@/components/layout/TemplatesDialog'
import { ThemeGalleryDialog } from '@/components/layout/ThemeGalleryDialog'
import { ShortcutsDialog } from '@/components/layout/ShortcutsDialog'
import { FormattingHelpDialog } from '@/components/layout/FormattingHelpDialog'
import { DocumentsDialog } from '@/components/layout/DocumentsDialog'
import { StatsDialog } from '@/components/layout/StatsDialog'
import { SecurityDialog } from '@/components/security/SecurityDialog'
import { useConfirm } from '@/components/ui/Confirm'
import {
  getSelectionText,
  insertText,
  selectionOrParagraph,
} from '@/components/editor/editorCommands'
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'
import { EditorToolbar, type AiToolbarAction } from '@/components/editor/EditorToolbar'
import { SimpleHintBar } from '@/components/editor/SimpleHintBar'
import { SelectionToolbar } from '@/components/editor/SelectionToolbar'
import { AiSuggestionCard, type AiSuggestionState } from '@/components/editor/AiSuggestionCard'
import { Preview, type PreviewHandle } from '@/components/preview/Preview'
import { EmptyState } from '@/components/preview/EmptyState'
import { ConfigPanel } from '@/components/config/ConfigPanel'

import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/i18n'
import { useMode } from '@/mode'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useDocumentLibrary } from '@/hooks/useDocumentLibrary'
import { useScrollSync } from '@/hooks/useScrollSync'

import { DEFAULT_CONFIG, MARGIN_PRESETS, STORAGE_KEYS } from '@/lib/constants'
import { countHeadings } from '@/lib/utils'
import { getErrorMessage } from '@/lib/logger'
import { parseFrontmatter, applyFrontmatter } from '@/lib/frontmatter'
import { SAMPLE_DOCUMENT } from '@/data/sampleDocument'
import { DOCUMENT_PRESETS } from '@/data/presets'
import {
  TEMPLATES,
  fillResumePlaceholders,
  type DocumentTemplate,
  type ResumeDetails,
} from '@/data/templates'
import { SKIN_VALUES } from '@/data/skins'
import { ResumeDetailsDialog } from '@/components/layout/ResumeDetailsDialog'
import { GithubDialog } from '@/components/layout/GithubDialog'
import { AiSettingsDialog } from '@/components/layout/AiSettingsDialog'
import { AiDashboardDialog } from '@/components/layout/AiDashboardDialog'
import { AiInputDialog, type AiInputRequest } from '@/components/layout/AiInputDialog'
import { AI_PROMPTS } from '@/lib/aiPrompts'
import { DEFAULT_AI_CONFIG, isAiConfigured, runAi, type AiConfig } from '@/lib/ai'
import { ACCEPTED_IMPORT, importFile } from '@/io/importers'
import { trackEvent } from '@/lib/analytics'
import { exportHtml, exportMarkdown, exportWord } from '@/io/exporters'
import type { AppLockApi } from '@/hooks/useAppLock'
import type { DocumentSkin, PdfConfig, ViewMode } from '@/types'

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
  const [configOpen, setConfigOpen] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [pendingResume, setPendingResume] = useState<DocumentTemplate | null>(null)
  const [githubOpen, setGithubOpen] = useState(false)
  const [aiConfig, setAiConfig] = useLocalStorage<AiConfig>('scripto:ai', DEFAULT_AI_CONFIG)
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false)
  const [aiDashboardOpen, setAiDashboardOpen] = useState(false)
  const [aiInput, setAiInput] = useState<{ request: AiInputRequest; run: (value: string) => void } | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [formattingHelpOpen, setFormattingHelpOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [zen, setZen] = useState(false)
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
      setActivityTick((t) => t + 1)
    })
  }, [])
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestionState | null>(null)
  const suggestionAbortRef = useRef<AbortController | null>(null)

  const debouncedMarkdown = useDebouncedValue(markdown, 120)
  const parsed = useMemo(() => parseFrontmatter(debouncedMarkdown), [debouncedMarkdown])
  const effectiveConfig = useMemo(() => applyFrontmatter(config, parsed.data), [config, parsed.data])
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
    if (isDesktop) setConfigOpen(true)
  }, [isDesktop])

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

  const openFormattingHelp = useCallback(() => setFormattingHelpOpen(true), [])

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = DOCUMENT_PRESETS.find((p) => p.id === presetId)
      if (!preset) return
      setConfig((prev) => {
        const margins =
          preset.config.marginPreset && preset.config.marginPreset !== 'custom'
            ? MARGIN_PRESETS[preset.config.marginPreset]
            : prev.margins
        return { ...prev, ...preset.config, margins }
      })
      toast.success(`${t('toast.themeApplied')} “${t(preset.nameKey)}”`)
    },
    [setConfig, t],
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
    setPrintOpen(true)
    trackEvent('Export PDF', { skin: effectiveConfig.skin, paper: effectiveConfig.paperSize })
    markOnboarding('export')
  }, [bodyEmpty, t, markOnboarding, effectiveConfig.skin, effectiveConfig.paperSize])

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
      toast.success(`${t('toast.templateLoaded')} “${template.nameKey ? t(template.nameKey) : template.name}”`)
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
  // A template opens as a NEW document (never clobbers existing work); a skin
  // applies to the now-active document. Params are consumed from the URL.
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    if (deepLinkHandled.current) return
    deepLinkHandled.current = true
    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('template')
    const skinId = params.get('skin')
    if (templateId === null && skinId === null) return

    const template = templateId ? TEMPLATES.find((entry) => entry.id === templateId) : undefined
    const skin: DocumentSkin | undefined =
      skinId && (SKIN_VALUES as string[]).includes(skinId) ? (skinId as DocumentSkin) : undefined

    if (template) {
      const name = template.nameKey ? t(template.nameKey) : template.name
      library.createDoc(template.content, name)
      const { data } = parseFrontmatter(template.content)
      if (Object.keys(data).length > 0) setConfig((prev) => applyFrontmatter(prev, data))
      toast.success(`${t('toast.templateLoaded')} “${name}”`)
      trackEvent('Template Used', { template: template.id, source: 'deeplink' })
      markOnboarding('template')
    }
    if (skin) {
      setConfig((prev) => ({ ...prev, skin }))
      trackEvent('Skin Applied', { skin, source: 'deeplink' })
      toast.success(t('toast.skinApplied'))
    }

    params.delete('template')
    params.delete('skin')
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    )
  }, [library, setConfig, t, markOnboarding])

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
  // Resolve the text an AI action should operate on: the selection if there is
  // one, otherwise the paragraph around the cursor (so users aren't blocked by
  // having to select first). Also makes that range the active selection so the
  // result visibly replaces it. Routes to settings when no key is configured.
  const requireSelection = useCallback((): {
    view: EditorView
    from: number
    to: number
    text: string
  } | null => {
    if (!editorView) {
      toast.error(t('toast.openEditorForAi'))
      return null
    }
    const target = selectionOrParagraph(editorView)
    if (!target) {
      toast.error(t('toast.addTextFirst'))
      return null
    }
    if (!isAiConfigured(aiConfig)) {
      toast.error(t('toast.addApiKeyFirst'))
      setAiSettingsOpen(true)
      return null
    }
    // Select the resolved range so the AI result replaces it in place.
    editorView.dispatch({ selection: { anchor: target.from, head: target.to } })
    return { view: editorView, from: target.from, to: target.to, text: target.text }
  }, [editorView, aiConfig, t])

  // Stream an AI edit into a staged suggestion the document shows live; the user
  // then accepts, rejects, or regenerates it. The doc isn't changed until accept.
  const runStaged = useCallback(
    (params: {
      system: string
      source: string
      kind: 'replace' | 'insert'
      from: number
      to: number
      label: string
    }) => {
      const { system, source, kind, from, to, label } = params
      suggestionAbortRef.current?.abort()
      const controller = new AbortController()
      suggestionAbortRef.current = controller
      setAiSuggestion({ from, to, kind, label, text: '', status: 'streaming', system, source })
      void (async () => {
        try {
          const full = await runAi(aiConfig, system, source, {
            signal: controller.signal,
            onToken: (chunk) =>
              setAiSuggestion((prev) =>
                prev && prev.status === 'streaming' ? { ...prev, text: prev.text + chunk } : prev,
              ),
          })
          if (controller.signal.aborted) return
          setAiSuggestion((prev) =>
            prev ? { ...prev, text: full.trim() || prev.text, status: 'done' } : prev,
          )
        } catch (error) {
          if (controller.signal.aborted) return
          setAiSuggestion((prev) =>
            prev ? { ...prev, status: 'error', error: getErrorMessage(error) } : prev,
          )
        }
      })()
    },
    [aiConfig],
  )

  const acceptSuggestion = useCallback(() => {
    if (!aiSuggestion || !editorView || aiSuggestion.status === 'streaming') return
    const { from, to, text } = aiSuggestion
    editorView.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from, head: from + text.length },
    })
    editorView.focus()
    setAiSuggestion(null)
    toast.success(t('toast.aiEditApplied'))
  }, [aiSuggestion, editorView, t])

  const rejectSuggestion = useCallback(() => {
    suggestionAbortRef.current?.abort()
    setAiSuggestion(null)
    editorView?.focus()
  }, [editorView])

  const regenerateSuggestion = useCallback(() => {
    if (!aiSuggestion) return
    const { system, source, kind, from, to, label } = aiSuggestion
    runStaged({ system, source, kind, from, to, label })
  }, [aiSuggestion, runStaged])

  // Inline ghost-text autocomplete (only wired when enabled in AI settings).
  const ghostComplete = useCallback(
    (prefix: string, signal: AbortSignal): Promise<string> =>
      runAi(aiConfig, AI_PROMPTS.autocomplete, prefix, { signal, bare: true }),
    [aiConfig],
  )

  const runSelectionTransform = useCallback(
    (system: string, label: string) => {
      const sel = requireSelection()
      if (!sel) return
      runStaged({ system, source: sel.text, kind: 'replace', from: sel.from, to: sel.to, label })
    },
    [requireSelection, runStaged],
  )

  const startGenerate = useCallback(() => {
    if (!editorView) {
      toast.error(t('toast.openEditorForAi'))
      return
    }
    if (!isAiConfigured(aiConfig)) {
      toast.error(t('toast.addApiKeyFirst'))
      setAiSettingsOpen(true)
      return
    }
    const pos = editorView.state.selection.main.head
    setAiInput({
      request: {
        title: t('ai.generate.title'),
        description: t('ai.generate.desc'),
        label: t('ai.generate.label'),
        placeholder: t('ai.generate.placeholder'),
        multiline: true,
        submitLabel: t('ai.generate.submit'),
      },
      run: (prompt) =>
        runStaged({
          system: AI_PROMPTS.generate,
          source: prompt,
          kind: 'insert',
          from: pos,
          to: pos,
          label: t('ai.generating'),
        }),
    })
  }, [editorView, aiConfig, runStaged, t])

  const startTone = useCallback(() => {
    const sel = requireSelection()
    if (!sel) return
    setAiInput({
      request: {
        title: t('ai.tone.title'),
        label: t('ai.tone.label'),
        placeholder: t('ai.tone.placeholder'),
        submitLabel: t('ai.tone.submit'),
      },
      run: (tone) =>
        runStaged({
          system: AI_PROMPTS.tone(tone),
          source: sel.text,
          kind: 'replace',
          from: sel.from,
          to: sel.to,
          label: t('ai.rewriting'),
        }),
    })
  }, [requireSelection, runStaged, t])

  const startTranslate = useCallback(() => {
    const sel = requireSelection()
    if (!sel) return
    setAiInput({
      request: {
        title: t('ai.translate.title'),
        label: t('ai.translate.label'),
        placeholder: t('ai.translate.placeholder'),
        submitLabel: t('ai.translate.submit'),
      },
      run: (language) =>
        runStaged({
          system: AI_PROMPTS.translate(language),
          source: sel.text,
          kind: 'replace',
          from: sel.from,
          to: sel.to,
          label: t('ai.translating'),
        }),
    })
  }, [requireSelection, runStaged, t])

  const handleAiAction = useCallback(
    (action: AiToolbarAction) => {
      if (action !== 'settings') trackEvent('AI Action', { action })
      switch (action) {
        case 'improve':
          return runSelectionTransform(AI_PROMPTS.improve, t('ai.improving'))
        case 'grammar':
          return runSelectionTransform(AI_PROMPTS.grammar, t('ai.fixingGrammar'))
        case 'concise':
          return runSelectionTransform(AI_PROMPTS.concise, t('ai.makingConcise'))
        case 'expand':
          return runSelectionTransform(AI_PROMPTS.expand, t('ai.expanding'))
        case 'summarize':
          return runSelectionTransform(AI_PROMPTS.summarize, t('ai.summarizing'))
        case 'tone':
          return startTone()
        case 'translate':
          return startTranslate()
        case 'generate':
          return startGenerate()
        case 'settings':
          return setAiSettingsOpen(true)
      }
    },
    [runSelectionTransform, startTone, startTranslate, startGenerate, t],
  )

  const handleRemoveAiKey = useCallback(async () => {
    const ok = await confirm({
      title: t('confirm.removeKey.title'),
      description: t('confirm.removeKey.body'),
      confirmLabel: t('confirm.removeKey.confirm'),
      destructive: true,
    })
    if (!ok) return
    setAiConfig((prev) => ({ ...prev, apiKey: '' }))
    setAiDashboardOpen(false)
    toast.success(t('toast.apiKeyRemoved'))
  }, [confirm, setAiConfig, t])

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      } else if (key === 's' || key === 'p') {
        e.preventDefault()
        openPrint()
      } else if (key === 'o') {
        e.preventDefault()
        handleImportClick()
      } else if (key === '/') {
        e.preventDefault()
        setShortcutsOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openPrint, handleImportClick])

  // Escape exits focus mode.
  useEffect(() => {
    if (!zen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [zen])

  const commands = useMemo<Command[]>(
    () => [
      { id: 'pdf', label: t('action.exportPdf'), group: t('group.export'), icon: FileDown, run: openPrint, hint: '⌘S' },
      { id: 'print', label: t('action.printPreview'), group: t('group.export'), icon: Printer, run: openPrint },
      { id: 'word', label: t('action.exportWord'), group: t('group.export'), icon: FileType2, run: handleExportWord },
      { id: 'html', label: t('action.exportHtml'), group: t('group.export'), icon: FileCode2, run: handleExportHtml },
      { id: 'md', label: t('action.exportMarkdown'), group: t('group.export'), icon: FileText, run: handleExportMarkdown },
      { id: 'copy-html', label: t('command.copyHtml'), group: t('group.export'), icon: FileCode2, run: handleCopyHtml },
      { id: 'insert-toc', label: tocPresent ? t('command.removeToc') : t('command.insertToc'), group: t('group.edit'), icon: ListTree, run: handleToggleToc },
      { id: 'ai-improve', label: t('command.aiImprove'), group: t('group.ai'), icon: Sparkles, keywords: 'rewrite polish', run: () => runSelectionTransform(AI_PROMPTS.improve, t('ai.improving')) },
      { id: 'ai-grammar', label: t('command.aiGrammar'), group: t('group.ai'), icon: Sparkles, keywords: 'spelling proofread', run: () => runSelectionTransform(AI_PROMPTS.grammar, t('ai.fixingGrammar')) },
      { id: 'ai-concise', label: t('command.aiConcise'), group: t('group.ai'), icon: Sparkles, keywords: 'shorten trim', run: () => runSelectionTransform(AI_PROMPTS.concise, t('ai.makingConcise')) },
      { id: 'ai-expand', label: t('command.aiExpand'), group: t('group.ai'), icon: Sparkles, keywords: 'elaborate lengthen', run: () => runSelectionTransform(AI_PROMPTS.expand, t('ai.expanding')) },
      { id: 'ai-summarize', label: t('command.aiSummarize'), group: t('group.ai'), icon: Sparkles, keywords: 'tldr summary', run: () => runSelectionTransform(AI_PROMPTS.summarize, t('ai.summarizing')) },
      { id: 'ai-tone', label: t('command.aiTone'), group: t('group.ai'), icon: Wand2, keywords: 'voice style', run: startTone },
      { id: 'ai-translate', label: t('command.aiTranslate'), group: t('group.ai'), icon: Languages, keywords: 'language localize', run: startTranslate },
      { id: 'ai-generate', label: t('command.aiGenerate'), group: t('group.ai'), icon: Wand2, keywords: 'write create', run: startGenerate },
      { id: 'ai-settings', label: t('command.aiSettings'), group: t('group.ai'), icon: KeyRound, keywords: 'api key openai anthropic', run: () => setAiSettingsOpen(true) },
      { id: 'themes', label: t('action.themes'), group: t('group.view'), icon: Palette, run: () => setGalleryOpen(true) },
      { id: 'stats', label: t('command.stats'), group: t('group.view'), icon: BarChart3, run: () => setStatsOpen(true) },
      { id: 'docs', label: t('action.documents'), group: t('group.file'), icon: FolderOpen, run: () => setDocsOpen(true) },
      { id: 'new', label: t('action.newDocument'), group: t('group.file'), icon: FilePlus, run: () => library.createDoc() },
      { id: 'import', label: t('command.importFile'), group: t('group.file'), icon: Import, run: handleImportClick, hint: '⌘O' },
      { id: 'github', label: t('action.importGithub'), group: t('group.file'), icon: Github, run: () => setGithubOpen(true) },
      { id: 'templates', label: t('command.browseTemplates'), group: t('group.file'), icon: LayoutTemplate, run: () => setTemplatesOpen(true) },
      { id: 'sample', label: t('command.loadSample'), group: t('group.file'), icon: FileText, run: () => setMarkdown(SAMPLE_DOCUMENT) },
      { id: 'clear', label: t('action.clear'), group: t('group.file'), icon: Trash2, run: handleClear },
      { id: 'simple-mode', label: isSimple ? t('mode.toStandard') : t('mode.toSimple'), group: t('group.view'), icon: GraduationCap, keywords: 'beginner easy simple guided', run: toggleMode },
      { id: 'zen', label: t('command.toggleFocus'), group: t('group.view'), icon: Maximize2, run: () => setZen((z) => !z) },
      { id: 'settings', label: t('command.toggleSettings'), group: t('group.view'), icon: Settings2, run: () => setConfigOpen((o) => !o) },
      { id: 'outline', label: t('command.toggleOutline'), group: t('group.view'), icon: LayoutTemplate, run: () => setOutlineOpen((o) => !o) },
      { id: 'editor', label: t('view.editor'), group: t('group.view'), icon: Pencil, run: () => setViewMode('editor') },
      { id: 'split', label: t('view.split'), group: t('group.view'), icon: LayoutTemplate, run: () => setViewMode('split') },
      { id: 'preview-view', label: t('view.preview'), group: t('group.view'), icon: Eye, run: () => setViewMode('preview') },
      { id: 'theme', label: t('command.cycleTheme'), group: t('group.view'), icon: Moon, run: cycleTheme },
      { id: 'security', label: t('action.security'), group: t('group.view'), icon: ShieldCheck, run: () => setSecurityOpen(true) },
      ...(lock.status === 'unlocked'
        ? [{ id: 'lock', label: t('command.lockNow'), group: t('group.view'), icon: Lock, run: () => void lock.lockNow() }]
        : []),
      { id: 'formatting-help', label: t('action.formattingHelp'), group: t('group.help'), icon: BookOpen, keywords: 'markdown syntax cheatsheet guide how', run: () => setFormattingHelpOpen(true) },
      { id: 'shortcuts', label: t('action.shortcuts'), group: t('group.help'), icon: Keyboard, run: () => setShortcutsOpen(true), hint: '⌘/' },
      ...DOCUMENT_PRESETS.map((p) => ({
        id: `preset-${p.id}`,
        label: `${t('command.themePrefix')} ${t(p.nameKey)}`,
        group: t('group.documentTheme'),
        icon: FileText,
        keywords: t(p.descKey),
        run: () => applyPreset(p.id),
      })),
    ],
    [
      t,
      openPrint,
      handleExportWord,
      handleExportHtml,
      handleExportMarkdown,
      handleCopyHtml,
      handleToggleToc,
      tocPresent,
      isSimple,
      toggleMode,
      handleClear,
      handleImportClick,
      setMarkdown,
      setViewMode,
      cycleTheme,
      applyPreset,
      library,
      lock,
      runSelectionTransform,
      startTone,
      startTranslate,
      startGenerate,
    ],
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {!zen && (
        <Header
          title={config.meta.title}
          onTitleChange={(title) => setConfig((prev) => ({ ...prev, meta: { ...prev.meta, title } }))}
          viewMode={viewMode}
          onViewMode={setViewMode}
          outlineOpen={outlineOpen}
          onToggleOutline={() => setOutlineOpen((o) => !o)}
          themeMode={themeMode}
          onCycleTheme={cycleTheme}
          saving={saving}
          configOpen={configOpen}
          onToggleConfig={() => setConfigOpen((o) => !o)}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onOpenThemes={() => setGalleryOpen(true)}
          onOpenDocuments={() => setDocsOpen(true)}
          onToggleZen={() => setZen(true)}
          onImport={handleImportClick}
          onImportGithub={() => setGithubOpen(true)}
          onExportPdf={openPrint}
          onPrintPreview={openPrint}
          onExportWord={handleExportWord}
          onExportHtml={handleExportHtml}
          onExportMarkdown={handleExportMarkdown}
          onShortcuts={() => setShortcutsOpen(true)}
          onOpenFormattingHelp={() => setFormattingHelpOpen(true)}
          onOpenSecurity={() => setSecurityOpen(true)}
          onOpenAi={() => setAiDashboardOpen(true)}
          onOpenCommand={() => setPaletteOpen(true)}
          uiLang={ui.lang}
          onToggleLang={ui.toggle}
          secured={lock.status === 'unlocked'}
          aiActive={isAiConfigured(aiConfig)}
        />
      )}

      <div ref={mainRef} className="relative flex min-h-0 flex-1">
        {!zen && outlineOpen && (
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
            onAi={handleAiAction}
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
              slashAi={handleAiAction}
              onSlashHelp={openFormattingHelp}
              onPastedAsMarkdown={handlePastedAsMarkdown}
              ghostComplete={
                aiConfig.autocomplete && isAiConfigured(aiConfig) ? ghostComplete : undefined
              }
              onError={handleEditorError}
            />
            <SelectionToolbar
              view={editorView}
              wrapperRef={editorWrapRef}
              tick={activityTick}
              suppressed={aiSuggestion !== null}
              onAction={handleAiAction}
            />
            {aiSuggestion && (
              <AiSuggestionCard
                view={editorView}
                wrapperRef={editorWrapRef}
                tick={activityTick}
                suggestion={aiSuggestion}
                onAccept={acceptSuggestion}
                onReject={rejectSuggestion}
                onRegenerate={regenerateSuggestion}
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
          {bodyEmpty ? (
            <EmptyState
              onUseTemplate={() => setTemplatesOpen(true)}
              onUseSample={() => setMarkdown(SAMPLE_DOCUMENT)}
            />
          ) : (
            <Preview
              ref={previewRef}
              content={parsed.body}
              config={effectiveConfig}
              resolvedTheme={resolvedTheme}
              onScrollElement={setPreviewScrollEl}
              syncEnabled={isSplit ? syncEnabled : undefined}
              onToggleSync={isSplit ? () => setSyncEnabled((v) => !v) : undefined}
            />
          )}
        </section>

        {!zen && configOpen && (
          <aside className="absolute inset-y-0 end-0 z-20 w-80 max-w-[85vw] border-s border-border bg-surface shadow-xl lg:static lg:z-0 lg:max-w-none lg:shadow-none">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold">{t('config.exportSettings')}</span>
              <button
                onClick={() => setConfigOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                aria-label={t('aria.closeSettings')}
              >
                <Settings2 size={16} />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <ConfigPanel config={config} onChange={updateConfig} onApplyPreset={applyPreset} />
            </div>
          </aside>
        )}
      </div>

      {!zen && (
        <StatusBar
          content={parsed.body}
          config={effectiveConfig}
          headingCount={headingCount}
          onOpenStats={() => setStatsOpen(true)}
        />
      )}

      {!zen && (
        <OnboardingChecklist
          state={onboarding}
          onDismiss={() => setOnboarding((prev) => ({ ...prev, dismissed: true }))}
          onOpenTemplates={() => setTemplatesOpen(true)}
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
            onClick={() => setZen(false)}
            aria-label={t('zen.exitAria')}
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Minimize2 size={14} /> {t('zen.exit')}
          </button>
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <DocumentsDialog
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        docs={library.docs}
        activeId={library.activeId}
        onSelect={library.selectDoc}
        onCreate={() => library.createDoc()}
        onDuplicate={library.duplicateDoc}
        onDelete={library.deleteDoc}
        onImport={library.importDocs}
        onNotify={(type, message) => (type === 'success' ? toast.success(message) : toast.error(message))}
      />
      <SecurityDialog open={securityOpen} onClose={() => setSecurityOpen(false)} lock={lock} />
      <StatsDialog open={statsOpen} onClose={() => setStatsOpen(false)} markdown={parsed.body} />
      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelect={handleTemplate}
      />
      <ThemeGalleryDialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        config={config}
        onApply={updateConfig}
        onApplyPreset={applyPreset}
      />
      <ResumeDetailsDialog
        open={pendingResume !== null}
        onClose={() => setPendingResume(null)}
        templateName={pendingResume?.name ?? ''}
        onFill={handleResumeFill}
        onSkip={handleResumeSkip}
      />
      <GithubDialog
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        onImport={(md, name) => library.createDoc(md, name)}
      />
      <AiDashboardDialog
        open={aiDashboardOpen}
        onClose={() => setAiDashboardOpen(false)}
        config={aiConfig}
        encryptedAtRest={lock.status !== 'open'}
        hasSelection={!!editorView && getSelectionText(editorView).trim().length > 0}
        onRun={handleAiAction}
        onEditSettings={() => {
          setAiDashboardOpen(false)
          setAiSettingsOpen(true)
        }}
        onRemoveKey={handleRemoveAiKey}
        onOpenSecurity={() => setSecurityOpen(true)}
      />
      <AiSettingsDialog
        open={aiSettingsOpen}
        onClose={() => setAiSettingsOpen(false)}
        config={aiConfig}
        onSave={setAiConfig}
      />
      <AiInputDialog
        open={aiInput !== null}
        request={aiInput?.request ?? null}
        onClose={() => setAiInput(null)}
        onSubmit={(value) => aiInput?.run(value)}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <FormattingHelpDialog open={formattingHelpOpen} onClose={() => setFormattingHelpOpen(false)} />
      {printOpen && (
        <Suspense fallback={null}>
          <PrintPreview
            open={printOpen}
            onClose={() => setPrintOpen(false)}
            getDocElement={getDoc}
            config={effectiveConfig}
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
