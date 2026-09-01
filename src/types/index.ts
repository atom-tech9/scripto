/**
 * Shared domain types for the Scripto Markdown → PDF application.
 * Public, reusable models live here so feature modules stay decoupled.
 */

export type ThemeMode = 'light' | 'dark' | 'system'

export type ResolvedTheme = 'light' | 'dark'

export type ViewMode = 'split' | 'editor' | 'preview'

export type PaperSize = 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom'

export type Orientation = 'portrait' | 'landscape'

export type DocumentFont =
  | 'serif'
  | 'sans'
  | 'lora'
  | 'system'
  | 'arabic'
  | 'merriweather'
  | 'garamond'
  | 'playfair'
  | 'crimson'
  | 'roboto'
  | 'open-sans'
  | 'nunito'
  | 'plex-serif'
  | 'plex-sans'
  | 'mono'
  | 'tajawal'
  | 'almarai'
  | 'amiri-doc'
  | 'noto-kufi'
  | 'readex'
  | 'plex-arabic'

export type TextDirection = 'auto' | 'ltr' | 'rtl'

export type UiLanguage = 'en' | 'ar'

export type CodeTheme = 'github-light' | 'github-dark' | 'dracula' | 'nord'

export type TableStyle = 'lines' | 'striped' | 'minimal' | 'boxed'

export type DocumentSkin =
  | 'modern'
  | 'classic'
  | 'editorial'
  | 'technical'
  | 'compact'
  | 'manuscript'
  | 'blueprint'
  | 'corporate'
  | 'brutalist'
  | 'notebook'
  | 'resume'
  | 'swiss'
  | 'terminal'
  | 'newsprint'
  | 'elegant'
  | 'playful'
  | 'dark'
  | 'ledger'
  | 'zen'
  | 'memo'
  | 'poster'
  | 'invoice'
  | 'contract'
  | 'letter'
  | 'journal'
  | 'thesis'
  | 'changelog'
  | 'rfc'
  | 'handout'
  | 'handwritten'
  | 'journal-hand'
  | 'field-notes'
  | 'chalkboard'
  | 'letter-hand'
  | 'worksheet'

/**
 * The handwriting axis. Deliberately not a skin: handwriting is
 * hand x ink x stationery x neatness x slant x variation x aging, which would
 * need dozens of skin entries. As its own axis it composes with all of them.
 */
export type HandStyle =
  | 'none'
  // Latin — everyday
  | 'casual'
  | 'neat-print'
  | 'architect'
  | 'marker'
  | 'scratchy'
  | 'rushed'
  // Latin — expressive
  | 'script'
  | 'copperplate'
  | 'monoline'
  | 'cursive'
  | 'chalk'
  // Arabic
  | 'ruqaa'
  | 'naskh-hand'
  | 'diwani'
  | 'amiri'
  | 'scheherazade'
  | 'katibeh'
  | 'nastaliq'
  | 'gulzar'
  | 'harmattan'
  | 'rakkas'
  // User-supplied (see the handwriting brief §7)
  | 'custom'

export type InkStyle =
  | 'ballpoint-blue'
  | 'ballpoint-black'
  | 'fountain-blue'
  | 'fountain-black'
  | 'pencil'
  | 'marker'
  | 'red-pen'
  | 'gel'
  | 'chalk-white'
  | 'sepia'

export type Stationery =
  | 'blank'
  | 'ruled-college'
  | 'ruled-wide'
  | 'ruled-narrow'
  | 'graph'
  | 'dot-grid'
  | 'isometric'
  | 'legal-pad'
  | 'engineering'
  | 'cornell'
  | 'index-card'
  | 'steno'
  | 'practice-lines'
  | 'music-staff'
  | 'parchment'
  | 'kraft'
  | 'graph-blue'

/** How far the variation engine goes. Higher tiers cost DOM weight. */
export type HandVariation = 'none' | 'word' | 'expressive'

