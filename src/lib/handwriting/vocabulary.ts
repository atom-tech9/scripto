import { HANDS } from './hands'
import type { HandConfig, HandStyle, HandVariation, InkStyle, Stationery } from '@/types'

/**
 * Runtime allowlists for the handwriting enums.
 *
 * The types are compile-time only, so anything reading a hand setting from
 * outside the app — a shared link, imported front-matter, a stored preset —
 * needs a real list to check against. `satisfies` keeps these in step with the
 * unions: drop a value from either side and the build fails.
 */

export const INK_VALUES = [
  'ballpoint-blue',
  'ballpoint-black',
  'fountain-blue',
  'fountain-black',
  'pencil',
  'marker',
  'red-pen',
  'gel',
  'chalk-white',
  'sepia',
] as const satisfies readonly InkStyle[]

export const STATIONERY_VALUES = [
  'blank',
  'ruled-college',
  'ruled-wide',
  'ruled-narrow',
  'graph',
  'dot-grid',
  'isometric',
  'legal-pad',
  'engineering',
  'cornell',
  'index-card',
  'steno',
  'practice-lines',
  'music-staff',
  'parchment',
  'kraft',
  'graph-blue',
] as const satisfies readonly Stationery[]

export const VARIATION_VALUES = [
  'none',
  'word',
  'expressive',
] as const satisfies readonly HandVariation[]

/**
 * Narrow an untrusted hand block to values we actually ship.
 *
 * A config can arrive from localStorage, an imported preset file, or a
 * document's front-matter — all of them hand-editable. An unrecognised value
 * would reach the renderer as a `data-hand` attribute that matches no CSS,
 * which shows up as a document that silently stops being handwritten rather
 * than as an error. Falling back per field keeps the rest of the block usable.
 */
export function sanitiseHandConfig(raw: unknown, fallback: HandConfig): HandConfig {
  if (!raw || typeof raw !== 'object') return fallback
  const value = raw as Partial<Record<keyof HandConfig, unknown>>

  const one = <T extends string>(input: unknown, allowed: readonly T[], base: T): T =>
    typeof input === 'string' && (allowed as readonly string[]).includes(input) ? (input as T) : base

  const clamp = (input: unknown, min: number, max: number, base: number): number =>
    typeof input === 'number' && Number.isFinite(input)
      ? Math.min(max, Math.max(min, input))
      : base

  const bool = (input: unknown, base: boolean): boolean =>
    typeof input === 'boolean' ? input : base

  const handNames = Object.keys(HANDS) as HandStyle[]
  return {
    hand: one(value.hand, handNames, fallback.hand),
    ...(typeof value.customHand === 'string' ? { customHand: value.customHand } : {}),
    headingHand:
      value.headingHand === 'same'
        ? 'same'
        : one(value.headingHand, handNames, fallback.headingHand as HandStyle),
    ink: one(value.ink, INK_VALUES, fallback.ink),
    stationery: one(value.stationery, STATIONERY_VALUES, fallback.stationery),
    variation: one(value.variation, VARIATION_VALUES, fallback.variation),
    neatness: clamp(value.neatness, 0, 1, fallback.neatness),
    slant: clamp(value.slant, -1, 1, fallback.slant),
    aging: clamp(value.aging, 0, 1, fallback.aging),
    drawnElements: bool(value.drawnElements, fallback.drawnElements),
    maskRules: bool(value.maskRules, fallback.maskRules),
    seed: clamp(value.seed, 0, Number.MAX_SAFE_INTEGER, fallback.seed),
  }
}
