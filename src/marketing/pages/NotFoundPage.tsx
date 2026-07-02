import { Seo } from '../components/Seo'
import { APP_PATH } from '../content/site'
import { MarketingLayout } from '../layout/MarketingLayout'

export function NotFoundPage() {
  return (
    <MarketingLayout lang="en">
      <Seo
        meta={{
          title: 'Page Not Found — Scripto',
          description: 'That page doesn’t exist. The Markdown → PDF editor and all guides are one click away.',
          path: '/404',
        }}
        lang="en"
        noindex
      />
      <div className="mk-container mk-section" style={{ textAlign: 'center', paddingBlock: 'clamp(6rem, 14vw, 10rem)' }}>
        <p className="mk-eyebrow">404</p>
        <h1 className="mk-h1" style={{ marginBlockStart: '1.25rem' }}>
          This page went <span className="mk-gradient-text">off the grid.</span>
        </h1>
        <p className="mk-lead" style={{ marginBlockStart: '1.25rem', marginInline: 'auto', maxInlineSize: '44ch' }}>
          The link may be old or mistyped. Everything worth finding is below.
        </p>
        <div style={{ marginBlockStart: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href={APP_PATH} className="mk-btn mk-btn-primary mk-btn-lg">
            Open the editor
          </a>
          <a href="/" className="mk-btn mk-btn-ghost mk-btn-lg">
            Home
          </a>
          <a href="/templates" className="mk-btn mk-btn-ghost mk-btn-lg">
            Templates
          </a>
        </div>
      </div>
    </MarketingLayout>
  )
}

export const Component = NotFoundPage
