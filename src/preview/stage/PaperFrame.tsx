import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { AnimationControls, Variants } from 'motion/react'
import type { StageVeilRun } from '@/preview/motion/useStageTransition'
import type { StageDescriptor, StageLevel } from './types'

interface PaperFrameProps {
  stage: StageDescriptor
  level: StageLevel
  /** Entrance animation for the wrapper — never applied to `.scripto-doc`. */
  controls: AnimationControls
  veil: StageVeilRun | null
  /** The page card, which contains `.scripto-doc`. */
  children: ReactNode
}

function StageVeil({ run }: { run: StageVeilRun }) {
  const { spec } = run
  const baseDelay = typeof spec.transition.delay === 'number' ? spec.transition.delay : 0
  return (
    <div className={`stage-veil stage-veil--${spec.kind}`} aria-hidden>
      {Array.from({ length: spec.count }, (_, index) => {
        const variants: Variants = {
          hidden: spec.from,
          visible: {
            ...spec.to,
            transition: { ...spec.transition, delay: baseDelay + index * spec.stagger },
          },
        }
        return (
          <motion.span
            key={index}
            className="stage-veil__part"
            data-index={index}
            variants={variants}
            initial="hidden"
            animate="visible"
          />
        )
      })}
    </div>
  )
}

/**
 * The paper treatment: everything drawn around (never inside) the sheet, plus
 * the transition veil. Decorations are declared per stage in `stages.ts` and
 * styled in `stage.css`, so a stage stays data rather than a bespoke component.
 */
export function PaperFrame({ stage, level, controls, veil, children }: PaperFrameProps) {
  const decorated = level === 'full'
  return (
    <motion.div className="stage-sheet" animate={controls}>
      {decorated && stage.frame.length > 0 && (
        <div className="stage-frame" aria-hidden>
          {stage.frame.map((feature) => (
            <span key={feature} className={`stage-frame__${feature}`} />
          ))}
        </div>
      )}
      {children}
      {decorated && veil && <StageVeil key={veil.id} run={veil} />}
    </motion.div>
  )
}
