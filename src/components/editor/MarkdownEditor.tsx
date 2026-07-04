import { useCallback, useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'
import type { ResolvedTheme, TextDirection } from '@/types'
import { useLanguage } from '@/i18n'
import { compressImage } from '@/lib/image'
import { htmlToMarkdown } from '@/io/importers'
import { getErrorMessage, logger } from '@/lib/logger'
import { collapseImages } from './collapseImages'
import { slashCommands } from './slashCommands'
import { ghostCompletion, type GhostComplete } from './ghostCompletion'
import { insertLink, toggleLinePrefix, wrapSelection } from './editorCommands'
import type { AiToolbarAction } from './EditorToolbar'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  resolvedTheme: ResolvedTheme
  onReady?: (view: EditorView) => void
  wordWrap?: boolean
  direction?: TextDirection
  onScrollFraction?: (fraction: number) => void
  /** Fires on any selection / geometry / scroll change so overlays can reposition. */
  onActivity?: () => void
  /** Enables the `/` slash menu, routing AI items to this handler. */
  slashAi?: (action: AiToolbarAction) => void
  /** Opens the formatting guide from the slash menu's "Formatting help" item. */
  onSlashHelp?: () => void
  /** Fires after rich clipboard HTML is auto-converted and inserted as Markdown. */
  onPastedAsMarkdown?: () => void
  /** Enables inline ghost-text autocomplete, fetching continuations from here. */
  ghostComplete?: GhostComplete
  onError?: (message: string) => void
}

/** Module-level so its identity never changes: `useCodeMirror` reconfigures
 * the editor whenever `basicSetup` (by reference), `onChange` or `extensions`
 * change — and reconfiguring destroys the runtime-attached ⌘F search panel. */
const BASIC_SETUP = {
  lineNumbers: true,
  highlightActiveLine: true,
  highlightActiveLineGutter: true,
  foldGutter: false,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: false,
  highlightSelectionMatches: true,
  searchKeymap: true,
} as const

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'))
}

/** Tags that mark genuinely rich clipboard content; bare wrappers are ignored so plain-text pastes fall through. */
const RICH_HTML_SELECTOR =
  'a[href],strong,b,em,i,u,s,del,mark,h1,h2,h3,h4,h5,h6,ul,ol,li,table,thead,tbody,tr,td,th,blockquote,pre,code,img,hr'

function hasRichHtml(html: string): boolean {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.querySelector(RICH_HTML_SELECTOR) !== null
  } catch {
    return false
  }
}

/** Embed dropped/pasted images inline as base64 data URLs so they always
 * render and export — no external hosting required. */
async function embedImages(
  view: EditorView,
  files: File[],
  pos: number,
  onError?: (message: string) => void,
): Promise<void> {
  try {
    let insertAt = pos
    for (const file of files) {
      const dataUrl = await compressImage(file)
      const alt = file.name.replace(/\.[^.]+$/, '')
      const snippet = `\n![${alt}](${dataUrl})\n`
      view.dispatch({
        changes: { from: insertAt, insert: snippet },
        selection: { anchor: insertAt + snippet.length },
      })
      insertAt += snippet.length
    }
    view.focus()
  } catch (error) {
    logger.error('Image embed failed', error)
    onError?.(getErrorMessage(error))
  }
}

/**
 * The Markdown source editor built on CodeMirror 6: syntax highlighting,
 * line numbers, word wrap, undo/redo, search (⌘F), bracket matching, and
 * Markdown-specific formatting shortcuts.
 *
 * IMPORTANT: reconfiguring CodeMirror destroys dynamically-appended
 * extensions — most visibly the ⌘F search panel, which @codemirror/search
 * attaches at runtime. So the `extensions` array below must NOT rebuild just
 * because a parent re-rendered: every callback prop is read through a ref,
 * and the memo depends only on genuine configuration (wrap, direction,
 * feature availability, language).
 */
