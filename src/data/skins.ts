import type { TranslationKey } from '@/lib/i18n'
import type { DocumentSkin } from '@/types'

/** How the skin picker groups the catalogue. */
export type SkinGroup =
  'essentials' | 'editorial' | 'technical' | 'business' | 'academic' | 'expressive'

/**
 * How well a skin receives a handwriting hand. Required, so adding a skin
 * forces a decision rather than defaulting to something wrong.
 */
export type HandAffinity = 'native' | 'good' | 'adapts' | 'discouraged'

export interface SkinOption {
  value: DocumentSkin
  label: string
  /** i18n key for the localized label; English `label` is the fallback source. */
  labelKey: TranslationKey
  group: SkinGroup
  handAffinity: HandAffinity
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
  {
    value: 'modern',
    label: 'Modern — clean & balanced',
    labelKey: 'skin.modern.label',
    group: 'essentials',
    handAffinity: 'good',
  },
  {
    value: 'classic',
    label: 'Classic — centered, ruled',
    labelKey: 'skin.classic.label',
    group: 'essentials',
    handAffinity: 'good',
  },
  {
    value: 'editorial',
    label: 'Editorial — magazine, drop cap',
    labelKey: 'skin.editorial.label',
    group: 'editorial',
    handAffinity: 'good',
  },
  {
    value: 'technical',
    label: 'Technical — side-bars, boxed',
    labelKey: 'skin.technical.label',
    group: 'technical',
    handAffinity: 'adapts',
  },
  {
    value: 'compact',
    label: 'Compact — dense one-pager',
    labelKey: 'skin.compact.label',
    group: 'essentials',
    handAffinity: 'adapts',
  },
  {
    value: 'manuscript',
    label: 'Manuscript — indented, typewriter',
    labelKey: 'skin.manuscript.label',
    group: 'editorial',
    handAffinity: 'good',
  },
  {
    value: 'blueprint',
    label: 'Blueprint — mono, engineering grid',
    labelKey: 'skin.blueprint.label',
    group: 'technical',
    handAffinity: 'discouraged',
  },
  {
    value: 'corporate',
    label: 'Corporate — filled headers, cards',
    labelKey: 'skin.corporate.label',
    group: 'business',
    handAffinity: 'adapts',
  },
  {
    value: 'brutalist',
    label: 'Brutalist — bold borders, hard shadows',
    labelKey: 'skin.brutalist.label',
    group: 'expressive',
    handAffinity: 'adapts',
  },
  {
    value: 'notebook',
    label: 'Notebook — highlighter, dashed rules',
    labelKey: 'skin.notebook.label',
    group: 'editorial',
    handAffinity: 'good',
  },
  {
    value: 'resume',
    label: 'Résumé — single column, ATS-friendly',
    labelKey: 'skin.resume.label',
    group: 'essentials',
    handAffinity: 'discouraged',
  },
  {
    value: 'swiss',
    label: 'Swiss — grid, bold rules',
    labelKey: 'skin.swiss.label',
    group: 'expressive',
    handAffinity: 'discouraged',
  },
  {
    value: 'terminal',
    label: 'Terminal — mono, dark, green',
    labelKey: 'skin.terminal.label',
    group: 'technical',
    handAffinity: 'discouraged',
  },
  {
    value: 'newsprint',
    label: 'Newsprint — newspaper serif, kicker',
    labelKey: 'skin.newsprint.label',
    group: 'editorial',
    handAffinity: 'adapts',
  },
  {
    value: 'elegant',
    label: 'Elegant — high-contrast serif, hairlines',
    labelKey: 'skin.elegant.label',
    group: 'editorial',
    handAffinity: 'good',
  },
  {
    value: 'playful',
    label: 'Playful — rounded, pill headings',
    labelKey: 'skin.playful.label',
    group: 'editorial',
    handAffinity: 'good',
  },
  {
    value: 'dark',
    label: 'Dark — dark surface, light text',
    labelKey: 'skin.dark.label',
    group: 'technical',
    handAffinity: 'adapts',
  },
  {
    value: 'ledger',
    label: 'Ledger — tabular numerals, ruled',
    labelKey: 'skin.ledger.label',
    group: 'business',
    handAffinity: 'discouraged',
  },
  {
    value: 'zen',
    label: 'Zen — ultra-minimal, centered',
    labelKey: 'skin.zen.label',
    group: 'essentials',
    handAffinity: 'good',
  },
  {
    value: 'memo',
    label: 'Memo — corporate header band, compact',
    labelKey: 'skin.memo.label',
    group: 'business',
    handAffinity: 'adapts',
  },
  {
    value: 'poster',
    label: 'Poster — oversized display heads',
    labelKey: 'skin.poster.label',
    group: 'editorial',
    handAffinity: 'good',
  },
  {
    value: 'invoice',
    label: 'Invoice — tabular figures, ruled totals',
    labelKey: 'skin.invoice.label',
    group: 'business',
    handAffinity: 'discouraged',
  },
  {
    value: 'contract',
    label: 'Contract — numbered clauses, justified',
    labelKey: 'skin.contract.label',
    group: 'business',
    handAffinity: 'discouraged',
  },
  {
    value: 'letter',
    label: 'Letterhead — formal correspondence',
    labelKey: 'skin.letter.label',
    group: 'business',
    handAffinity: 'adapts',
  },
  {
    value: 'journal',
    label: 'Journal — academic, justified, numbered',
    labelKey: 'skin.journal.label',
    group: 'academic',
    handAffinity: 'adapts',
  },
  {
    value: 'thesis',
    label: 'Thesis — chapter openers, wide leading',
    labelKey: 'skin.thesis.label',
    group: 'academic',
    handAffinity: 'adapts',
  },
  {
    value: 'changelog',
    label: 'Changelog — version chips, tight lists',
    labelKey: 'skin.changelog.label',
    group: 'technical',
    handAffinity: 'discouraged',
  },
  {
    value: 'rfc',
    label: 'RFC / ADR — status block, strict numbering',
    labelKey: 'skin.rfc.label',
    group: 'technical',
    handAffinity: 'discouraged',
  },
  {
    value: 'handout',
    label: 'Handout — large type, one topic per page',
    labelKey: 'skin.handout.label',
    group: 'academic',
    handAffinity: 'good',
  },
]

/** Runtime list of valid skin identifiers (for front-matter validation, etc.). */
export const SKIN_VALUES: DocumentSkin[] = SKIN_OPTIONS.map((s) => s.value)
