import { Head } from 'vite-react-ssg'
import {
  DEFAULT_OG_TITLE,
  OG_IMAGE_ENDPOINT,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  localePath,
} from '../content/site'
import { organization, serializeJsonLd, webSite, type JsonLdNode } from '../seo/jsonld'
import type { MarketingLang, SeoMeta } from '../types'

interface SeoProps {
  meta: SeoMeta
  lang: MarketingLang
  /** Page exists in both languages → emit the full hreflang cluster. */
  hasArabic?: boolean
  /** Extra JSON-LD nodes (Organization + WebSite are always included). */
  jsonLd?: JsonLdNode[]
  noindex?: boolean
  /** OG card type; blog posts use `article`. */
  ogType?: 'website' | 'article'
  /** ISO date for `article:published_time`. */
  articleDate?: string
  /** Short label rendered on the generated OG image. */
  ogTag?: string
}

const ogImageUrl = (title: string, tag: string | undefined, lang: MarketingLang): string => {
  const params = new URLSearchParams({ title })
  if (tag) params.set('tag', tag)
  if (lang === 'ar') params.set('lang', 'ar')
  return `${SITE_URL}${OG_IMAGE_ENDPOINT}?${params.toString()}`
}

/**
 * Per-page head manager for the static marketing pages. Everything rendered
 * here lands in the prerendered HTML (react-helmet via vite-react-ssg), so
 * crawlers see it without executing JavaScript.
 */
export function Seo({
  meta,
  lang,
  hasArabic = false,
  jsonLd = [],
  noindex = false,
  ogType = 'website',
  articleDate,
  ogTag,
}: SeoProps) {
  const canonical = absoluteUrl(localePath(lang, meta.path))
  const image = ogImageUrl(meta.title || DEFAULT_OG_TITLE, ogTag ?? meta.keyword, lang)
  const graph = serializeJsonLd([organization(), webSite(), ...jsonLd])

  return (
    <Head>
      <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="dark" />
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonical} />
      {noindex ? <meta name="robots" content="noindex, follow" /> : null}
      <meta name="author" content="Atom" />
      <meta name="publisher" content="Atom" />

      {hasArabic ? <link rel="alternate" hrefLang="en" href={absoluteUrl(meta.path)} /> : null}
      {hasArabic ? (
        <link rel="alternate" hrefLang="ar" href={absoluteUrl(localePath('ar', meta.path))} />
      ) : null}
      {hasArabic ? (
        <link rel="alternate" hrefLang="x-default" href={absoluteUrl(meta.path)} />
      ) : null}

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_SA' : 'en_US'} />
      {ogType === 'article' && articleDate ? (
        <meta property="article:published_time" content={articleDate} />
      ) : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={image} />

      <script type="application/ld+json">{graph}</script>
    </Head>
  )
}