export function MarkdownEditor({
  value,
  onChange,
  resolvedTheme,
  onReady,
  wordWrap = true,
  direction = 'auto',
  onScrollFraction,
  onActivity,
  slashAi,
  onSlashHelp,
  onPastedAsMarkdown,
  ghostComplete,
  onError,
}: MarkdownEditorProps) {
  const { t } = useLanguage()

  // Latest callbacks, readable from stable closures without reconfiguring.
  const callbacks = useRef({
    onChange,
    onReady,
    onScrollFraction,
    onActivity,
    slashAi,
    onSlashHelp,
    onPastedAsMarkdown,
    ghostComplete,
    onError,
  })
  callbacks.current = {
    onChange,
    onReady,
    onScrollFraction,
    onActivity,
    slashAi,
    onSlashHelp,
    onPastedAsMarkdown,
    ghostComplete,
    onError,
  }

  const handleChange = useCallback((next: string) => callbacks.current.onChange(next), [])
  const handleCreateEditor = useCallback((view: EditorView) => callbacks.current.onReady?.(view), [])

  // Presence (not identity) of optional features is real configuration.
  const hasSlashAi = Boolean(slashAi)
  const hasGhostComplete = Boolean(ghostComplete)

  const formattingKeymap = useMemo(
    () =>
      Prec.high(
        keymap.of([
          { key: 'Mod-b', run: (v) => (wrapSelection(v, '**', '**', 'bold text'), true) },
          { key: 'Mod-i', run: (v) => (wrapSelection(v, '*', '*', 'italic text'), true) },
          { key: 'Mod-e', run: (v) => (wrapSelection(v, '`', '`', 'code'), true) },
          {
            key: 'Mod-Shift-x',
            run: (v) => (wrapSelection(v, '~~', '~~', 'strikethrough'), true),
          },
          { key: 'Mod-k', run: (v) => (insertLink(v), true) },
          { key: 'Mod-Shift-7', run: (v) => (toggleLinePrefix(v, '1. '), true) },
          { key: 'Mod-Shift-8', run: (v) => (toggleLinePrefix(v, '- '), true) },
          { key: 'Mod-Shift-.', run: (v) => (toggleLinePrefix(v, '> '), true) },
        ]),
      ),
    [],
  )

  const extensions = useMemo(() => {
    const base = [
      markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
      formattingKeymap,
      collapseImages,
      EditorView.theme({
        '&': { backgroundColor: 'transparent' },
        '.cm-content': { padding: '1.25rem 0' },
        '.cm-line': { padding: '0 1.25rem' },
        '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
      }),
    ]
    if (wordWrap) base.push(EditorView.lineWrapping)
    base.push(EditorView.contentAttributes.of({ dir: direction }))
    if (hasSlashAi) {
      base.push(
        slashCommands(
          {
            onAi: (action) => callbacks.current.slashAi?.(action),
            onHelp: () => callbacks.current.onSlashHelp?.(),
          },
          t,
        ),
      )
    }
    if (hasGhostComplete) {
      base.push(
        ghostCompletion((prefix, signal) =>
          callbacks.current.ghostComplete
            ? callbacks.current.ghostComplete(prefix, signal)
            : Promise.resolve(''),
        ),
      )
    }

    base.push(
      EditorView.updateListener.of((update) => {
        if (
          update.selectionSet ||
          update.docChanged ||
          update.geometryChanged ||
          update.focusChanged
        ) {
          callbacks.current.onActivity?.()
        }
      }),
    )

    base.push(
      EditorView.domEventHandlers({
        scroll: (_event, view) => {
          callbacks.current.onActivity?.()
          const notify = callbacks.current.onScrollFraction
          if (!notify) return
          const el = view.scrollDOM
          const max = el.scrollHeight - el.clientHeight
          notify(max > 0 ? el.scrollTop / max : 0)
        },
        paste: (event, view) => {
          const files = imageFiles(event.clipboardData?.files)
          if (files.length > 0) {
            event.preventDefault()
            void embedImages(view, files, view.state.selection.main.from, (message) =>
              callbacks.current.onError?.(message),
            )
            return true
          }
          // Rich content (Word, Docs, web) → convert the HTML clipboard to Markdown; plain text falls through.
          const html = event.clipboardData?.getData('text/html')?.trim()
          if (!html || !hasRichHtml(html)) return false
          const md = htmlToMarkdown(html)
          if (!md) return false
          event.preventDefault()
          const { from, to } = view.state.selection.main
          view.dispatch({
            changes: { from, to, insert: md },
            selection: { anchor: from + md.length },
          })
          view.focus()
          callbacks.current.onPastedAsMarkdown?.()
          return true
        },
        drop: (event, view) => {
          const files = imageFiles(event.dataTransfer?.files)
          if (files.length === 0) return false
          event.preventDefault()
          const pos =
            view.posAtCoords({ x: event.clientX, y: event.clientY }) ??
            view.state.selection.main.from
          void embedImages(view, files, pos, (message) => callbacks.current.onError?.(message))
          return true
        },
      }),
    )
    return base
  }, [formattingKeymap, wordWrap, direction, hasSlashAi, hasGhostComplete, t])

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      onCreateEditor={handleCreateEditor}
      extensions={extensions}
      theme={resolvedTheme === 'dark' ? githubDark : githubLight}
      basicSetup={BASIC_SETUP}
      className="h-full"
      height="100%"
      placeholder={t('editor.placeholder')}
    />
  )
}
