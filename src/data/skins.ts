import type { TranslationKey } from '@/lib/i18n'
import type { DocumentSkin } from '@/types'

/** How the skin picker groups the catalogue. */
export type SkinGroup = 'essentials' | 'editorial' | 'technical' | 'business' | 'academic' | 'expressive'

export interface SkinOption {
  value: DocumentSkin
  label: string
  /** i18n key for the localized label; English `label` is the fallback source. */
  labelKey: TranslationKey
  group: SkinGroup
}

/** Display order for the groups, with their i18n labels. */
export const SKIN_GROUPS: readonly { id: SkinGroup; labelKey: TranslationKey }[] = [
  { id: 'essentials', labelKey: 'skinGroup.essentials' },
  { id: 'business', labelKey: 'skinGroup.business' },
  { id: 'technical', labelKey: 'skinGroup.technical' },
  { id: 'editorial', labelKey: 'skinGroup.editorial' },
  { id: 'academic', labelKey: 'skinGroup.academic' },
  { id: 'expressive', labelKey: 'skinGroup.expressive' },
]

/**
 * The catalogue of document skins, shared by the settings panel and the visual
 * Theme Gallery so both stay in sync. Each skin maps to a `[data-skin]` block in
 * `src/styles/document.css`.
 */
export const SKIN_OPTIONS: SkinOption[] = [
  { value: 'modern', label: 'Modern — clean & balanced', labelKey: 'skin.modern.label' , group: 'essentials' },
  { value: 'classic', label: 'Classic — centered, ruled', labelKey: 'skin.classic.label' , group: 'essentials' },
  { value: 'editorial', label: 'Editorial — magazine, drop cap', labelKey: 'skin.editorial.label' , group: 'editorial' },
  { value: 'technical', label: 'Technical — side-bars, boxed', labelKey: 'skin.technical.label' , group: 'technical' },
  { value: 'compact', label: 'Compact — dense one-pager', labelKey: 'skin.compact.label' , group: 'essentials' },
  { value: 'manuscript', label: 'Manuscript — indented, typewriter', labelKey: 'skin.manuscript.label' , group: 'editorial' },
  { value: 'blueprint', label: 'Blueprint — mono, engineering grid', labelKey: 'skin.blueprint.label' , group: 'technical' },
  { value: 'corporate', label: 'Corporate — filled headers, cards', labelKey: 'skin.corporate.label' , group: 'business' },
  { value: 'brutalist', label: 'Brutalist — bold borders, hard shadows', labelKey: 'skin.brutalist.label' , group: 'expressive' },
  { value: 'notebook', label: 'Notebook — highlighter, dashed rules', labelKey: 'skin.notebook.label' , group: 'editorial' },
  { value: 'resume', label: 'Résumé — single column, ATS-friendly', labelKey: 'skin.resume.label' , group: 'essentials' },
  { value: 'swiss', label: 'Swiss — grid, bold rules', labelKey: 'skin.swiss.label' , group: 'expressive' },
  { value: 'terminal', label: 'Terminal — mono, dark, green', labelKey: 'skin.terminal.label' , group: 'technical' },
  { value: 'newsprint', label: 'Newsprint — newspaper serif, kicker', labelKey: 'skin.newsprint.label' , group: 'editorial' },
  { value: 'elegant', label: 'Elegant — high-contrast serif, hairlines', labelKey: 'skin.elegant.label' , group: 'editorial' },
  { value: 'playful', label: 'Playful — rounded, pill headings', labelKey: 'skin.playful.label' , group: 'editorial' },
  { value: 'dark', label: 'Dark — dark surface, light text', labelKey: 'skin.dark.label' , group: 'technical' },
  { value: 'ledger', label: 'Ledger — tabular numerals, ruled', labelKey: 'skin.ledger.label' , group: 'business' },
  { value: 'zen', label: 'Zen — ultra-minimal, centered', labelKey: 'skin.zen.label' , group: 'essentials' },
  { value: 'memo', label: 'Memo — corporate header band, compact', labelKey: 'skin.memo.label' , group: 'business' },
  { value: 'poster', label: 'Poster — oversized display heads', labelKey: 'skin.poster.label' , group: 'editorial' },
  { value: 'invoice', label: 'Invoice — tabular figures, ruled totals', labelKey: 'skin.invoice.label' , group: 'business' },
  { value: 'contract', label: 'Contract — numbered clauses, justified', labelKey: 'skin.contract.label' , group: 'business' },
  { value: 'letter', label: 'Letterhead — formal correspondence', labelKey: 'skin.letter.label' , group: 'business' },
  { value: 'journal', label: 'Journal — academic, justified, numbered', labelKey: 'skin.journal.label' , group: 'academic' },
  { value: 'thesis', label: 'Thesis — chapter openers, wide leading', labelKey: 'skin.thesis.label' , group: 'academic' },
  { value: 'changelog', label: 'Changelog — version chips, tight lists', labelKey: 'skin.changelog.label' , group: 'technical' },
  { value: 'rfc', label: 'RFC / ADR — status block, strict numbering', labelKey: 'skin.rfc.label' , group: 'technical' },
  { value: 'handout', label: 'Handout — large type, one topic per page', labelKey: 'skin.handout.label' , group: 'academic' },
]

/** Runtime list of valid skin identifiers (for front-matter validation, etc.). */
export const SKIN_VALUES: DocumentSkin[] = SKIN_OPTIONS.map((s) => s.value)
