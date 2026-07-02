import { useLocation } from 'react-router-dom'
import { ContentSections, CtaBand, FaqList, PageHero, RelatedLinks } from '../components/blocks'
import { Seo } from '../components/Seo'
import { findInfoPage } from '../content/staticPages'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb, faqPage } from '../seo/jsonld'

export function InfoPage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/\/+$/, '').split('/').pop() ?? ''
  const content = findInfoPage(slug)

  if (!content) {
    throw new Error(`Unknown info route: ${pathname}`)
  }

  const crumbs = [{ name: content.h1.replace(/\.$/, ''), path: content.meta.path }]
  const jsonLd = [breadcrumb([{ name: 'Home', path: '/' }, ...crumbs])]
  if (content.faq) jsonLd.push(faqPage(content.faq))

  return (
    <MarketingLayout lang="en">
      <Seo meta={content.meta} lang="en" jsonLd={jsonLd} />
      <PageHero h1={content.h1} intro={content.intro} breadcrumbs={crumbs} lang="en" />

      <div className="mk-container mk-section-tight">
        <ContentSections sections={content.sections} />
      </div>

      <div className="mk-container">
        {content.faq ? <FaqList items={content.faq} title="Frequently asked questions" /> : null}
        {content.related ? <RelatedLinks links={content.related} title="Keep exploring" /> : null}
        <CtaBand
          lang="en"
          title="See it for yourself."
          lead="The editor is one click away — free, no signup, works offline."
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = InfoPage
