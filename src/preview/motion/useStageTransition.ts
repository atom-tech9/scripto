import { useEffect, useRef, useState } from 'react'
import { useAnimationControls, useReducedMotion, type AnimationControls } from 'motion/react'
import { entranceFor, type VeilSpec } from './vocabulary'
import type { StageDescriptor, StageLevel } from '@/preview/stage/types'

/** How long the stage-name label stays up after a skin change. */
const LABEL_MS = 900
/** Slack over the veil's own duration before it is unmounted. */
const VEIL_TAIL_MS = 260

export interface StageVeilRun {
  readonly spec: VeilSpec
  /** Increments per transition so the veil remounts and replays cleanly. */
  readonly id: number
}

export interface StageTransition {
  /** Bind to the sheet *wrapper* — never to `.scripto-doc`. */
  readonly sheet: AnimationControls
  /** The veil to render for the current transition, or null. */
  readonly veil: StageVeilRun | null
  /** True while the brief stage-name label should be visible. */
  readonly labelVisible: boolean
}

/**
 * Orchestrates the skin → skin stage transition: replays the new stage's motion
 * signature on the sheet wrapper, runs its veil once, and flashes the stage
 * name.
 *
 * Interruption safety: every run re-seeds the wrapper from the entrance's start
 * state and supersedes the previous animation, and both timers are cleared on
 * change — so switching skins rapidly can never leave a stuck veil or a
 * half-faded label behind.
 */
export function useStageTransition(stage: StageDescriptor, level: StageLevel): StageTransition {
  const sheet = useAnimationControls()
  const prefersReduced = useReducedMotion() ?? false
  const [veil, setVeil] = useState<StageVeilRun | null>(null)
  const [labelVisible, setLabelVisible] = useState(false)
  const runId = useRef(0)
  // The first render is a page load, not a skin change — no name label for it.
  const mounted = useRef(false)

  const { skin, motion } = stage
  // `minimal` keeps the textures but drops the movement, exactly like reduced
  // motion; `off` opts out of the stage system altogether.
  const reduced = prefersReduced || level === 'minimal'
  const enabled = level !== 'off'

  useEffect(() => {
    if (!enabled) return
    const entrance = entranceFor(motion, skin, reduced)
    const id = (runId.current += 1)

    sheet.set(entrance.from)
    // `start` supersedes any in-flight animation on the same controls, so a
    // rapid skin switch simply retargets rather than queueing.
    void sheet.start({ ...entrance.to, transition: entrance.transition })

    setVeil(entrance.veil ? { spec: entrance.veil, id } : null)

    const timers: number[] = []
    if (entrance.veil) {
      const { duration = 0, delay = 0 } = entrance.veil.transition as {
        duration?: number
        delay?: number
      }
      const life = (duration + delay + entrance.veil.stagger * entrance.veil.count) * 1000
      timers.push(
        window.setTimeout(
          () => setVeil((prev) => (prev?.id === id ? null : prev)),
          life + VEIL_TAIL_MS,
        ),
      )
    }

    if (mounted.current) {
      setLabelVisible(true)
      timers.push(window.setTimeout(() => setLabelVisible(false), LABEL_MS))
    }
    mounted.current = true

    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [skin, motion, reduced, enabled, sheet])

  // Leaving the stage system entirely must never strand the wrapper mid-fade.
  useEffect(() => {
    if (enabled) return
    sheet.set({ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0 })
    setVeil(null)
    setLabelVisible(false)
  }, [enabled, sheet])

  return { sheet, veil, labelVisible }
}
