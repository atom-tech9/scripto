import { useLocation } from 'react-router-dom'
import { ContentSections, CtaBand, FaqList, PageHero, RelatedLinks } from '../components/blocks'
import { Seo } from '../components/Seo'
import { COMPARISONS, findComparison } from '../content/comparisons'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb, faqPage } from '../seo/jsonld'

export function ComparePage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/\/+$/, '').split('/').pop() ?? ''
  const content = findComparison(slug)

  if (!content) {
    throw new Error(`Unknown comparison route: ${pathname}`)
  }

  const crumbs = [{ name: `Scripto vs ${content.competitor}`, path: content.meta.path }]

  return (
    <MarketingLayout lang="en">
      <Seo
        meta={content.meta}
        lang="en"
        jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs]), faqPage(content.faq)]}
      />
      <PageHero h1={content.h1} intro={content.intro} breadcrumbs={crumbs} lang="en" />

      <div className="mk-container mk-section-tight">
        <div style={{ overflowX: 'auto' }} className="mk-reveal">
          <table className="mk-vs-table">
            <thead>
              <tr>
                <th style={{ inlineSize: '24%' }}>Dimension</th>
                <th>Scripto</th>
                <th>{content.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {content.rows.map(([dimension, scripto, competitor]) => (
                <tr key={dimension}>
                  <td>{dimension}</td>
                  <td>{scripto}</td>
                  <td>{competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mk-container mk-section-tight">
        <div className="mk-grid mk-grid-2">
          <div className="mk-card mk-reveal" style={{ borderColor: 'var(--mk-accent-border)' }}>
            <h2 className="mk-h3">Choose Scripto when…</h2>
            <ul className="mk-prose" style={{ marginBlockStart: '0.75rem' }}>
              {content.verdict.scripto.map((point) => (
                <li key={point.slice(0, 32)}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="mk-card mk-reveal">
            <h2 className="mk-h3">Choose {content.competitor} when…</h2>
            <ul className="mk-prose" style={{ marginBlockStart: '0.75rem' }}>
              {content.verdict.competitor.map((point) => (
                <li key={point.slice(0, 32)}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mk-container mk-section-tight">
        <ContentSections sections={content.sections} />
      </div>

      <div className="mk-container">
        <FaqList items={content.faq} title="Frequently asked questions" />
        <RelatedLinks links={content.related} title="Related" />
        <CtaBand
          lang="en"
          title="Judge the output yourself."
          lead="Paste one of your real documents into Scripto and export the PDF — it takes under a minute."
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = ComparePage

export const getStaticPaths = (): string[] =>
  COMPARISONS.map((comparison) => `vs/${comparison.slug}`)

// Branded 404 for unmatched slugs reached via client-side navigation.
export { NotFoundPage as ErrorBoundary } from './NotFoundPage'
