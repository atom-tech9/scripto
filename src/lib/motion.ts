import type { Transition, Variants } from 'motion/react'

/**
 * Shared motion presets so every surface animates with one consistent language.
 * Global reduced-motion is honoured via <MotionConfig reducedMotion="user">.
 */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const

/** Quick UI feedback (hovers, small toggles). */
export const transitionQuick: Transition = { duration: 0.14, ease: EASE_OUT }

/** Gentle panel/list transitions. */
export const transitionGentle: Transition = { duration: 0.22, ease: EASE_OUT }

/** Springy entrance for dialogs, menus, popovers. */
export const transitionSpring: Transition = { type: 'spring', duration: 0.32, bounce: 0.18 }

/** Fade + tiny rise, for menus and popovers. */
export const popIn: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

/** Fade + rise, for cards/panels. */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

/** Container that staggers its children in. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
}

/** A single staggered list/grid item. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitionGentle },
}
