/**
 * Shared types for the static marketing layer. The marketing pages are
 * prerendered to plain HTML at build time (vite-react-ssg) and ship without
 * JavaScript, so everything here must be serializable, pure data.
 */

export type MarketingLang = 'en' | 'ar'

/** A string available in both site languages. */
export interface Localized {
  en: string
  ar: string
}

/** Per-page SEO head data. `path` is the canonical path without locale prefix. */
export interface SeoMeta {
  /** ~55–60 chars, unique per page. */
  title: string
  /** ~150 chars, unique per page. */
  description: string
  /** Canonical path, e.g. `/markdown-to-pdf`. Root is `/`. */
  path: string
  /** Primary keyword targeted by the page (documentation + OG image text). */
  keyword?: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface HowToStep {
  name: string
  text: string
}

export interface PageSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface InternalLink {
  label: string
  to: string
}

/** Content model for keyword / use-case landing pages. */
export interface UseCaseContent {
  slug: string
  meta: SeoMeta
  h1: string
  intro: string[]
  /** Rendered as an ordered visual + `HowTo` JSON-LD. */
  howTo: { title: string; steps: HowToStep[] }
  sections: PageSection[]
  faq: FaqItem[]
  /** Internal links to related pages (mesh linking). */
  related: InternalLink[]
  /** Template ids from src/data/templates.ts to feature on the page. */
  templateIds?: string[]
  /** Query string appended to the /app CTA, e.g. `?template=readme`. */
  ctaQuery?: string
  /** Custom CTA label; falls back to the site default. */
  ctaLabel?: string
}

/** Content model for honest comparison pages (/vs/*). */
export interface ComparisonContent {
  slug: string
  meta: SeoMeta
  h1: string
  competitor: string
  intro: string[]
  /** Rows of [dimension, Scripto, competitor]. */
  rows: [string, string, string][]
  verdict: { scripto: string[]; competitor: string[] }
  sections: PageSection[]
  faq: FaqItem[]
  related: InternalLink[]
}

/** Content model for simple informational pages. */
export interface InfoPageContent {
  slug: string
  meta: SeoMeta
  h1: string
  intro: string[]
  sections: PageSection[]
  faq?: FaqItem[]
  related?: InternalLink[]
}

/** Parsed blog post (markdown file + frontmatter). */
export interface BlogPostData {
  slug: string
  title: string
  description: string
  date: string
  readingMinutes: number
  keyword?: string
  body: string
}
