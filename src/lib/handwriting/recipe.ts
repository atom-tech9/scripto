import { HANDS } from './hands'
import { INK_VALUES, STATIONERY_VALUES, VARIATION_VALUES } from './vocabulary'
import type { HandConfig, HandStyle, InkStyle, Stationery, HandVariation } from '@/types'

/**
 * Share a handwriting setup as a link: `/app?hand=<recipe>`.
 *
 * A `HandConfig` is small enough to sit in a URL, which turns "here is my exact
 * setup" into something a person can post. The encoding is deliberately plain
 * text rather than base64 so it stays readable in a shared link, and every
 * field is checked against the same allowlists the pickers use — an unknown
 * value falls back to the default rather than reaching the renderer.
 *
 * `customHand` is never encoded: it names a font that only exists in the
 * author's browser, so a recipe carrying it would arrive broken.
 */

/**
 * `~` rather than the obvious `.` or `-`: hand and stationery names contain
 * hyphens, and a full stop is also the decimal point, which silently split
 * `0.35` into two fields. `~` is unreserved in RFC 3986 and appears in no value.
 */
const SEPARATOR = '~'

/** Sliders travel as whole percentages, so no value can contain a separator. */
function percent(value: number, min: number, max: number): string {
  return String(Math.round(Math.min(max, Math.max(min, value)) * 100))
}

export function encodeHandRecipe(hand: HandConfig): string {
  return [
    hand.hand,
    hand.headingHand,
    hand.ink,
    hand.stationery,
    hand.variation,
    percent(hand.neatness, 0, 1),
    percent(hand.slant, -1, 1),
    percent(hand.aging, 0, 1),
    hand.drawnElements ? '1' : '0',
    hand.maskRules ? '1' : '0',
  ].join(SEPARATOR)
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

function number(value: string | undefined, min: number, max: number): number | null {
  if (value === undefined) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.min(max, Math.max(min, parsed / 100))
}

const HAND_VALUES = Object.keys(HANDS) as HandStyle[]

/**
 * Read a recipe into a patch. Returns null when nothing usable is in it, so the
 * caller can leave the document alone rather than apply a half-parsed setup.
 */
export function decodeHandRecipe(recipe: string): Partial<HandConfig> | null {
  const parts = recipe.split(SEPARATOR)
  const hand = pick<HandStyle>(parts[0], HAND_VALUES)
  // The hand itself is the one field a recipe is meaningless without.
  if (!hand || hand === 'custom') return null

  const headingHand = parts[1] === 'same' ? 'same' : pick<HandStyle>(parts[1], HAND_VALUES)
  const ink = pick<InkStyle>(parts[2], INK_VALUES)
  const stationery = pick<Stationery>(parts[3], STATIONERY_VALUES)
  const variation = pick<HandVariation>(parts[4], VARIATION_VALUES)
  const neatness = number(parts[5], 0, 1)
  const slant = number(parts[6], -1, 1)
  const aging = number(parts[7], 0, 1)

  return {
    hand,
    ...(headingHand && headingHand !== 'custom' ? { headingHand } : {}),
    ...(ink ? { ink } : {}),
    ...(stationery ? { stationery } : {}),
    ...(variation ? { variation } : {}),
    ...(neatness !== null ? { neatness } : {}),
    ...(slant !== null ? { slant } : {}),
    ...(aging !== null ? { aging } : {}),
    ...(parts[8] === '0' || parts[8] === '1' ? { drawnElements: parts[8] === '1' } : {}),
    ...(parts[9] === '0' || parts[9] === '1' ? { maskRules: parts[9] === '1' } : {}),
  }
}
