import type {
  HandConfig,
  Margins,
  MarginPreset,
  PageDimensions,
  PaperSize,
  PdfConfig,
} from '@/types'

/** Physical paper dimensions in millimetres (portrait). */
export const PAPER_SIZES: Record<Exclude<PaperSize, 'custom'>, PageDimensions> = {
  a3: { width: 297, height: 420 },
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
  letter: { width: 215.9, height: 279.4 },
  legal: { width: 215.9, height: 355.6 },
}

export const PAPER_LABELS: Record<PaperSize, string> = {
  a3: 'A3',
  a4: 'A4',
  a5: 'A5',
  letter: 'Letter',
  legal: 'Legal',
  custom: 'Custom',
}

/** Margin presets in millimetres. */
export const MARGIN_PRESETS: Record<Exclude<MarginPreset, 'custom'>, Margins> = {
  narrow: { top: 12, right: 12, bottom: 12, left: 12 },
  normal: { top: 20, right: 18, bottom: 20, left: 18 },
  wide: { top: 28, right: 30, bottom: 28, left: 30 },
}

export const STORAGE_KEYS = {
  document: 'scripto:document',
  config: 'scripto:config',
  theme: 'scripto:theme',
  viewMode: 'scripto:view-mode',
  editorTheme: 'scripto:editor-theme',
} as const

/**
 * Handwriting off. Every field still has a value so the UI has something to
 * show the moment it is switched on, but `hand: 'none'` short-circuits the
 * plugin, the stylesheet and the font loader — a user who never touches
 * handwriting downloads nothing for it.
 */
export const DEFAULT_HAND: HandConfig = {
  hand: 'none',
  headingHand: 'same',
  ink: 'ballpoint-blue',
  stationery: 'blank',
  neatness: 0.5,
  slant: 0,
  variation: 'word',
  aging: 0,
  drawnElements: false,
  maskRules: false,
  seed: 1,
}

export const DEFAULT_CONFIG: PdfConfig = {
  paperSize: 'a4',
  orientation: 'portrait',
  customSize: { width: 210, height: 297 },
  marginPreset: 'normal',
  margins: MARGIN_PRESETS.normal,

  font: 'serif',
  fontSize: 11,
  lineHeight: 1.6,
  codeTheme: 'github-dark',
  tableStyle: 'striped',
  skin: 'modern',

  showPageNumbers: true,
  headerText: '',
  footerText: '',
  runningHeaderFromH1: true,
  attribution: true,

  coverPage: false,
  coverStyle: 'minimal',
  tableOfContents: false,
  tocDepth: 3,
  numberedHeadings: false,

  watermarkText: '',
  watermarkOpacity: 0.08,

  hyphenation: false,
  direction: 'auto',
  accentColor: '#6366f1',
  customCss: '',

  hand: DEFAULT_HAND,

  meta: {
    title: 'Untitled Document',
    author: '',
    subject: '',
    keywords: '',
    subtitle: '',
    organization: '',
    date: '',
    version: '',
    docType: '',
  },
}

/** Resolve the effective page dimensions for a config, honouring orientation. */
export function resolvePageDimensions(config: PdfConfig): PageDimensions {
  const base = config.paperSize === 'custom' ? config.customSize : PAPER_SIZES[config.paperSize]

  if (config.orientation === 'landscape') {
    return { width: base.height, height: base.width }
  }
  return base
}

export const FONT_STACKS: Record<PdfConfig['font'], string> = {
  serif: '"Source Serif 4", Georgia, Cambria, serif',
  lora: 'Lora, Georgia, serif',
  sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  arabic: '"Cairo", "Noto Naskh Arabic", "Amiri", "Segoe UI", sans-serif',
  merriweather: "'Merriweather', Georgia, serif",
  garamond: "'EB Garamond', Garamond, Georgia, serif",
  playfair: "'Playfair Display', Georgia, serif",
  crimson: "'Crimson Pro', Georgia, serif",
  roboto: "'Roboto', Helvetica, Arial, sans-serif",
  'open-sans': "'Open Sans', Helvetica, Arial, sans-serif",
  nunito: "'Nunito Sans', Helvetica, Arial, sans-serif",
  'plex-serif': "'IBM Plex Serif', Georgia, serif",
  'plex-sans': "'IBM Plex Sans', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  tajawal: "'Tajawal', 'Noto Naskh Arabic', sans-serif",
  almarai: "'Almarai', 'Noto Naskh Arabic', sans-serif",
  'amiri-doc': "'Amiri', 'Noto Naskh Arabic', serif",
  'noto-kufi': "'Noto Kufi Arabic', 'Noto Naskh Arabic', sans-serif",
  readex: "'Readex Pro', 'Noto Naskh Arabic', sans-serif",
  'plex-arabic': "'IBM Plex Sans Arabic', 'Noto Naskh Arabic', sans-serif",
}
