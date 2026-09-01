import { memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLanguage } from '@/i18n'
import { DURATION } from '@/preview/motion/vocabulary'
import { EASE_OUT } from '@/lib/motion'
import type { StageDescriptor, StageLevel } from './types'

interface StageBackdropProps {
  stage: StageDescriptor
  /** Drives `--stage-accent` for grounds and lighting that follow the accent. */
  accentColor: string
  /** Document title, for the stage that sets it huge behind the sheet. */
  title: string
  level: StageLevel
}

/**
 * Ground, texture and lighting for the active stage. Purely decorative and
 * absolutely positioned behind the sheet — nothing here can reach the export.
 *
 * Memoised on the props below so typing never re-renders it: a keystroke
 * changes `content`, which this component does not receive.
 */
export const StageBackdrop = memo(function StageBackdrop({
  stage,
  accentColor,
  title,
  level,
}: StageBackdropProps) {
  const { t } = useLanguage()
  if (level === 'off') return null

  const mark =
    stage.mark === 'internal' ? t('stage.mark.internal') : stage.mark === 'title' ? title : ''

  return (
    <div className="stage-backdrop" aria-hidden>
      <AnimatePresence initial={false}>
        <motion.div
          key={stage.skin}
          className="stage-backdrop__layer"
          data-stage={stage.skin}
          style={{ ['--stage-accent' as string]: accentColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
        >
          <span className="stage-ground" />
          <span className="stage-texture" />
          <span className="stage-light" />
          {mark && <span className="stage-mark">{mark}</span>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
})
