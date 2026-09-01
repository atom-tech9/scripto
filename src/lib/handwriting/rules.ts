import type { Stationery } from '@/types'

/** CSS reference pixels per millimetre at 96 dpi. */
export const MM_TO_PX = 96 / 25.4

/**
 * Rule pitch per ruled stationery, in millimetres. These are the real spacings
 * of the paper each one imitates.
 */
const PITCH_MM: Partial<Record<Stationery, number>> = {
  'ruled-college': 7.1,
  'ruled-wide': 8.7,
  'ruled-narrow': 6.35,
  'legal-pad': 8.7,
  cornell: 7.1,
  steno: 7.1,
  'practice-lines': 12.7,
  'music-staff': 10,
  engineering: 5,
  graph: 5,
  'graph-blue': 5,
  'dot-grid': 5,
  isometric: 5,
}

/** The rule pitch in millimetres, or null when the paper has no rules. */
export function rulePitchMm(stationery: Stationery): number | null {
  return PITCH_MM[stationery] ?? null
}

/** Stationery whose rules the text has to sit on, not merely near. */
export function isRuled(stationery: Stationery): boolean {
  return (
    stationery === 'ruled-college' ||
    stationery === 'ruled-wide' ||
    stationery === 'ruled-narrow' ||
    stationery === 'legal-pad' ||
    stationery === 'cornell' ||
    stationery === 'steno' ||
    stationery === 'practice-lines' ||
    stationery === 'music-staff'
  )
}

/**
 * Snap the top and bottom margins to whole rules.
 *
 * Handwriting has to sit ON the rule. If the first baseline starts half a rule
 * down the page, every line after it is out of phase and the illusion collapses
 * — it looks worse than plain text on plain paper. The top margin therefore has
 * to be an exact multiple of the pitch.
 *
 * Only the block margins move; the inline ones are left alone, and the top is
 * never snapped below one full rule.
 */
export function snapMarginsToRule<T extends { top: number; bottom: number }>(
  margins: T,
  pitchMm: number,
): T {
  if (!Number.isFinite(pitchMm) || pitchMm <= 0) return margins
  const snap = (value: number) => Math.max(pitchMm, Math.round(value / pitchMm) * pitchMm)
  return { ...margins, top: snap(margins.top), bottom: snap(margins.bottom) }
}

/**
 * The line-height that makes one line of text occupy exactly one rule.
 *
 * Returned unitless, the way `--doc-leading` is consumed: pitch in px divided
 * by the font size in px.
 */
export function leadingForPitch(pitchMm: number, fontSizePx: number): number {
  if (fontSizePx <= 0) return 1
  return (pitchMm * MM_TO_PX) / fontSizePx
}

/**
 * The margins a document should actually be laid out with.
 *
 * On ruled paper the top margin has to be a whole number of rules, or the first
 * baseline lands mid-rule and every line after it is out of phase. Everything
 * else is returned untouched.
 */
export function resolveMargins<T extends { top: number; bottom: number }>(
  margins: T,
  stationery: Stationery,
  handActive: boolean,
): T {
  if (!handActive || !isRuled(stationery)) return margins
  const pitch = rulePitchMm(stationery)
  return pitch === null ? margins : snapMarginsToRule(margins, pitch)
}