export interface HandConfig {
  readonly hand: HandStyle
  /**
   * Which imported or drawn hand `hand: 'custom'` refers to. Ignored for every
   * built-in hand, so a document that never used one carries nothing extra.
   */
  readonly customHand?: string
  /** A second hand for headings — real notes title more carefully than they write. */
  readonly headingHand: HandStyle | 'same'
  readonly ink: InkStyle
  readonly stationery: Stationery
  /** 0 = careful and even, 1 = rushed and messy. Scales every jitter amplitude. */
  readonly neatness: number
  /** -1 = left-handed back-slant, 0 = upright, 1 = strong right lean. */
  readonly slant: number
  readonly variation: HandVariation
  /** 0 = fresh, 1 = yellowed paper, faded ink, fold creases. */
  readonly aging: number
  /** Hand-drawn rules, bullets, checkboxes, underlines and table borders. */
  readonly drawnElements: boolean
  /**
   * Hide the paper's rules behind heading text. Off by default: rules running
   * behind a heading is what ruled paper actually looks like, and masking them
   * only reads well on some papers.
   */
  readonly maskRules: boolean
  /** A stable seed, so the jitter never changes under the same document. */
  readonly seed: number
}

export type MarginPreset = 'narrow' | 'normal' | 'wide' | 'custom'

/** Physical page dimensions expressed in millimetres. */
export interface PageDimensions {
  readonly width: number
  readonly height: number
}

/** Page margins in millimetres. */
export interface Margins {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface DocumentMeta {
  readonly title: string
  readonly author: string
  readonly subject: string
  readonly keywords: string
  /** Cover page fields (all optional; empty = not shown). */
  readonly subtitle: string
  readonly organization: string
  /** Custom cover date; empty falls back to today. */
  readonly date: string
  readonly version: string
  /** Small label above the title, e.g. "Report" or "Proposal". */
  readonly docType: string
}

/** Visual layout used for the generated cover page. */
export type CoverStyle = 'minimal' | 'banner' | 'centered'

/**
 * The complete, serialisable export configuration. Persisted to localStorage and
 * consumed by the Paged.js export engine. Treated as immutable everywhere.
 */
export interface PdfConfig {
  readonly paperSize: PaperSize
  readonly orientation: Orientation
  readonly customSize: PageDimensions
  readonly marginPreset: MarginPreset
  readonly margins: Margins

  readonly font: DocumentFont
  readonly fontSize: number
  readonly lineHeight: number
  readonly codeTheme: CodeTheme
  readonly tableStyle: TableStyle
  readonly skin: DocumentSkin

  readonly showPageNumbers: boolean
  readonly headerText: string
  readonly footerText: string
  readonly runningHeaderFromH1: boolean
  /** Small "Made with Scripto · by Atom" line in the PDF footer (opt-out). */
  readonly attribution: boolean

  readonly coverPage: boolean
  readonly coverStyle: CoverStyle
  readonly tableOfContents: boolean
  readonly tocDepth: number
  readonly numberedHeadings: boolean

  readonly watermarkText: string
  readonly watermarkOpacity: number

  readonly hyphenation: boolean
  readonly direction: TextDirection
  readonly accentColor: string
  readonly customCss: string

  /** The handwriting axis. `hand: 'none'` must stay a total no-op. */
  readonly hand: HandConfig

  readonly meta: DocumentMeta
}

/** A user-saved bundle of look-and-feel settings — a reusable house style. */
export interface ExportPreset {
  readonly id: string
  readonly name: string
  /** The presentation half of a `PdfConfig`; never carries document `meta`. */
  readonly config: Partial<PdfConfig>
  readonly createdAt: number
}

export interface ExportProgress {
  readonly stage:
    'idle' | 'preparing' | 'rendering' | 'paginating' | 'finalizing' | 'done' | 'error'
  readonly message: string
  readonly percent: number
}

export interface TocEntry {
  readonly id: string
  readonly text: string
  readonly depth: number
}

/** A single document in the local library. */
export interface DocumentRecord {
  readonly id: string
  readonly content: string
  readonly config: PdfConfig
  readonly createdAt: number
  readonly updatedAt: number
}

export interface DocumentLibrary {
  readonly docs: DocumentRecord[]
  readonly activeId: string
}
