import { SKIN_OPTIONS } from '@/data/skins'
import { Breadcrumbs, CtaBand } from '../components/blocks'
import { Seo } from '../components/Seo'
import { APP_PATH } from '../content/site'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb } from '../seo/jsonld'
import type { SeoMeta } from '../types'

const META: SeoMeta = {
  title: 'Document Skins — 20+ Print Styles for Markdown PDFs',
  description:
    'Browse Scripto’s document skins: Swiss grids, editorial serifs, engineering blueprints, terminal green and more. One click restyles your whole PDF.',
  path: '/skins',
  keyword: 'markdown pdf themes',
}

export function SkinsIndexPage() {
  const crumbs = [{ name: 'Skins', path: '/skins' }]

  return (
    <MarketingLayout lang="en">
      <Seo meta={META} lang="en" jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs])]} />
      <div className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
        <Breadcrumbs items={crumbs} lang="en" />
        <h1 className="mk-h1" style={{ marginBlockStart: '1.5rem' }}>
          One document. <span className="mk-gradient-text">Twenty faces.</span>
        </h1>
        <p className="mk-lead" style={{ maxInlineSize: '60ch', marginBlockStart: '1.25rem' }}>
          A skin restyles your entire PDF — typography, rules, spacing, code blocks — without
          touching a character of your Markdown. Every preview below is a real render of the same
          sample document, captured from the app.
        </p>
      </div>

      <div className="mk-container mk-section-tight">
        <div className="mk-grid mk-grid-4">
          {SKIN_OPTIONS.map((skin) => {
            const [name, caption] = skin.label.split(' — ')
            return (
              <a key={skin.value} href={`/skins/${skin.value}`} className="mk-card mk-reveal" style={{ padding: '0.875rem' }}>
                <img
                  className="mk-shot"
                  src={`/screenshots/skin-${skin.value}.jpg`}
                  alt={`${name} skin — real page render`}
                  width={1512}
                  height={1996}
                  loading="lazy"
                />
                <p style={{ marginBlockStart: '0.75rem', fontWeight: 600, fontSize: '0.9375rem' }}>{name}</p>
                <p className="mk-muted" style={{ fontSize: '0.8125rem' }}>
                  {caption}
                </p>
              </a>
            )
          })}
        </div>
      </div>

      <div className="mk-container">
        <CtaBand
          lang="en"
          title="Try them on your own document."
          lead="Open the editor, paste your Markdown and cycle through every skin live."
          href={APP_PATH}
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = SkinsIndexPage
