import type { TargetAndTransition, Transition } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'
import type { StageMotion } from '@/preview/stage/types'
import type { DocumentSkin } from '@/types'

/**
 * The shared motion vocabulary behind all 21 stages.
 *
 * Two hard rules hold for every primitive:
 *  1. Only `transform` and `opacity` are animated — nothing that triggers
 *     layout or paint on a large surface.
 *  2. Nothing here ever touches `.scripto-doc`. Entrances play on the sheet
 *     *wrapper*; anything that needs to cover the sheet is a separate,
 *     screen-only veil element rendered as a sibling.
 */

/** Duration scale, in seconds, mirroring the `--m-*` CSS tokens. */
export const DURATION = {
  snap: 0.09,
  quick: 0.16,
  base: 0.28,
  slow: 0.48,
  drift: 0.7,
} as const

/** A hard, short settle — no overshoot. Used by `snap` and `stamp`. */
const EASE_HARD = [0.2, 0, 0, 1] as const
const EASE_LINEAR = [0, 0, 1, 1] as const

/** The veil shapes `StageVeil` can take. Each maps to CSS in `stage.css`. */
export type VeilKind = 'sweep' | 'rules' | 'steps' | 'bands' | 'halo' | 'aperture'

export interface VeilSpec {
  readonly kind: VeilKind
  /** Number of child elements (bars, rules, bands). */
  readonly count: number
  readonly from: TargetAndTransition
  readonly to: TargetAndTransition
  readonly transition: Transition
  /** Seconds between successive children. */
  readonly stagger: number
}

export interface StageEntrance {
  /** Sheet-wrapper start state. */
  readonly from: TargetAndTransition
  /** Sheet-wrapper end state. */
  readonly to: TargetAndTransition
  readonly transition: Transition
  readonly veil: VeilSpec | null
}

/** Keyframes that read as discrete steps without relying on a `steps()` easing. */
const STEP_KEYFRAMES = [1, 0.84, 0.68, 0.52, 0.36, 0.2, 0]

const REST: TargetAndTransition = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
}

