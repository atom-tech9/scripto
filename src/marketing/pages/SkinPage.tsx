import { useLocation } from 'react-router-dom'
import { SKIN_OPTIONS } from '@/data/skins'
import { Breadcrumbs, CtaBand, StepList } from '../components/blocks'
import { Seo } from '../components/Seo'
import { APP_PATH } from '../content/site'
import { SKIN_BLURBS } from '../content/skinBlurbs'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb, howTo } from '../seo/jsonld'

export function SkinPage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/\/+$/, '').split('/').pop() ?? ''
  const skin = SKIN_OPTIONS.find((option) => option.value === slug)

  if (!skin) {
    throw new Error(`Unknown skin route: ${pathname}`)
  }

  const [name, caption] = skin.label.split(' — ')
  const blurb = SKIN_BLURBS[skin.value] ?? { voice: caption, bestFor: 'Any Markdown document.' }
  const meta = {
    title: `${name} Skin — ${caption ?? 'Markdown PDF Style'} | Scripto`,
    description: `The ${name} document skin for Markdown → PDF: ${blurb.voice} Free, applied with one click in Scripto.`,
    path: `/skins/${skin.value}`,
    keyword: `${name.toLowerCase()} pdf style`,
  }
  const steps = [
    { name: 'Open your document in Scripto', text: 'Paste Markdown or pick a template — the paginated preview appears instantly.' },
    { name: `Select the ${name} skin`, text: 'Open document settings → Skin, or browse the visual theme gallery.' },
    { name: 'Export the PDF', text: 'The exported file matches the preview exactly — typography, rules and all.' },
  ]
  const related = SKIN_OPTIONS.filter((option) => option.value !== skin.value).slice(0, 6)
  const crumbs = [
    { name: 'Skins', path: '/skins' },
    { name, path: meta.path },
  ]

  return (
    <MarketingLayout lang="en">
      <Seo
        meta={meta}
        lang="en"
        ogTag="Skin"
        jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs]), howTo(`How to apply the ${name} skin`, steps)]}
      />
      <div className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
        <Breadcrumbs items={crumbs} lang="en" />
        <div className="mk-grid mk-grid-2" style={{ marginBlockStart: '2rem', alignItems: 'center', gap: '3rem' }}>
          <div>
            <h1 className="mk-h1" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)' }}>
              The <span className="mk-gradient-text">{name}</span> skin.
            </h1>
            <p className="mk-lead" style={{ marginBlockStart: '1.25rem' }}>
              {blurb.voice}
            </p>
            <p className="mk-muted" style={{ marginBlockStart: '1rem', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--mk-fg)' }}>Best for:</strong> {blurb.bestFor}
            </p>
            <div style={{ marginBlockStart: '1.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={`${APP_PATH}?skin=${skin.value}`} className="mk-btn mk-btn-primary mk-btn-lg">
                Use the {name} skin
              </a>
              <a href="/skins" className="mk-btn mk-btn-ghost mk-btn-lg">
                All skins
              </a>
            </div>
          </div>
          <div style={{ maxInlineSize: '24rem', marginInline: 'auto', inlineSize: '100%' }} className="mk-reveal">
            {/* Real render of the sample document in this skin (captured from the app). */}
            <img
              className="mk-shot"
              src={`/screenshots/skin-${skin.value}.jpg`}
              alt={`The sample document rendered with the ${name} skin`}
              width={1512}
              height={1996}
              loading="eager"
            />
          </div>
        </div>
      </div>

      <div className="mk-container mk-section-tight">
        <h2 className="mk-h2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', marginBlockEnd: '1.5rem' }}>
          How to apply it
        </h2>
        <StepList steps={steps} />
        <p className="mk-muted" style={{ marginBlockStart: '1.25rem', maxInlineSize: '65ch', lineHeight: 1.7 }}>
          Skins are pure print styling: switching between them never alters your Markdown, and you
          can layer per-document custom CSS on top for fine-tuning. The page above is a real render
          of the sample document in this skin — open the editor to see it live on your own text.
        </p>
      </div>

      <div className="mk-container mk-section-tight">
        <h2 className="mk-h3" style={{ marginBlockEnd: '1.25rem' }}>
          More skins to try
        </h2>
        <div className="mk-strip">
          {related.map((option) => {
            const [relatedName] = option.label.split(' — ')
            return (
              <a key={option.value} href={`/skins/${option.value}`} className="mk-card" style={{ padding: '0.875rem' }}>
                <img
                  className="mk-shot"
                  src={`/screenshots/skin-${option.value}.jpg`}
                  alt={`${relatedName} skin — real page render`}
                  width={1512}
                  height={1996}
                  loading="lazy"
                />
                <p style={{ marginBlockStart: '0.625rem', fontWeight: 600, fontSize: '0.875rem' }}>{relatedName}</p>
              </a>
            )
          })}
        </div>
      </div>

      <div className="mk-container">
        <CtaBand
          lang="en"
          title={`See ${name} on your own document.`}
          lead="Paste your Markdown, apply the skin, export — under a minute, free."
          href={`${APP_PATH}?skin=${skin.value}`}
          label={`Open Scripto with ${name}`}
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = SkinPage

export const getStaticPaths = (): string[] =>
  SKIN_OPTIONS.map((option) => `skins/${option.value}`)

// Branded 404 for unmatched slugs reached via client-side navigation.
export { NotFoundPage as ErrorBoundary } from './NotFoundPage'
