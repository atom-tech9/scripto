import { useMemo } from 'react'
import {
  BarChart3,
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
  Keyboard,
  KeyRound,
  Languages,
  LayoutTemplate,
  ListTree,
  Lock,
  Maximize2,
  Moon,
  Palette,
  Pencil,
  Printer,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import type { Command } from '@/components/layout/CommandPalette'
import type { AiToolbarAction } from '@/components/editor/EditorToolbar'
import type { DialogsApi } from '@/hooks/useDialogs'
import { DOCUMENT_PRESETS } from '@/data/presets'
import { useLanguage } from '@/i18n'
import type { ViewMode } from '@/types'

export interface UseCommandsOptions {
  /** Only the identity-stable halves of the dialogs API are used here, so the
   * command list never rebuilds just because an overlay opened or closed. */
  readonly openDialog: DialogsApi['opener']
  readonly toggleDialog: DialogsApi['toggler']
  /** Export / print. */
  readonly onExportPdf: () => void
  readonly onExportWord: () => void
  readonly onExportHtml: () => void
  readonly onExportMarkdown: () => void
  readonly onCopyHtml: () => void
  /** Edit. */
  readonly tocPresent: boolean
  readonly onToggleToc: () => void
  /** AI — routed through the single action dispatcher so every entry point
   * behaves (and reports) identically. */
  readonly onAi: (action: AiToolbarAction) => void
  /** File. */
  readonly onNewDocument: () => void
  readonly onImport: () => void
  readonly onLoadSample: () => void
  readonly onClear: () => void
  /** View. */
  readonly isSimple: boolean
  readonly onToggleSimpleMode: () => void
  readonly onViewMode: (mode: ViewMode) => void
  readonly onCycleTheme: () => void
  /** Security — a lock command is offered only while the vault is unlocked. */
  readonly canLock: boolean
  readonly onLockNow: () => void
  /** Document themes. */
  readonly onApplyPreset: (presetId: string) => void
}

/**
 * Builds the ⌘K command list from injected handlers. Pure composition — this
 * hook owns no state, so `App.tsx` no longer carries a 40-entry array inline.
 */
export function useCommands(options: UseCommandsOptions): Command[] {
  const { t } = useLanguage()
  const {
    openDialog,
    toggleDialog,
    onExportPdf,
    onExportWord,
    onExportHtml,
    onExportMarkdown,
    onCopyHtml,
    tocPresent,
    onToggleToc,
    onAi,
    onNewDocument,
    onImport,
    onLoadSample,
    onClear,
    isSimple,
    onToggleSimpleMode,
    onViewMode,
    onCycleTheme,
    canLock,
    onLockNow,
    onApplyPreset,
  } = options

  return useMemo<Command[]>(() => {
    const group = {
      export: t('group.export'),
      edit: t('group.edit'),
      ai: t('group.ai'),
      view: t('group.view'),
      file: t('group.file'),
      help: t('group.help'),
      documentTheme: t('group.documentTheme'),
    }

    return [
      {
        id: 'pdf',
        label: t('action.exportPdf'),
        group: group.export,
        icon: FileDown,
        run: onExportPdf,
        hint: '⌘S',
      },
      {
        id: 'print',
        label: t('action.printPreview'),
        group: group.export,
        icon: Printer,
        run: onExportPdf,
      },
      {
        id: 'word',
        label: t('action.exportWord'),
        group: group.export,
        icon: FileType2,
        run: onExportWord,
      },
      {
        id: 'html',
        label: t('action.exportHtml'),
        group: group.export,
        icon: FileCode2,
        run: onExportHtml,
      },
      {
        id: 'md',
        label: t('action.exportMarkdown'),
        group: group.export,
        icon: FileText,
        run: onExportMarkdown,
      },
      {
        id: 'copy-html',
        label: t('command.copyHtml'),
        group: group.export,
        icon: FileCode2,
        run: onCopyHtml,
      },
      {
        id: 'insert-toc',
        label: tocPresent ? t('command.removeToc') : t('command.insertToc'),
        group: group.edit,
        icon: ListTree,
        run: onToggleToc,
      },
      {
        id: 'ai-improve',
        label: t('command.aiImprove'),
        group: group.ai,
        icon: Sparkles,
        keywords: 'rewrite polish',
        run: () => onAi('improve'),
      },
      {
        id: 'ai-grammar',
        label: t('command.aiGrammar'),
        group: group.ai,
        icon: Sparkles,
        keywords: 'spelling proofread',
        run: () => onAi('grammar'),
      },
      {
        id: 'ai-concise',
        label: t('command.aiConcise'),
        group: group.ai,
        icon: Sparkles,
        keywords: 'shorten trim',
        run: () => onAi('concise'),
      },
      {
        id: 'ai-expand',
        label: t('command.aiExpand'),
        group: group.ai,
        icon: Sparkles,
        keywords: 'elaborate lengthen',
        run: () => onAi('expand'),
      },
      {
        id: 'ai-summarize',
        label: t('command.aiSummarize'),
        group: group.ai,
        icon: Sparkles,
        keywords: 'tldr summary',
        run: () => onAi('summarize'),
      },
      {
        id: 'ai-tone',
        label: t('command.aiTone'),
        group: group.ai,
        icon: Wand2,
        keywords: 'voice style',
        run: () => onAi('tone'),
      },
      {
        id: 'ai-translate',
        label: t('command.aiTranslate'),
        group: group.ai,
        icon: Languages,
        keywords: 'language localize',
        run: () => onAi('translate'),
      },
      {
        id: 'ai-generate',
        label: t('command.aiGenerate'),
        group: group.ai,
        icon: Wand2,
        keywords: 'write create',
        run: () => onAi('generate'),
      },
      {
        id: 'ai-settings',
        label: t('command.aiSettings'),
        group: group.ai,
        icon: KeyRound,
        keywords: 'api key openai anthropic',
        run: openDialog('aiSettings'),
      },
      {
        id: 'themes',
        label: t('action.themes'),
        group: group.view,
        icon: Palette,
        run: openDialog('gallery'),
      },
      {
        id: 'stats',
        label: t('command.stats'),
        group: group.view,
        icon: BarChart3,
        run: openDialog('stats'),
      },
      {
        id: 'docs',
        label: t('action.documents'),
        group: group.file,
        icon: FolderOpen,
        run: openDialog('docs'),
      },
      {
        id: 'new',
        label: t('action.newDocument'),
        group: group.file,
        icon: FilePlus,
        run: onNewDocument,
      },
      {
        id: 'import',
        label: t('command.importFile'),
        group: group.file,
        icon: Import,
        run: onImport,
        hint: '⌘O',
      },
      {
        id: 'github',
        label: t('action.importGithub'),
        group: group.file,
        icon: Github,
        run: openDialog('github'),
      },
      {
        id: 'templates',
        label: t('command.browseTemplates'),
        group: group.file,
        icon: LayoutTemplate,
        run: openDialog('templates'),
      },
      {
        id: 'sample',
        label: t('command.loadSample'),
        group: group.file,
        icon: FileText,
        run: onLoadSample,
      },
      { id: 'clear', label: t('action.clear'), group: group.file, icon: Trash2, run: onClear },
      {
        id: 'simple-mode',
        label: isSimple ? t('mode.toStandard') : t('mode.toSimple'),
        group: group.view,
        icon: GraduationCap,
        keywords: 'beginner easy simple guided',
        run: onToggleSimpleMode,
      },
      {
        id: 'zen',
        label: t('command.toggleFocus'),
        group: group.view,
        icon: Maximize2,
        run: toggleDialog('zen'),
      },
      {
        id: 'settings',
        label: t('command.toggleSettings'),
        group: group.view,
        icon: Settings2,
        run: toggleDialog('config'),
      },
      {
        id: 'outline',
        label: t('command.toggleOutline'),
        group: group.view,
        icon: LayoutTemplate,
        run: toggleDialog('outline'),
      },
      {
        id: 'editor',
        label: t('view.editor'),
        group: group.view,
        icon: Pencil,
        run: () => onViewMode('editor'),
      },
      {
        id: 'split',
        label: t('view.split'),
        group: group.view,
        icon: LayoutTemplate,
        run: () => onViewMode('split'),
      },
      {
        id: 'preview-view',
        label: t('view.preview'),
        group: group.view,
        icon: Eye,
        run: () => onViewMode('preview'),
      },
      {
        id: 'theme',
        label: t('command.cycleTheme'),
        group: group.view,
        icon: Moon,
        run: onCycleTheme,
      },
      {
        id: 'security',
        label: t('action.security'),
        group: group.view,
        icon: ShieldCheck,
        run: openDialog('security'),
      },
      ...(canLock
        ? [
            {
              id: 'lock',
              label: t('command.lockNow'),
              group: group.view,
              icon: Lock,
              run: onLockNow,
            },
          ]
        : []),
      {
        id: 'formatting-help',
        label: t('action.formattingHelp'),
        group: group.help,
        icon: BookOpen,
        keywords: 'markdown syntax cheatsheet guide how',
        run: openDialog('formattingHelp'),
      },
      {
        id: 'shortcuts',
        label: t('action.shortcuts'),
        group: group.help,
        icon: Keyboard,
        run: openDialog('shortcuts'),
        hint: '⌘/',
      },
      ...DOCUMENT_PRESETS.map((p) => ({
        id: `preset-${p.id}`,
        label: `${t('command.themePrefix')} ${t(p.nameKey)}`,
        group: group.documentTheme,
        icon: FileText,
        keywords: t(p.descKey),
        run: () => onApplyPreset(p.id),
      })),
    ]
  }, [
    t,
    openDialog,
    toggleDialog,
    onExportPdf,
    onExportWord,
    onExportHtml,
    onExportMarkdown,
    onCopyHtml,
    tocPresent,
    onToggleToc,
    onAi,
    onNewDocument,
    onImport,
    onLoadSample,
    onClear,
    isSimple,
    onToggleSimpleMode,
    onViewMode,
    onCycleTheme,
    canLock,
    onLockNow,
    onApplyPreset,
  ])
}
