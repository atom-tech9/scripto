import type { TranslationKey } from '@/lib/i18n'
import type { DocumentSkin } from '@/types'

export interface SkinOption {
  value: DocumentSkin
  label: string
  /** i18n key for the localized label; English `label` is the fallback source. */
  labelKey: TranslationKey
}

/**
 * The catalogue of document skins, shared by the settings panel and the visual
 * Theme Gallery so both stay in sync. Each skin maps to a `[data-skin]` block in
 * `src/styles/document.css`.
 */
export const SKIN_OPTIONS: SkinOption[] = [
  { value: 'modern', label: 'Modern — clean & balanced', labelKey: 'skin.modern.label' },
  { value: 'classic', label: 'Classic — centered, ruled', labelKey: 'skin.classic.label' },
  { value: 'editorial', label: 'Editorial — magazine, drop cap', labelKey: 'skin.editorial.label' },
  { value: 'technical', label: 'Technical — side-bars, boxed', labelKey: 'skin.technical.label' },
  { value: 'compact', label: 'Compact — dense one-pager', labelKey: 'skin.compact.label' },
  { value: 'manuscript', label: 'Manuscript — indented, typewriter', labelKey: 'skin.manuscript.label' },
  { value: 'blueprint', label: 'Blueprint — mono, engineering grid', labelKey: 'skin.blueprint.label' },
  { value: 'corporate', label: 'Corporate — filled headers, cards', labelKey: 'skin.corporate.label' },
  { value: 'brutalist', label: 'Brutalist — bold borders, hard shadows', labelKey: 'skin.brutalist.label' },
  { value: 'notebook', label: 'Notebook — highlighter, dashed rules', labelKey: 'skin.notebook.label' },
  { value: 'resume', label: 'Résumé — single column, ATS-friendly', labelKey: 'skin.resume.label' },
  { value: 'swiss', label: 'Swiss — grid, bold rules', labelKey: 'skin.swiss.label' },
  { value: 'terminal', label: 'Terminal — mono, dark, green', labelKey: 'skin.terminal.label' },
  { value: 'newsprint', label: 'Newsprint — newspaper serif, kicker', labelKey: 'skin.newsprint.label' },
  { value: 'elegant', label: 'Elegant — high-contrast serif, hairlines', labelKey: 'skin.elegant.label' },
  { value: 'playful', label: 'Playful — rounded, pill headings', labelKey: 'skin.playful.label' },
  { value: 'dark', label: 'Dark — dark surface, light text', labelKey: 'skin.dark.label' },
  { value: 'ledger', label: 'Ledger — tabular numerals, ruled', labelKey: 'skin.ledger.label' },
  { value: 'zen', label: 'Zen — ultra-minimal, centered', labelKey: 'skin.zen.label' },
  { value: 'memo', label: 'Memo — corporate header band, compact', labelKey: 'skin.memo.label' },
  { value: 'poster', label: 'Poster — oversized display heads', labelKey: 'skin.poster.label' },
]

/** Runtime list of valid skin identifiers (for front-matter validation, etc.). */
export const SKIN_VALUES: DocumentSkin[] = SKIN_OPTIONS.map((s) => s.value)
