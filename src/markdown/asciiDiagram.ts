/**
 * Detection and measurement for ASCII / box-drawing diagrams in fenced code
 * blocks. Pure, single-pass functions — they run on every untagged block per
 * (debounced) render, and are unit-tested in tests/asciiDiagram.test.ts.
 */

/** Fence languages that explicitly mark a block as an ASCII diagram. */
export const ASCII_DIAGRAM_LANGUAGES: ReadonlySet<string> = new Set([
  'ascii',
  'diagram',
  'ascii-art',
])

/** Fence languages that force plain rendering — never a diagram, never highlighted. */
export const PLAIN_TEXT_LANGUAGES: ReadonlySet<string> = new Set(['text', 'txt', 'plain'])

// Strong signals: box drawing U+2500–257F, block elements/shades U+2580–259F,
// arrows U+2190–21FF, geometric shapes (▲ ▼ ◄ ►, …) U+25A0–25FF.
const STRONG_CHARS = /[\u2190-\u21ff\u2500-\u259f\u25a0-\u25ff]/g

// Classic ASCII corners: a `+` joined to a dash run reads as a box edge.
const CORNER_RUNS = /\+--|--\+/g

// `<->` and `-->` before their two-char substrings so each arrow counts once.
const ARROW_TOKENS = /<->|<=>|-->|==>|->|=>|<-/g

// A line made only of connector ink (`  |  `, `+----+----+`, `v   v`).
const CONNECTOR_LINE = /^[-+|=<>^v\s]+$/
const CONNECTOR_INK = /[-+|]/

const MIN_SCORE = 8
const MIN_SCORING_LINES = 2

function countMatches(line: string, pattern: RegExp): number {
  pattern.lastIndex = 0
  let count = 0
  while (pattern.exec(line) !== null) count += 1
  return count
}

/**
 * Heuristic for untagged fenced blocks: does this text look like an ASCII
 * diagram? Unicode diagram characters score directly; the classic `+-|`/arrow
 * set only counts when used structurally, so code with `=>` arrows, YAML,
 * diffs, and Markdown tables stay ordinary code blocks.
 */
export function isAsciiDiagram(raw: string): boolean {
  const lines = raw.replace(/\n+$/, '').split('\n')
  if (lines.length < MIN_SCORING_LINES) return false

  let score = 0
  let arrowCount = 0
  let structural = false
  let scoringLines = 0

  for (const line of lines) {
    const strong = countMatches(line, STRONG_CHARS)
    const corners = countMatches(line, CORNER_RUNS)
    const trimmed = line.trim()
    const isConnector =
      trimmed.length > 0 && CONNECTOR_LINE.test(trimmed) && CONNECTOR_INK.test(trimmed)

    const linePoints = strong + corners * 2 + (isConnector ? 2 : 0)
    if (linePoints > 0) structural = true

    const arrows = countMatches(line, ARROW_TOKENS)
    arrowCount += arrows

    if (linePoints > 0 || arrows > 0) scoringLines += 1
    score += linePoints
  }

  // Arrow tokens alone are everyday code (`=>`, `->`); they only add evidence
  // once some box/connector structure exists.
  if (structural) score += arrowCount

  return score >= MIN_SCORE && scoringLines >= MIN_SCORING_LINES
}

/**
 * Visual width of a code point in monospace columns: 2 for East Asian
 * Wide/Fullwidth and emoji, 0 for joiners/variation selectors/combining marks,
 * else 1. Compact by design — enough for diagram fit math, not a full UAX #11
 * implementation.
 */
export function codePointWidth(cp: number): number {
  if (cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0xfe0f) return 0
  if (cp >= 0x0300 && cp <= 0x036f) return 0
  if (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    (cp >= 0x2e80 && cp <= 0x303e) || // CJK radicals … punctuation
    (cp >= 0x3041 && cp <= 0x33ff) || // kana … CJK compatibility
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK extension A
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK unified
    (cp >= 0xa000 && cp <= 0xa4cf) || // Yi
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul syllables
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK compatibility ideographs
    (cp >= 0xfe30 && cp <= 0xfe4f) || // CJK compatibility forms
    (cp >= 0xff00 && cp <= 0xff60) || // fullwidth forms
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x2600 && cp <= 0x27bf) || // misc symbols & dingbats (✅ ⚠ ✉ …)
    (cp >= 0x1f000 && cp <= 0x1faff) // emoji & extended pictographs
  ) {
    return 2
  }
  return 1
}

/** Longest line of `text` in visual monospace columns (tabs expanded, wide chars = 2). */
export function maxVisualColumns(text: string, tabSize = 4): number {
  let max = 0
  for (const line of text.split('\n')) {
    let col = 0
    for (const ch of line) {
      const cp = ch.codePointAt(0) ?? 0
      col = cp === 0x09 ? (Math.floor(col / tabSize) + 1) * tabSize : col + codePointWidth(cp)
    }
    if (col > max) max = col
  }
  return max
}

/** Number of rendered rows (trailing newlines stripped). */
export function diagramRowCount(text: string): number {
  const trimmed = text.replace(/\n+$/, '')
  return trimmed.length === 0 ? 1 : trimmed.split('\n').length
}

/**
 * Extract `title="…"` (or `title='…'`) from a fence meta string, e.g.
 * ` ```ascii title="Server layers" `. Anything else in the meta is ignored.
 */
export function parseFenceTitle(meta: string | undefined): string | undefined {
  if (!meta) return undefined
  const match = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)')/.exec(meta)
  const title = (match?.[1] ?? match?.[2] ?? '').trim()
  return title.length > 0 ? title : undefined
}
