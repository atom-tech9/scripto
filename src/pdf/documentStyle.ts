import type { CSSProperties } from 'react'
import { FONT_STACKS } from '@/lib/constants'
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
  return {
    '--doc-font': FONT_STACKS[config.font],
    '--doc-size': `${config.fontSize * PT_TO_PX * scale}px`,
    '--doc-leading': config.lineHeight,
    '--doc-accent': config.accentColor,
  } as CSSProperties
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
  return attrs
}

/** Class list for the document root reflecting boolean config flags. */
export function documentClassName(config: PdfConfig): string {
  return config.hyphenation ? 'scripto-doc hyphenate' : 'scripto-doc'
}
