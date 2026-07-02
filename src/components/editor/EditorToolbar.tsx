import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Info,
  Italic,
  Languages,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  ListTree,
  Minus,
  Quote,
  Redo2,
  Sigma,
  Sparkles,
  SquareCode,
  Strikethrough,
  Subscript,
  Superscript,
  Table as TableIcon,
  Undo2,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import { redo, undo } from '@codemirror/commands'
import type { EditorView } from '@codemirror/view'
import { useLanguage } from '@/i18n'
import { useMode } from '@/mode'
import type { TranslationKey } from '@/lib/i18n'
import { Tooltip } from '@/components/ui/Tooltip'
import { Menu, MenuItem } from '@/components/ui/Menu'
import {
  insertLink,
  insertTable,
  insertText,
  toggleLinePrefix,
  wrapSelection,
} from './editorCommands'

export type AiToolbarAction =
  | 'improve'
  | 'grammar'
  | 'concise'
  | 'expand'
  | 'summarize'
  | 'tone'
  | 'translate'
  | 'generate'
  | 'settings'

interface EditorToolbarProps {
  view: EditorView | null
  /** Whether a generated table of contents is currently in the document. */
  tocPresent: boolean
  /** Insert the table of contents, or remove it when one is already present. */
  onToggleToc: () => void
  onAi: (action: AiToolbarAction) => void
}

interface ToolAction {
  icon: LucideIcon
  labelKey: TranslationKey
  /** Keyboard shortcut shown after the label; symbols are locale-agnostic. */
  shortcut?: string
  /** Hidden on the smallest screens (still reachable via the slash menu). */
  secondary?: boolean
  run: (view: EditorView) => void
}

