import type { CSSProperties } from 'react'
import { FONT_STACKS } from '@/lib/constants'
import { handDescriptor, handFontStack } from '@/lib/handwriting/hands'
import { isRuled, rulePitchMm } from '@/lib/handwriting/rules'
import type { PdfConfig } from '@/types'

/** Points → pixels (CSS reference: 1pt = 1.333px). */
export const PT_TO_PX = 96 / 72

/**
 * Build the CSS custom properties for the rendered document root from the
 * export config. Used by BOTH the live preview and the paginated PDF so the two
 * stay visually identical.
 *
 * `scale` lets the live preview render slightly larger than the literal print
 * point size for on-screen comfort while keeping every proportion intact.
 */
export function documentStyleVars(config: PdfConfig, scale = 1): CSSProperties {
  const sizePx = config.fontSize * PT_TO_PX * scale
  const vars: Record<string, string | number> = {
    '--doc-font': FONT_STACKS[config.font],
    '--doc-size': `${sizePx}px`,
    '--doc-leading': config.lineHeight,
    '--doc-accent': config.accentColor,
  }

  const { hand } = config
  if (hand.hand !== 'none') {
    const descriptor = handDescriptor(hand.hand)
    const stack = handFontStack(hand.hand, hand.customHand)
    if (stack) vars['--doc-hand-font'] = stack
    if (descriptor) vars['--doc-size'] = `${sizePx * descriptor.sizeAdjust}px`

    const headingHand = hand.headingHand === 'same' ? hand.hand : hand.headingHand
    const headingStack = handFontStack(headingHand, hand.customHand)
    if (headingStack) vars['--doc-heading-hand-font'] = headingStack

    vars['--hw-neatness'] = hand.neatness
    vars['--hw-slant'] = `${hand.slant * 3}deg`
    vars['--hw-aging'] = hand.aging

    // Ruled paper only works if the leading matches the rule pitch exactly.
    // Half a rule out of phase and every line drifts, which looks worse than
    // plain text on plain paper — so the pitch wins over the line-height
    // setting, and the UI disables that slider rather than letting it silently
    // break the page.
    // Ruled paper only works if every line and every gap between blocks is a
    // whole number of rules. The pitch is published here and `[data-ruled]` in
    // handwriting.css locks the rhythm to it in absolute units — deriving a
    // unitless line-height instead leaves rounding error that accumulates down
    // the page until the text visibly drifts off the lines.
    const pitch = rulePitchMm(hand.stationery)
    if (pitch !== null) vars['--hw-pitch'] = `${pitch}mm`
  }

  return vars as CSSProperties
}

export function documentDataAttrs(config: PdfConfig): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-code-theme': config.codeTheme,
    'data-table-style': config.tableStyle,
    'data-skin': config.skin,
    dir: config.direction,
  }
  if (config.direction === 'rtl' || config.font === 'arabic') attrs.lang = 'ar'
  if (config.numberedHeadings) attrs['data-numbered'] = 'true'

  // Handwriting. `hand: 'none'` emits nothing at all, so none of the
  // handwriting or stationery CSS can match and the feature costs a document
  // that never uses it precisely nothing.
  const { hand } = config
  if (hand.hand !== 'none') {
    attrs['data-hand'] = hand.hand
    attrs['data-ink'] = hand.ink
    if (hand.stationery !== 'blank') attrs['data-stationery'] = hand.stationery
    if (isRuled(hand.stationery)) attrs['data-ruled'] = 'true'
    if (hand.headingHand !== 'same') attrs['data-heading-hand'] = hand.headingHand
    if (hand.drawnElements) attrs['data-drawn'] = 'true'
    if (hand.maskRules) attrs['data-mask-rules'] = 'true'
    if (hand.aging > 0) attrs['data-aged'] = 'true'
    if (handDescriptor(hand.hand)?.variable) attrs['data-hand-variable'] = 'true'
  }

  return attrs
}

/** Class list for the document root reflecting boolean config flags. */
export function documentClassName(config: PdfConfig): string {
  return config.hyphenation ? 'scripto-doc hyphenate' : 'scripto-doc'
}
