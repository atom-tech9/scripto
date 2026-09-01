import type { DocumentFont } from '@/types'

export type FontScript = 'latin' | 'arabic'

export interface DocFontDescriptor {
  readonly family: string
  /** `family=` parameter for the Google Fonts CSS API, or null when the face
   * already ships in the global stylesheet (or is a system font). */
  readonly googleParam: string | null
  readonly script: FontScript
  readonly labelKey: string
}

/**
 * The document body faces.
 *
 * The five originals ship in the global font URL in `index.html`, because they
 * are what a first render needs. Everything added since loads on demand — that
 * URL is preloaded on every visit including the marketing site, and piling
 * twenty families into it would wreck LCP for pages that never use them.
 */
export const DOC_FONTS: Record<DocumentFont, DocFontDescriptor> = {
  serif: { family: 'Source Serif 4', googleParam: null, script: 'latin', labelKey: 'font.serif' },
  sans: { family: 'Inter', googleParam: null, script: 'latin', labelKey: 'font.sans' },
  lora: { family: 'Lora', googleParam: null, script: 'latin', labelKey: 'font.lora' },
  system: { family: 'system-ui', googleParam: null, script: 'latin', labelKey: 'font.system' },
  arabic: { family: 'Cairo', googleParam: null, script: 'arabic', labelKey: 'font.arabic' },
  merriweather: {
    family: 'Merriweather',
    googleParam: 'Merriweather:wght@400;700',
    script: 'latin',
    labelKey: 'font.merriweather',
  },
  garamond: {
    family: 'EB Garamond',
    googleParam: 'EB+Garamond:wght@400;500;600;700',
    script: 'latin',
    labelKey: 'font.garamond',
  },
  playfair: {
    family: 'Playfair Display',
    googleParam: 'Playfair+Display:wght@400;500;600;700',
    script: 'latin',
    labelKey: 'font.playfair',
  },
  crimson: {
    family: 'Crimson Pro',
    googleParam: 'Crimson+Pro:wght@400;600;700',
    script: 'latin',
    labelKey: 'font.crimson',
  },
  roboto: {
    family: 'Roboto',
    googleParam: 'Roboto:wght@400;500;700',
    script: 'latin',
    labelKey: 'font.roboto',
  },
  'open-sans': {
    family: 'Open Sans',
    googleParam: 'Open+Sans:wght@400;600;700',
    script: 'latin',
    labelKey: 'font.open-sans',
  },
  nunito: {
    family: 'Nunito Sans',
    googleParam: 'Nunito+Sans:wght@400;600;700',
    script: 'latin',
    labelKey: 'font.nunito',
  },
  'plex-serif': {
    family: 'IBM Plex Serif',
    googleParam: 'IBM+Plex+Serif:wght@400;500;600;700',
    script: 'latin',
    labelKey: 'font.plex-serif',
  },
  'plex-sans': {
    family: 'IBM Plex Sans',
    googleParam: 'IBM+Plex+Sans:wght@400;500;600;700',
    script: 'latin',
    labelKey: 'font.plex-sans',
  },
  mono: {
    family: 'JetBrains Mono',
    googleParam: 'JetBrains+Mono:wght@400;500;700',
    script: 'latin',
    labelKey: 'font.mono',
  },
  tajawal: {
    family: 'Tajawal',
    googleParam: 'Tajawal:wght@400;500;700',
    script: 'arabic',
    labelKey: 'font.tajawal',
  },
  almarai: {
    family: 'Almarai',
    googleParam: 'Almarai:wght@400;700',
    script: 'arabic',
    labelKey: 'font.almarai',
  },
  'amiri-doc': {
    family: 'Amiri',
    googleParam: 'Amiri:wght@400;700',
    script: 'arabic',
    labelKey: 'font.amiri-doc',
  },
  'noto-kufi': {
    family: 'Noto Kufi Arabic',
    googleParam: 'Noto+Kufi+Arabic:wght@400;500;700',
    script: 'arabic',
    labelKey: 'font.noto-kufi',
  },
  readex: {
    family: 'Readex Pro',
    googleParam: 'Readex+Pro:wght@400;500;600',
    script: 'arabic',
    labelKey: 'font.readex',
  },
  'plex-arabic': {
    family: 'IBM Plex Sans Arabic',
    googleParam: 'IBM+Plex+Sans+Arabic:wght@400;500;600;700',
    script: 'arabic',
    labelKey: 'font.plex-arabic',
  },
}

/** Faces available for a script, in catalogue order. */
export function fontsForScript(script: FontScript): DocumentFont[] {
  return (Object.keys(DOC_FONTS) as DocumentFont[]).filter(
    (font) => DOC_FONTS[font].script === script || font === 'system',
  )
}
