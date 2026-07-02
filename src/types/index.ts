/**
 * Shared domain types for the Scripto Markdown → PDF application.
 * Public, reusable models live here so feature modules stay decoupled.
 */

export type ThemeMode = 'light' | 'dark' | 'system'

export type ResolvedTheme = 'light' | 'dark'

export type ViewMode = 'split' | 'editor' | 'preview'

export type PaperSize = 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom'

export type Orientation = 'portrait' | 'landscape'

export type DocumentFont = 'serif' | 'sans' | 'lora' | 'system' | 'arabic'

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

  readonly meta: DocumentMeta
}

export interface ExportProgress {
  readonly stage: 'idle' | 'preparing' | 'rendering' | 'paginating' | 'finalizing' | 'done' | 'error'
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
