import { Head } from 'vite-react-ssg'
import { SKIN_OPTIONS } from '@/data/skins'
import { TEMPLATES } from '@/data/templates'
import { translate } from '@/lib/i18n'
import { CtaBand, FaqList, SectionHeader } from '../components/blocks'
import { Seo } from '../components/Seo'
import { SkinThumb } from '../components/SkinThumb'
import { LANDING } from '../content/landing'
import { APP_PATH, GITHUB_URL, chrome } from '../content/site'
import { MarketingLayout } from '../layout/MarketingLayout'
import { faqPage, softwareApplication } from '../seo/jsonld'
import type { MarketingLang } from '../types'

/**
 * Returning-visitor redirect: people who already use the editor (they have
 * Scripto documents in localStorage) land on the app, not the marketing page.
 * `?home` or an explicit in-app "home" click (sessionStorage flag) opts out.
 */
const RETURNING_USER_REDIRECT =
  "(function(){try{if(new URLSearchParams(location.search).has('home')){sessionStorage.setItem('scripto:stay','1');return}if(sessionStorage.getItem('scripto:stay'))return;if(localStorage.getItem('scripto:library')||localStorage.getItem('scripto:document')){location.replace('/app'+location.hash)}}catch(e){}})();"

const SHOWCASE_SKINS = ['modern', 'editorial', 'swiss', 'terminal', 'newsprint', 'blueprint', 'brutalist', 'elegant']
const SHOWCASE_TEMPLATES = ['readme', 'resume', 'invoice', 'proposal', 'meeting', 'changelog', 'academic', 'prd']

const EDITOR_SNIPPET = {
  en: (
    <>
      <span className="tok-h"># Q3 Product Report</span>
      {'\n'}
      <span className="tok-punct">{'>'}</span> <span className="tok-quote">Preview === PDF. Always.</span>
      {'\n\n'}
      Prepared for <span className="tok-em">**Atom**</span> — October 2026{'\n\n'}
      <span className="tok-h">## Highlights</span>
      {'\n'}
      <span className="tok-punct">-</span> Running headers &amp; page numbers{'\n'}
      <span className="tok-punct">-</span> Cover page + clickable TOC{'\n'}
      <span className="tok-punct">-</span> <span className="tok-code">`mermaid`</span> diagrams &amp;{' '}
      <span className="tok-code">$E = mc^2$</span>
    </>
  ),
  ar: (
    <>
      <span className="tok-h"># تقرير الربع الثالث</span>
      {'\n'}
      <span className="tok-punct">{'>'}</span> <span className="tok-quote">المعاينة === PDF. دائمًا.</span>
      {'\n\n'}
      أُعدَّ لصالح <span className="tok-em">**Atom**</span> — أكتوبر ٢٠٢٦{'\n\n'}
      <span className="tok-h">## أبرز النقاط</span>
      {'\n'}
      <span className="tok-punct">-</span> ترويسات متكررة وأرقام صفحات{'\n'}
      <span className="tok-punct">-</span> غلاف وفهرس قابل للنقر{'\n'}
      <span className="tok-punct">-</span> مخططات <span className="tok-code">`mermaid`</span> ومعادلات{' '}
      <span className="tok-code">$E = mc^2$</span>
    </>
  ),
}

