/**
 * Markdown mutations behind the visual page-break editor.
 *
 * The rendered DOM is never the source of truth: every edit made in the
 * paginated preview is expressed here as a change to the Markdown, so undo,
 * scroll sync and the export all keep working unchanged.
 *
 * The directives themselves already exist — see `remarkPageDirectives`:
 *   `::page-break`            start the next block on a fresh page
 *   `:::keep-together … :::`  never split this run across a page boundary
 *   `:::landscape … :::`      put this run on its own rotated page
 */

export const PAGE_BREAK_DIRECTIVE = '::page-break'
const KEEP_TOGETHER_OPEN = ':::keep-together'
const LANDSCAPE_OPEN = ':::landscape'
const CONTAINER_CLOSE = ':::'

const isBlank = (line: string | undefined): boolean => line === undefined || line.trim() === ''

/** Clamp a 1-based line number to a valid insertion index in `lines`. */
function insertionIndex(lines: readonly string[], line: number): number {
  return Math.min(lines.length, Math.max(0, Math.round(line) - 1))
}

/**
 * Insert a page break so the block containing `line` (1-based, whole document)
 * begins a new page.
 *
 * The insertion point is always snapped back to a block boundary: breaking
 * inside a paragraph would silently split it in two, and the author asked to
 * move a block, not to reflow their prose. That also makes the edit exactly
 * two lines, which `removePageBreak` removes exactly — so insert→remove
 * restores the document byte for byte.
 */
export function insertPageBreak(markdown: string, line: number): string {
  const lines = markdown.split('\n')
  let index = insertionIndex(lines, line)
  while (index > 0 && !isBlank(lines[index - 1])) index -= 1
  return [...lines.slice(0, index), PAGE_BREAK_DIRECTIVE, '', ...lines.slice(index)].join('\n')
}

/**
 * Remove the page break on `line` (1-based). The blank line the insert added is
 * removed with it; a blank line left doubled up in front is collapsed, so a
 * break inserted anywhere can be taken back out cleanly.
 */
export function removePageBreak(markdown: string, line: number): string {
  const lines = markdown.split('\n')
  const index = insertionIndex(lines, line)
  if (lines[index]?.trim() !== PAGE_BREAK_DIRECTIVE) return markdown

  const next = [...lines.slice(0, index), ...lines.slice(index + 1)]
  if (isBlank(next[index]) && (index === 0 || isBlank(next[index - 1]))) next.splice(index, 1)
  return next.join('\n')
}

/** Every 1-based line holding a `::page-break` directive. */
export function findPageBreaks(markdown: string): number[] {
  const found: number[] = []
  markdown.split('\n').forEach((line, index) => {
    if (line.trim() === PAGE_BREAK_DIRECTIVE) found.push(index + 1)
  })
  return found
}

function wrapLines(markdown: string, from: number, to: number, open: string): string {
  const lines = markdown.split('\n')
  const start = Math.min(Math.max(0, Math.round(from) - 1), lines.length - 1)
  const end = Math.min(Math.max(start, Math.round(to) - 1), lines.length - 1)
  if (lines.length === 0) return markdown

  // Take the whole block: run to the end of the paragraph the selection ends in.
  let last = end
  while (last + 1 < lines.length && !isBlank(lines[last + 1])) last += 1

  const before = lines.slice(0, start)
  const body = lines.slice(start, last + 1)
  const after = lines.slice(last + 1)

  const head = before.length > 0 && !isBlank(before[before.length - 1]) ? ['', open] : [open]
  const tail = after.length > 0 && !isBlank(after[0]) ? [CONTAINER_CLOSE, ''] : [CONTAINER_CLOSE]

  return [...before, ...head, ...body, ...tail, ...after].join('\n')
}

/** Wrap the run of lines `from`…`to` (1-based) so it never splits across pages. */
export function wrapKeepTogether(markdown: string, from: number, to: number): string {
  return wrapLines(markdown, from, to, KEEP_TOGETHER_OPEN)
}

/** Wrap the run of lines `from`…`to` (1-based) onto its own landscape page. */
export function wrapLandscape(markdown: string, from: number, to: number): string {
  return wrapLines(markdown, from, to, LANDSCAPE_OPEN)
}

/**
 * Translate a body-relative source line (what the rendered DOM carries) into a
 * whole-document line, accounting for front-matter — the same offset
 * `useScrollSync` applies.
 */
export function toDocumentLine(bodyLine: number, bodyLineOffset: number): number {
  return bodyLine + bodyLineOffset
}
