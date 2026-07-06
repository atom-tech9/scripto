/**
 * Detects headings that already carry a manual number in their text
 * (`1. Intro`, `3.1 Storage`, `2) Scope`, Arabic-Indic `٣.١ التخزين`).
 * Auto-numbering must leave these untouched and not spend a counter on them,
 * otherwise documents written with their own scheme render `1.2 1. Intro`.
 */
const MANUAL_NUMBER_RE = /^\s*([0-9٠-٩]+(?:\.[0-9٠-٩]+)*)([.)]?)(\s+|(?=[^\s0-9٠-٩.]))\S/u

export const startsWithManualNumber = (text: string): boolean => {
  const match = MANUAL_NUMBER_RE.exec(text)
  if (!match) return false
  const [, digits, punctuation, separator] = match
  // Punctuated ("1.", "2)", even glued "1.Intro") or dotted-multipart ("3.1")
  // counts as a manual number; a bare year-like prefix ("2024 Report") does
  // not, and neither does a bare number glued to a word ("3D Rendering").
  if (punctuation !== '') return true
  return digits.includes('.') && separator !== ''
}
