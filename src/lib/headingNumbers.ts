/**
 * Detects headings that already carry a manual number in their text
 * (`1. Intro`, `3.1 Storage`, `2) Scope`, `1 · Meta`, `4 — Rollout`,
 * Arabic-Indic `٣.١ التخزين`).
 * Auto-numbering must leave these untouched and not spend a counter on them,
 * otherwise documents written with their own scheme render `1.2 1. Intro`.
 */

/** Separators authors put between their own number and the heading text. */
const SEPARATORS = '.)·—–:|-'

// The separator group is optional as a whole, so it can never swallow the
// whitespace the dotted-multipart rule below depends on.
const MANUAL_NUMBER_RE = new RegExp(
  String.raw`^\s*([0-9٠-٩]+(?:\.[0-9٠-٩]+)*)(?:\s*([${SEPARATORS}]))?(\s+|(?=[^\s0-9٠-٩.]))\S`,
  'u',
)

export const startsWithManualNumber = (text: string): boolean => {
  const match = MANUAL_NUMBER_RE.exec(text)
  if (!match) return false
  const [, digits, punctuation = '', separator] = match
  // A separator ("1.", "2)", "1 · Meta", "4 — Rollout", even glued "1.Intro")
  // or a dotted-multipart number ("3.1") counts as a manual number. A bare
  // number followed only by a space does not: "2024 Annual Report" and
  // "3D Rendering" are titles, not numbered sections.
  //
  // The rule is deliberately generous, because the two failure modes are not
  // equally bad. Treating an author's number as manual when it wasn't merely
  // leaves that heading unnumbered; missing one produces visibly broken output
  // like "2.  1 · Meta", with every following number off by one.
  if (punctuation !== '') return true
  return digits.includes('.') && separator !== ''
}