/** The ten primitives. Everything a stage does is a parameterisation of these. */
const PRIMITIVES: Record<StageMotion, StageEntrance> = {
  // Calm, the default: a sheet settling into place.
  rise: {
    from: { opacity: 0, y: 12 },
    to: REST,
    transition: { duration: DURATION.base, ease: EASE_OUT },
    veil: null,
  },

  // Editorial: a masked bar sweeps along the inline axis, content behind it.
  wipe: {
    from: { opacity: 0 },
    to: REST,
    transition: { duration: DURATION.quick, ease: EASE_OUT, delay: 0.06 },
    veil: {
      kind: 'sweep',
      count: 1,
      from: { scaleX: 1, opacity: 1 },
      to: { scaleX: 0, opacity: 1 },
      transition: { duration: DURATION.slow, ease: EASE_OUT },
      stagger: 0,
    },
  },

  // Technical: the four edges draw themselves, then the content resolves.
  draw: {
    from: { opacity: 0 },
    to: REST,
    transition: { duration: DURATION.base, ease: EASE_OUT, delay: 0.18 },
    veil: {
      kind: 'rules',
      count: 4,
      from: { scale: 0, opacity: 1 },
      to: { scale: 1, opacity: 0 },
      transition: { duration: DURATION.slow, ease: EASE_OUT, opacity: { delay: 0.36 } },
      stagger: 0.05,
    },
  },

  // Mechanical: a cover retreats in discrete steps, with a micro x-jitter.
  type: {
    from: { opacity: 0, x: 0 },
    to: { ...REST, x: [0, 0.8, -0.5, 0] },
    transition: { duration: DURATION.base, ease: EASE_LINEAR },
    veil: {
      kind: 'steps',
      count: 1,
      from: { scaleY: 1, opacity: 1 },
      to: { scaleY: STEP_KEYFRAMES, opacity: 1 },
      transition: { duration: DURATION.slow, ease: EASE_LINEAR },
      stagger: 0,
    },
  },

  // Efficient: no curve, no overshoot, gone before you register it.
  snap: {
    from: { opacity: 0 },
    to: REST,
    transition: { duration: DURATION.snap, ease: EASE_LINEAR },
    veil: null,
  },

  // Friendly: a small, bouncy settle.
  spring: {
    from: { opacity: 0, scale: 0.96 },
    to: REST,
    transition: { type: 'spring', duration: DURATION.slow, bounce: 0.22 },
    veil: null,
  },

  // Nocturnal: a light travels the paper perimeter, then content fades in.
  glow: {
    from: { opacity: 0 },
    to: REST,
    transition: { duration: DURATION.base, ease: EASE_OUT, delay: 0.2 },
    veil: {
      kind: 'halo',
      count: 1,
      from: { rotate: 0, opacity: 0 },
      to: { rotate: 360, opacity: [0, 1, 1, 0] },
      transition: { duration: DURATION.drift, ease: EASE_LINEAR },
      stagger: 0,
    },
  },

  // Tabular: bands lift away top-to-bottom in tight 24 ms steps.
  cascade: {
    from: { opacity: 0 },
    to: REST,
    transition: { duration: DURATION.quick, ease: EASE_OUT },
    veil: {
      kind: 'bands',
      count: 6,
      from: { scaleY: 1, opacity: 1 },
      to: { scaleY: 0, opacity: 1 },
      transition: { duration: DURATION.base, ease: EASE_OUT },
      stagger: 0.024,
    },
  },

  // Cinematic: the spotlight opens while the content fades up.
  bloom: {
    from: { opacity: 0, y: 8, scale: 0.985 },
    to: REST,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
    veil: {
      kind: 'aperture',
      count: 1,
      from: { scale: 0.6, opacity: 1 },
      to: { scale: 1.6, opacity: 0 },
      transition: { duration: DURATION.drift, ease: EASE_OUT },
      stagger: 0,
    },
  },

  // Institutional: pressed down and held.
  stamp: {
    from: { opacity: 0, scale: 1.04 },
    to: REST,
    transition: { duration: DURATION.base, ease: EASE_HARD },
    veil: null,
  },
}

/**
 * Per-skin flavour deltas merged onto the primitive's start state. This is how
 * two stages share a primitive and still read as different rooms — the spine
 * page-turn on `classic`, the flip-down on `notebook` — without any stage
 * getting its own bespoke animation code.
 */
const SIGNATURE: Partial<Record<DocumentSkin, TargetAndTransition>> = {
  // Bound page turning away from the spine.
  classic: { rotateY: -7, transformPerspective: 1400 },
  // Flipping down from the top of a pad.
  notebook: { rotateX: -9, transformPerspective: 1200 },
  // A sticker settling onto the board.
  playful: { rotate: -1.4 },
  // Lifted out of the folder — starts a touch low and small.
  resume: { y: 18, scale: 0.99 },
  // A large sheet coming up on a gallery wall.
  poster: { scale: 0.92 },
  // Zen is a pure fade: no movement at all, only slower.
  zen: { y: 0 },
}

/** The slower, movement-free transition Zen uses. */
const ZEN_TRANSITION: Transition = { duration: DURATION.drift, ease: EASE_OUT }

/** Reduced motion collapses every entrance to a plain 120 ms opacity fade. */
export const REDUCED_ENTRANCE: StageEntrance = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  transition: { duration: 0.12, ease: EASE_LINEAR },
  veil: null,
}

/**
 * Resolve the entrance a skin plays: its stage's primitive, plus that skin's
 * signature delta. Under reduced motion every stage collapses to a fade —
 * textures stay, motion goes.
 */
export function entranceFor(
  motion: StageMotion,
  skin: DocumentSkin,
  reducedMotion: boolean,
): StageEntrance {
  if (reducedMotion) return REDUCED_ENTRANCE
  const base = PRIMITIVES[motion]
  const delta = SIGNATURE[skin]
  if (!delta) return base
  return {
    ...base,
    from: { ...base.from, ...delta },
    transition: skin === 'zen' ? ZEN_TRANSITION : base.transition,
  }
}
