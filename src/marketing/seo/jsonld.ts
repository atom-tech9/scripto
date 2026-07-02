import { ATOM_URL, GITHUB_URL, SITE_NAME, SITE_URL, absoluteUrl } from '../content/site'
import type { BlogPostData, FaqItem, HowToStep } from '../types'

/** A JSON-LD node. Kept loose on purpose — schema.org is open-ended. */
export type JsonLdNode = Record<string, unknown>

export const organization = (): JsonLdNode => ({
  '@type': 'Organization',
  '@id': `${ATOM_URL}/#organization`,
  name: 'Atom',
  url: ATOM_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/atom-logo.png`,
    width: 600,
    height: 237,
  },
})

export const webSite = (): JsonLdNode => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  description: 'Free, open-source Markdown to PDF converter that runs 100% in your browser.',
  inLanguage: ['en', 'ar'],
  publisher: { '@id': `${ATOM_URL}/#organization` },
})

export const softwareApplication = (): JsonLdNode => ({
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: SITE_NAME,
  url: `${SITE_URL}/app`,
  applicationCategory: 'Productivity',
  operatingSystem: 'Any (web browser)',
  browserRequirements: 'Requires a modern browser with JavaScript enabled',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description:
    'Markdown editor with pixel-perfect paginated PDF export: running headers and footers, page numbers, cover page, table of contents, 20+ skins, KaTeX math, Mermaid diagrams, full Arabic/RTL support, offline PWA — all client-side.',
  featureList: [
    'Paginated PDF export with running headers, footers and page numbers',
    'Cover page and table of contents generation',
    '20+ document skins and 50+ templates',
    'KaTeX math and Mermaid diagrams',
    'Arabic and right-to-left documents',
    'Offline-capable PWA, zero-knowledge privacy',
  ],
  screenshot: `${SITE_URL}/api/og?title=${encodeURIComponent('Scripto — Markdown to PDF studio')}`,
  softwareHelp: `${SITE_URL}/getting-started`,
  isAccessibleForFree: true,
  license: `${GITHUB_URL}/blob/main/LICENSE`,
  author: { '@id': `${ATOM_URL}/#organization` },
})

export const breadcrumb = (items: { name: string; path: string }[]): JsonLdNode => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

export const faqPage = (items: FaqItem[]): JsonLdNode => ({
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
})

export const howTo = (title: string, steps: HowToStep[]): JsonLdNode => ({
  '@type': 'HowTo',
  name: title,
  totalTime: 'PT2M',
  estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: 0 },
  tool: [{ '@type': 'HowToTool', name: 'Scripto (free web app)' }],
  step: steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
})

export const blogPosting = (post: BlogPostData): JsonLdNode => ({
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  dateModified: post.date,
  inLanguage: 'en',
  url: absoluteUrl(`/blog/${post.slug}`),
  mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  author: { '@id': `${ATOM_URL}/#organization` },
  publisher: { '@id': `${ATOM_URL}/#organization` },
  image: `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&tag=Blog`,
})

/** Wrap nodes into a single `@graph` document. */
export const jsonLdDocument = (nodes: JsonLdNode[]): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
})

/** Serialize for a <script> tag; `<` escaped to prevent tag breakout. */
export const serializeJsonLd = (nodes: JsonLdNode[]): string =>
  JSON.stringify(jsonLdDocument(nodes)).replace(/</g, '\\u003c')
