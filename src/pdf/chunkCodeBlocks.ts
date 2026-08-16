import { resolvePageDimensions } from '@/lib/constants'
import type { PdfConfig } from '@/types'

/**
 * Paged.js cannot reliably fragment a code block: breaking inside `pre > code`
 * blanks the line that straddles the page edge. So the export never asks it to.
 * A long block is cut into consecutive atomic blocks here instead, and Paged.js
 * only ever has to place whole ones — the case it handles correctly.
 *
 * The pieces are styled to butt together seamlessly (see the `data-code-chunk`
 * rules in document.css), so a chunked block still reads as one listing.
 */

/** Blocks shorter than this stay whole — they fit a page on their own. */
const MIN_ROWS_TO_CHUNK = 20
/** Target rows per piece. Sets the worst-case slack left at a page bottom. */
const ROWS_PER_CHUNK = 10

/** Monospace advance as a fraction of the font size, matching the ASCII diagram
 * sizing in pageStyles.ts. */
const CHAR_ADVANCE = 0.6
/** `pre` renders at 0.82em (document.css). */
const CODE_SCALE = 0.82
/** Line-number gutter plus the trailing padding, in code-font ems. */
const GUTTER_EMS = 4.7

const PT_TO_MM = 25.4 / 72

/** How many characters of code fit on one row of the configured page. */
function charsPerRow(config: PdfConfig): number {
  const { width } = resolvePageDimensions(config)
  const contentMm = width - config.margins.left - config.margins.right
  const codePt = config.fontSize * CODE_SCALE
  const charMm = codePt * CHAR_ADVANCE * PT_TO_MM
  const usableMm = contentMm - codePt * GUTTER_EMS * PT_TO_MM
  return Math.max(20, Math.floor(usableMm / charMm))
}

function rowsFor(line: Element, perRow: number): number {
  return Math.max(1, Math.ceil((line.textContent ?? '').replace(/\n$/, '').length / perRow))
}

/** Partition lines into groups of roughly ROWS_PER_CHUNK rendered rows. */
function groupLines(lines: readonly Element[], perRow: number): Element[][] {
  const groups: Element[][] = []
  let current: Element[] = []
  let rows = 0

  for (const line of lines) {
    const lineRows = rowsFor(line, perRow)
    if (current.length > 0 && rows + lineRows > ROWS_PER_CHUNK) {
      groups.push(current)
      current = []
      rows = 0
    }
    current.push(line)
    rows += lineRows
  }
  if (current.length > 0) groups.push(current)
  return groups
}

function buildChunk(block: HTMLElement, pre: HTMLElement, code: HTMLElement): HTMLElement {
  const chunk = block.cloneNode(false) as HTMLElement
  const newPre = pre.cloneNode(false) as HTMLElement
  const newCode = code.cloneNode(false) as HTMLElement
  newPre.appendChild(newCode)
  chunk.appendChild(newPre)
  return chunk
}

function splitBlock(block: HTMLElement, perRow: number): void {
  const pre = block.querySelector('pre')
  const code = pre?.querySelector('code')
  if (!pre || !code) return

  const lines = Array.from(code.children).filter((el) => el.classList.contains('code-line'))
  if (lines.length === 0) return

  const totalRows = lines.reduce((sum, line) => sum + rowsFor(line, perRow), 0)
  if (totalRows <= MIN_ROWS_TO_CHUNK) return

  const groups = groupLines(lines, perRow)
  if (groups.length < 2) return

  const parent = block.parentNode
  if (!parent) return

  const header = block.querySelector('.code-block__header')
  const fragment = block.ownerDocument.createDocumentFragment()

  groups.forEach((group, index) => {
    const chunk = buildChunk(block, pre, code)
    const isFirst = index === 0
    const isLast = index === groups.length - 1
    chunk.dataset.codeChunk = isFirst ? 'first' : isLast ? 'last' : 'middle'
    // The language label belongs to the listing, not to each piece of it.
    if (isFirst && header) chunk.insertBefore(header, chunk.firstChild)
    group.forEach((line) => chunk.querySelector('code')?.appendChild(line))
    fragment.appendChild(chunk)
  })

  parent.replaceChild(fragment, block)
}

/** Cut every over-long code block in `root` into page-friendly pieces. */
export function chunkCodeBlocks(root: HTMLElement, config: PdfConfig): void {
  const perRow = charsPerRow(config)
  root.querySelectorAll<HTMLElement>('.code-block').forEach((block) => {
    splitBlock(block, perRow)
  })
}
