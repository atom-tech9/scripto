import type { EditorView } from '@codemirror/view'

/**
 * Imperative Markdown editing commands that operate on a CodeMirror EditorView.
 * Each command produces a single, undoable transaction.
 */

function getSelection(view: EditorView): { from: number; to: number; text: string } {
  const { from, to } = view.state.selection.main
  return { from, to, text: view.state.sliceDoc(from, to) }
}

/** Wrap (or unwrap) the current selection with the given markers. */
export function wrapSelection(view: EditorView, before: string, after = before, placeholder = ''): void {
  const { from, to, text } = getSelection(view)
  const content = text || placeholder
  const already = text.startsWith(before) && text.endsWith(after) && text.length >= before.length + after.length
  const replacement = already ? text.slice(before.length, text.length - after.length) : `${before}${content}${after}`

  const cursorFrom = already ? from : from + before.length
  const cursorTo = already ? to - before.length - after.length : from + before.length + content.length

  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: cursorFrom, head: cursorTo },
  })
  view.focus()
}

/** Toggle a line-level prefix (e.g. "# ", "> ", "- ") on every selected line. */
export function toggleLinePrefix(view: EditorView, prefix: string): void {
  const { state } = view
  const range = state.selection.main
  const startLine = state.doc.lineAt(range.from)
  const endLine = state.doc.lineAt(range.to)

  const changes = []
  for (let n = startLine.number; n <= endLine.number; n += 1) {
    const line = state.doc.line(n)
    if (line.text.startsWith(prefix)) {
      changes.push({ from: line.from, to: line.from + prefix.length, insert: '' })
    } else {
      changes.push({ from: line.from, insert: prefix })
    }
  }
  view.dispatch({ changes })
  view.focus()
}

/** Insert a link, using the selection as the link text when present. */
export function insertLink(view: EditorView): void {
  const { from, to, text } = getSelection(view)
  const label = text || 'link text'
  const insert = `[${label}](https://)`
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + label.length + 3, head: from + label.length + 11 },
  })
  view.focus()
}

/** Read the currently selected text (empty string when nothing is selected). */
export function getSelectionText(view: EditorView): string {
  return getSelection(view).text
}

/**
 * Resolve a target range for an action: the current selection when there is one,
 * otherwise the paragraph (contiguous non-blank lines) around the cursor. Returns
 * null only when there is genuinely nothing to act on (empty/blank document).
 */
export function selectionOrParagraph(
  view: EditorView,
): { from: number; to: number; text: string } | null {
  const selection = getSelection(view)
  if (selection.text.trim()) return selection

  const { state } = view
  const cursorLine = state.doc.lineAt(state.selection.main.head)

  let start = cursorLine
  // If the cursor sits on a blank line, look for the nearest non-blank line below.
  if (start.text.trim() === '') {
    let probe = cursorLine
    while (probe.number < state.doc.lines && probe.text.trim() === '') {
      probe = state.doc.line(probe.number + 1)
    }
    if (probe.text.trim() === '') return null
    start = probe
  }

  while (start.number > 1 && state.doc.line(start.number - 1).text.trim() !== '') {
    start = state.doc.line(start.number - 1)
  }
  let end = start
  while (end.number < state.doc.lines && state.doc.line(end.number + 1).text.trim() !== '') {
    end = state.doc.line(end.number + 1)
  }

  const text = state.sliceDoc(start.from, end.to)
  return text.trim() ? { from: start.from, to: end.to, text } : null
}

/** Insert arbitrary text at the cursor, replacing any selection. */
export function insertText(view: EditorView, text: string, cursorOffset?: number): void {
  const { from, to } = getSelection(view)
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + (cursorOffset ?? text.length) },
  })
  view.focus()
}

export function insertTable(view: EditorView): void {
  const table = '\n| Column A | Column B | Column C |\n| :------- | :------: | -------: |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n'
  insertText(view, table)
}