export function EditorToolbar({ view, tocPresent, onToggleToc, onAi }: EditorToolbarProps) {
  const { t } = useLanguage()
  const { isSimple } = useMode()

  // Simple mode makes the formatting controls slightly larger for beginners.
  const btnSize = isSimple ? 'h-9 w-9' : 'h-8 w-8'
  const iconSize = isSimple ? 18 : 16

  const labelOf = (action: ToolAction): string =>
    action.shortcut ? `${t(action.labelKey)}  (${action.shortcut})` : t(action.labelKey)

  const groups: ToolAction[][] = [
    [
      { icon: Undo2, labelKey: 'editor.tooltip.undo', shortcut: '⌘Z', run: (v) => void undo(v) },
      { icon: Redo2, labelKey: 'editor.tooltip.redo', shortcut: '⌘⇧Z', run: (v) => void redo(v) },
    ],
    [
      { icon: Heading1, labelKey: 'editor.tooltip.heading1', run: (v) => toggleLinePrefix(v, '# ') },
      { icon: Heading2, labelKey: 'editor.tooltip.heading2', run: (v) => toggleLinePrefix(v, '## ') },
      { icon: Heading3, labelKey: 'editor.tooltip.heading3', run: (v) => toggleLinePrefix(v, '### ') },
    ],
    [
      { icon: Bold, labelKey: 'editor.tooltip.bold', shortcut: '⌘B', run: (v) => wrapSelection(v, '**', '**', 'bold text') },
      { icon: Italic, labelKey: 'editor.tooltip.italic', shortcut: '⌘I', run: (v) => wrapSelection(v, '*', '*', 'italic text') },
      {
        icon: Strikethrough,
        labelKey: 'editor.tooltip.strikethrough',
        shortcut: '⌘⇧X',
        secondary: true,
        run: (v) => wrapSelection(v, '~~', '~~', 'strikethrough'),
      },
      { icon: Highlighter, labelKey: 'editor.tooltip.highlight', secondary: true, run: (v) => wrapSelection(v, '==', '==', 'highlight') },
      { icon: Code, labelKey: 'editor.tooltip.inlineCode', shortcut: '⌘E', run: (v) => wrapSelection(v, '`', '`', 'code') },
      { icon: Superscript, labelKey: 'editor.tooltip.superscript', secondary: true, run: (v) => wrapSelection(v, '^', '^', 'sup') },
      { icon: Subscript, labelKey: 'editor.tooltip.subscript', secondary: true, run: (v) => wrapSelection(v, '~', '~', 'sub') },
    ],
    [
      { icon: List, labelKey: 'editor.tooltip.bulletList', shortcut: '⌘⇧8', run: (v) => toggleLinePrefix(v, '- ') },
      { icon: ListOrdered, labelKey: 'editor.tooltip.numberedList', shortcut: '⌘⇧7', run: (v) => toggleLinePrefix(v, '1. ') },
      { icon: ListChecks, labelKey: 'editor.tooltip.taskList', run: (v) => toggleLinePrefix(v, '- [ ] ') },
      { icon: Quote, labelKey: 'editor.tooltip.blockquote', shortcut: '⌘⇧.', run: (v) => toggleLinePrefix(v, '> ') },
      {
        icon: Info,
        labelKey: 'editor.tooltip.callout',
        secondary: true,
        run: (v) => insertText(v, '\n:::tip\nYour note here.\n:::\n'),
      },
    ],
    [
      { icon: LinkIcon, labelKey: 'editor.tooltip.link', shortcut: '⌘K', run: (v) => insertLink(v) },
      { icon: ImageIcon, labelKey: 'editor.tooltip.image', run: (v) => insertText(v, '![alt text](https://)') },
      { icon: TableIcon, labelKey: 'editor.tooltip.table', run: (v) => insertTable(v) },
      {
        icon: SquareCode,
        labelKey: 'editor.tooltip.codeBlock',
        run: (v) => insertText(v, '\n```js\n\n```\n', 8),
      },
      { icon: Sigma, labelKey: 'editor.tooltip.mathBlock', secondary: true, run: (v) => insertText(v, '\n$$\n\\frac{a}{b}\n$$\n') },
      { icon: Minus, labelKey: 'editor.tooltip.divider', secondary: true, run: (v) => insertText(v, '\n---\n') },
    ],
  ]

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface/60 px-2 py-1.5">
      {groups.map((group, gi) => (
        <span key={gi} className="flex items-center">
          {gi > 0 && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
          {group.map((action) => {
            const { icon: Icon, run } = action
            const label = labelOf(action)
            return (
            <Tooltip key={action.labelKey} label={label}>
              <button
                type="button"
                aria-label={label}
                disabled={!view}
                onClick={() => view && run(view)}
                className={`${action.secondary ? 'hidden sm:flex' : 'flex'} ${btnSize} items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40`}
              >
                <Icon size={iconSize} />
              </button>
            </Tooltip>
            )
          })}
        </span>
      ))}
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <Tooltip label={tocPresent ? t('editor.tooltip.tocRemove') : t('editor.tooltip.toc')}>
        <button
          type="button"
          aria-label={tocPresent ? t('editor.tooltip.tocRemove') : t('editor.tooltip.toc')}
          aria-pressed={tocPresent}
          disabled={!view}
          onClick={onToggleToc}
          className={`flex ${btnSize} items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-40 ${
            tocPresent ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ListTree size={iconSize} />
        </button>
      </Tooltip>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <Menu
        trigger={({ toggle }) => (
          <Tooltip label={t('editor.tooltip.aiActions')}>
            <button
              type="button"
              aria-label={t('editor.tooltip.aiActions')}
              onClick={toggle}
              className="flex h-8 items-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Sparkles size={16} />
              <span className="hidden text-xs font-medium sm:inline">{t('editor.ai.badge')}</span>
            </button>
          </Tooltip>
        )}
      >
        {(close) => {
          const act = (action: AiToolbarAction) => {
            close()
            onAi(action)
          }
          return (
            <>
              <MenuItem icon={<Sparkles size={16} />} onClick={() => act('improve')}>
                {t('editor.ai.improve')}
              </MenuItem>
              <MenuItem icon={<Sparkles size={16} />} onClick={() => act('grammar')}>
                {t('editor.ai.grammar')}
              </MenuItem>
              <MenuItem icon={<Sparkles size={16} />} onClick={() => act('concise')}>
                {t('editor.ai.concise')}
              </MenuItem>
              <MenuItem icon={<Sparkles size={16} />} onClick={() => act('expand')}>
                {t('editor.ai.expand')}
              </MenuItem>
              <MenuItem icon={<Sparkles size={16} />} onClick={() => act('summarize')}>
                {t('editor.ai.summarize')}
              </MenuItem>
              <div className="my-1 h-px bg-border" />
              <MenuItem icon={<Wand2 size={16} />} onClick={() => act('tone')}>
                {t('editor.ai.tone')}
              </MenuItem>
              <MenuItem icon={<Languages size={16} />} onClick={() => act('translate')}>
                {t('editor.ai.translate')}
              </MenuItem>
              <MenuItem icon={<Wand2 size={16} />} onClick={() => act('generate')}>
                {t('editor.ai.generate')}
              </MenuItem>
              <div className="my-1 h-px bg-border" />
              <MenuItem icon={<Sparkles size={16} />} onClick={() => act('settings')}>
                {t('editor.ai.settings')}
              </MenuItem>
            </>
          )
        }}
      </Menu>
    </div>
  )
}
