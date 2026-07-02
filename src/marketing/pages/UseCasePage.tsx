import { useLocation } from 'react-router-dom'
import {
  ContentSections,
  CtaBand,
  FaqList,
  PageHero,
  RelatedLinks,
  StepList,
} from '../components/blocks'
import { Seo } from '../components/Seo'
import { TemplateCards } from '../components/TemplateCards'
import { APP_PATH, chrome, localePath } from '../content/site'
import { findUseCase, useCaseHasArabic } from '../content/use-cases'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb, faqPage, howTo } from '../seo/jsonld'
import type { MarketingLang } from '../types'

/** Resolve `{lang, slug}` from the current pathname (`/x` or `/ar/x`). */
export const parseUseCasePath = (pathname: string): { lang: MarketingLang; slug: string } => {
  const clean = pathname.replace(/\/+$/, '')
  if (clean.startsWith('/ar/')) return { lang: 'ar', slug: clean.slice(4) }
  return { lang: 'en', slug: clean.slice(1) }
}

export function UseCasePage() {
  const { pathname } = useLocation()
  const { lang, slug } = parseUseCasePath(pathname)
  const content = findUseCase(slug, lang)

  if (!content) {
    throw new Error(`Unknown use-case route: ${pathname}`)
  }

  const hasArabic = useCaseHasArabic(slug)
  const altPath = hasArabic ? localePath(lang === 'en' ? 'ar' : 'en', content.meta.path) : undefined
  const ctaHref = `${APP_PATH}${content.ctaQuery ?? ''}`
  const crumbs = [{ name: content.meta.keyword ?? slug, path: localePath(lang, content.meta.path) }]

  return (
    <MarketingLayout lang={lang} altPath={altPath}>
      <Seo
        meta={content.meta}
        lang={lang}
        hasArabic={hasArabic}
        jsonLd={[
          breadcrumb([{ name: chrome('breadcrumb.home', lang), path: localePath(lang, '/') }, ...crumbs]),
          howTo(content.howTo.title, content.howTo.steps),
          faqPage(content.faq),
        ]}
      />
      <PageHero
        h1={content.h1}
        intro={content.intro}
        breadcrumbs={crumbs}
        lang={lang}
        cta={{ label: content.ctaLabel ?? chrome('openAppFree', lang), href: ctaHref }}
      />

      <div className="mk-container mk-section-tight">
        <h2 className="mk-h2" style={{ marginBlockEnd: '1.75rem' }}>
          {content.howTo.title}
        </h2>
        <StepList steps={content.howTo.steps} />
      </div>

      <div className="mk-container mk-section-tight">
        <ContentSections sections={content.sections} />
      </div>

      {content.templateIds && content.templateIds.length > 0 ? (
        <div className="mk-container mk-section-tight">
          <h2 className="mk-h3" style={{ marginBlockEnd: '1.25rem' }}>
            {lang === 'ar' ? 'قوالب جاهزة لهذه المهمة' : 'Templates for this job'}
          </h2>
          <TemplateCards ids={content.templateIds} lang={lang} />
        </div>
      ) : null}

      <div className="mk-container">
        <FaqList items={content.faq} title={lang === 'ar' ? 'أسئلة شائعة' : 'Frequently asked questions'} />
        <RelatedLinks links={content.related} title={lang === 'ar' ? 'أدلة ذات صلة' : 'Related guides'} />
        <CtaBand
          lang={lang}
          title={lang === 'ar' ? 'جرِّبها الآن — مجانًا' : 'Try it now — free'}
          lead={content.meta.description}
          href={ctaHref}
          label={content.ctaLabel}
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = UseCasePage