export function Landing({ lang }: { lang: MarketingLang }) {
  const c = LANDING[lang]
  const altPath = lang === 'en' ? '/ar' : '/'

  return (
    <MarketingLayout lang={lang} altPath={altPath}>
      <Seo
        meta={c.meta}
        lang={lang}
        hasArabic
        ogTag={lang === 'ar' ? 'ماركداون → PDF' : 'Markdown → PDF'}
        jsonLd={[softwareApplication(), faqPage(c.faq.items)]}
      />
      <Head>
        <script>{RETURNING_USER_REDIRECT}</script>
      </Head>

      {/* ---------- hero ---------- */}
      <section className="mk-container mk-section" style={{ paddingBlockStart: 'clamp(3.5rem, 8vw, 6.5rem)' }}>
        <div style={{ maxInlineSize: '52rem', marginInline: 'auto', textAlign: 'center' }}>
          <p className="mk-eyebrow">{c.eyebrow}</p>
          <h1 className="mk-h1" style={{ marginBlockStart: '1.25rem' }}>
            {c.h1Top} <span className="mk-gradient-text">{c.h1Gradient}</span>
          </h1>
          <p className="mk-lead" style={{ marginBlockStart: '1.5rem', marginInline: 'auto', maxInlineSize: '46rem' }}>
            {c.sub}
          </p>
          <div style={{ marginBlockStart: '2.25rem', display: 'flex', justifyContent: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
            <a href={APP_PATH} className="mk-btn mk-btn-primary mk-btn-lg">
              {c.ctaPrimary}
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener" className="mk-btn mk-btn-ghost mk-btn-lg">
              {c.ctaSecondary}
            </a>
          </div>
          <p className="mk-muted" style={{ marginBlockStart: '1.25rem', fontSize: '0.9375rem' }}>
            {c.trustLine}
          </p>
        </div>

        <div className="mk-hero-visual mk-reveal">
          <div className="mk-editor-mock" aria-hidden="true">
            <div className="mk-editor-chrome">
              <i /> <i /> <i />
              <span>{c.editorFileName}</span>
            </div>
            <div className="mk-editor-code">{EDITOR_SNIPPET[lang]}</div>
          </div>
          <div className="mk-hero-arrow" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="mk-page-mock" aria-hidden="true">
              <div className="mk-page-running">
                <span>{lang === 'ar' ? 'تقرير الربع الثالث' : 'Q3 Product Report'}</span>
                <span>Atom</span>
              </div>
              <div className="mk-page-title">{lang === 'ar' ? 'تقرير الربع الثالث' : 'Q3 Product Report'}</div>
              <div className="mk-page-lines" />
              <div className="mk-page-footer">
                <span>Scripto</span>
                <span>1 / 12</span>
              </div>
            </div>
            <span className="mk-float-chip" style={{ insetBlockStart: '-0.875rem', insetInlineEnd: '-0.5rem' }}>
              ∑ KaTeX
            </span>
            <span className="mk-float-chip" style={{ insetBlockEnd: '18%', insetInlineStart: '-1.25rem' }}>
              🌍 {lang === 'ar' ? 'عربي · RTL' : 'Arabic · RTL'}
            </span>
            <span className="mk-float-chip" style={{ insetBlockEnd: '-0.875rem', insetInlineEnd: '10%' }}>
              🎨 {lang === 'ar' ? '+٢٠ تصميمًا' : '20+ skins'}
            </span>
          </div>
        </div>
      </section>

      {/* ---------- moat ---------- */}
      <section className="mk-container mk-section-tight">
        <SectionHeader title={c.moat.title} lead={c.moat.lead} center />
        <div className="mk-grid mk-grid-3">
          {c.moat.cards.map((card, index) => (
            <article key={card.title} className="mk-card mk-reveal" style={{ ['--d' as string]: `${index * 90}ms` }}>
              <h3 className="mk-h3">{card.title}</h3>
              <p className="mk-muted" style={{ marginBlockStart: '0.625rem', lineHeight: 1.7 }}>
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section className="mk-container mk-section">
        <SectionHeader title={c.features.title} lead={c.features.lead} center />
        <div className="mk-grid mk-grid-4">
          {c.features.items.map((feature, index) => (
            <article key={feature.title} className="mk-card mk-reveal" style={{ ['--d' as string]: `${(index % 4) * 80}ms` }}>
              <span className="mk-card-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="mk-h3">{feature.title}</h3>
              <p className="mk-muted" style={{ marginBlockStart: '0.5rem', fontSize: '0.9375rem', lineHeight: 1.65 }}>
                {feature.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- skins showcase ---------- */}
      <section className="mk-container mk-section-tight">
        <SectionHeader title={c.skins.title} lead={c.skins.lead} />
        <div className="mk-strip mk-reveal">
          {SHOWCASE_SKINS.map((skinId) => {
            const skin = SKIN_OPTIONS.find((option) => option.value === skinId)
            if (!skin) return null
            const label = lang === 'ar' ? translate('ar', skin.labelKey) : skin.label
            const [name, caption] = label.split(' — ')
            return (
              <a key={skinId} href={`/skins/${skinId}`} className="mk-card" style={{ padding: '0.875rem' }}>
                <SkinThumb skin={skinId} title={name} />
                <p style={{ marginBlockStart: '0.75rem', fontWeight: 600, fontSize: '0.9375rem' }}>{name}</p>
                <p className="mk-muted" style={{ fontSize: '0.8125rem' }}>
                  {caption}
                </p>
              </a>
            )
          })}
        </div>
        <p style={{ marginBlockStart: '1.5rem' }}>
          <a href="/skins" className="mk-btn mk-btn-ghost mk-btn-md">
            {c.skins.linkLabel} →
          </a>
        </p>
      </section>

      {/* ---------- templates ---------- */}
      <section className="mk-container mk-section-tight">
        <SectionHeader title={c.templates.title} lead={c.templates.lead} />
        <div className="mk-grid mk-grid-4">
          {SHOWCASE_TEMPLATES.map((templateId) => {
            const template = TEMPLATES.find((entry) => entry.id === templateId)
            if (!template) return null
            const name = lang === 'ar' && template.nameKey ? translate('ar', template.nameKey) : template.name
            const description = lang === 'ar' && template.descKey ? translate('ar', template.descKey) : template.description
            return (
              <a key={templateId} href={`/templates/${templateId}`} className="mk-card mk-reveal">
                <span className="mk-tpl-emoji" aria-hidden="true">
                  {template.emoji}
                </span>
                <h3 className="mk-h3">{name}</h3>
                <p className="mk-muted" style={{ marginBlockStart: '0.375rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {description}
                </p>
              </a>
            )
          })}
        </div>
        <p style={{ marginBlockStart: '1.5rem' }}>
          <a href="/templates" className="mk-btn mk-btn-ghost mk-btn-md">
            {c.templates.linkLabel} →
          </a>
        </p>
      </section>

      {/* ---------- use cases ---------- */}
      <section className="mk-container mk-section-tight">
        <SectionHeader title={c.useCases.title} lead={c.useCases.lead} />
        <div className="mk-grid mk-grid-3">
          {c.useCases.cards.map((card) => (
            <a key={card.to} href={card.to} className="mk-card mk-reveal">
              <h3 className="mk-h3">{card.title}</h3>
              <p className="mk-muted" style={{ marginBlockStart: '0.5rem', lineHeight: 1.65 }}>
                {card.text}
              </p>
              <p style={{ marginBlockStart: '0.875rem', color: 'var(--mk-accent-fg)', fontWeight: 550, fontSize: '0.9375rem' }}>
                {lang === 'ar' ? 'اقرأ الدليل ←' : 'Read the guide →'}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- privacy ---------- */}
      <section className="mk-container mk-section-tight">
        <div className="mk-card mk-reveal" style={{ padding: 'clamp(2rem, 5vw, 3.5rem)' }}>
          <div style={{ maxInlineSize: '56rem' }}>
            <h2 className="mk-h2">{c.privacy.title}</h2>
            <p className="mk-lead" style={{ marginBlockStart: '0.875rem' }}>
              {c.privacy.lead}
            </p>
            <ul style={{ marginBlockStart: '1.5rem', display: 'grid', gap: '0.75rem' }}>
              {c.privacy.points.map((point) => (
                <li key={point.slice(0, 24)} style={{ display: 'flex', gap: '0.75rem', color: 'var(--mk-soft)', lineHeight: 1.65 }}>
                  <span aria-hidden="true" style={{ color: 'var(--mk-success)' }}>
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <p style={{ marginBlockStart: '1.5rem' }}>
              <a href="/privacy" className="mk-chip">
                {chrome('footer.privacy', lang)} →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ + final CTA ---------- */}
      <div className="mk-container">
        <FaqList items={c.faq.items} title={c.faq.title} />
        <CtaBand lang={lang} title={c.finalCta.title} lead={c.finalCta.lead}>
          <a href="/getting-started" className="mk-btn mk-btn-ghost mk-btn-lg">
            {chrome('nav.gettingStarted', lang)}
          </a>
        </CtaBand>
      </div>
    </MarketingLayout>
  )
}

export function LandingEn() {
  return <Landing lang="en" />
}

export function LandingAr() {
  return <Landing lang="ar" />
}
