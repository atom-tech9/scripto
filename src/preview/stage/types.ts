import type { TranslationKey } from '@/lib/i18n'
import type { DocumentSkin } from '@/types'

/**
 * The shared motion vocabulary. Every stage composes its entrance from one of
 * these ten primitives — parameterised, never reinvented per stage.
 *
 * All ten are implemented against the sheet *wrapper* and a screen-only veil
 * overlay, using `transform` and `opacity` only. `.scripto-doc` is never
 * animated, transformed, or otherwise touched: it is cloned verbatim into the
 * PDF, HTML and Word exports.
 */
export type StageMotion =
  'rise' | 'wipe' | 'draw' | 'type' | 'snap' | 'spring' | 'glow' | 'cascade' | 'bloom' | 'stamp'

/**
 * Screen-only decorations `PaperFrame` renders *around* the sheet. Each maps to
 * a `[data-stage='x'] .stage-frame__<feature>` block in `stage.css`; the element
 * itself carries no inline styling, so a stage is data plus CSS, not a
 * bespoke component.
 */
export type StageFrame =
  | 'spine'
  | 'tab'
  | 'ticks'
  | 'registration'
  | 'spiral'
  | 'margin-rule'
  | 'title-block'
  | 'header-band'
  | 'platen'
  | 'gutter-rules'
  | 'accent-band'
  | 'edge-glow'

/** An oversized mark drawn on the ground — never on the paper. */
export type StageMark =
  /** The document title, set huge and very faint behind the sheet. */
  | 'title'
  /** A ghost "INTERNAL" stamp for the interoffice stage. */
  | 'internal'

export interface StageDescriptor {
  /** The skin this stage dresses. One stage per skin, exhaustively. */
  readonly skin: DocumentSkin
  /** i18n key for the stage's display name (shown briefly on skin change). */
  readonly nameKey: TranslationKey
  readonly motion: StageMotion
  /** Whether the ground is dark — drives chrome and rail contrast. */
  readonly tone: 'light' | 'dark'
  readonly frame: readonly StageFrame[]
  readonly mark?: StageMark
}

/**
 * The escape hatch, persisted at `scripto:preview-stage`.
 * `off` restores the plain card exactly as it was before the stage system.
 */
export type StageLevel = 'full' | 'minimal' | 'off'

/** Preview presentation mode, persisted at `scripto:preview-mode`. */
export type PreviewMode = 'flow' | 'pages' | 'focus'

export const STAGE_LEVELS: readonly StageLevel[] = ['full', 'minimal', 'off']
export const PREVIEW_MODES: readonly PreviewMode[] = ['flow', 'pages', 'focus']

export function isStageLevel(value: unknown): value is StageLevel {
  return typeof value === 'string' && (STAGE_LEVELS as readonly string[]).includes(value)
}

export function isPreviewMode(value: unknown): value is PreviewMode {
  return typeof value === 'string' && (PREVIEW_MODES as readonly string[]).includes(value)
}
