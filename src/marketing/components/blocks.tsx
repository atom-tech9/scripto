import type { ReactNode } from 'react'
import { APP_PATH, chrome, localePath } from '../content/site'
import type { FaqItem, HowToStep, InternalLink, MarketingLang, PageSection } from '../types'

/* ------------------------------------------------------------------ */

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  lead?: string
  center?: boolean
}

export function SectionHeader({ eyebrow, title, lead, center = false }: SectionHeaderProps) {
  return (
    <div
      className="mk-reveal"
      style={{
        maxInlineSize: '46rem',
        marginInline: center ? 'auto' : undefined,
        textAlign: center ? 'center' : 'start',
        marginBlockEnd: '2.75rem',
      }}
    >
      {eyebrow ? <p className="mk-eyebrow">{eyebrow}</p> : null}
      <h2 className="mk-h2" style={{ marginBlockStart: eyebrow ? '1rem' : 0 }}>
        {title}
      </h2>
      {lead ? (
        <p className="mk-lead" style={{ marginBlockStart: '1rem' }}>
          {lead}
        </p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface PageHeroProps {
  h1: string
  intro: string[]
  breadcrumbs: { name: string; path: string }[]
  lang: MarketingLang
  cta?: { label: string; href: string }
}

export function PageHero({ h1, intro, breadcrumbs, lang, cta }: PageHeroProps) {
  return (
    <div className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
      <Breadcrumbs items={breadcrumbs} lang={lang} />
      <h1 className="mk-h1" style={{ marginBlockStart: '1.5rem', maxInlineSize: '18ch' }}>
        {h1}
      </h1>
      <div style={{ maxInlineSize: '62ch', marginBlockStart: '1.5rem', display: 'grid', gap: '1rem' }}>
        {intro.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="mk-lead">
            {paragraph}
          </p>
        ))}
      </div>
      <div style={{ marginBlockStart: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a href={cta?.href ?? APP_PATH} className="mk-btn mk-btn-primary mk-btn-lg">
          {cta?.label ?? chrome('openAppFree', lang)}
        </a>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function Breadcrumbs({
  items,
  lang,
}: {
  items: { name: string; path: string }[]
  lang: MarketingLang
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="mk-breadcrumbs">
        <li>
          <a href={localePath(lang, '/')}>{chrome('breadcrumb.home', lang)}</a>
        </li>
        {items.map((item, index) => (
          <li key={item.path} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="sep" aria-hidden="true">
              ›
            </span>
            {index === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <a href={item.path}>{item.name}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------ */

export function StepList({ steps }: { steps: HowToStep[] }) {
  return (
    <ol className="mk-steps" style={{ listStyle: 'none', padding: 0 }}>
      {steps.map((step) => (
        <li key={step.name} className="mk-step mk-reveal">
          <h3>{step.name}</h3>
          <p>{step.text}</p>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------------ */

export function FaqList({ items, title }: { items: FaqItem[]; title: string }) {
  return (
    <section className="mk-section-tight" aria-label={title}>
      <h2 className="mk-h2" style={{ marginBlockEnd: '1.75rem' }}>
        {title}
      </h2>
      <div className="mk-faq mk-reveal">
        {items.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p className="mk-faq-a">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

export function ContentSections({ sections }: { sections: PageSection[] }) {
  return (
    <div style={{ display: 'grid', gap: '3rem' }}>
      {sections.map((section) => (
        <section key={section.heading} className="mk-reveal">
          <h2 className="mk-h2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)' }}>
            {section.heading}
          </h2>
          <div className="mk-prose" style={{ marginBlockStart: '0.875rem' }}>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet.slice(0, 32)}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function RelatedLinks({ links, title }: { links: InternalLink[]; title: string }) {
  if (links.length === 0) return null
  return (
    <section className="mk-section-tight" aria-label={title}>
      <h2 className="mk-h3" style={{ marginBlockEnd: '1rem' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
        {links.map((link) => (
          <a key={link.to} href={link.to} className="mk-chip">
            {link.label} →
          </a>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

interface CtaBandProps {
  lang: MarketingLang
  title: string
  lead?: string
  href?: string
  label?: string
  children?: ReactNode
}

export function CtaBand({ lang, title, lead, href, label, children }: CtaBandProps) {
  return (
    <section className="mk-section-tight">
      <div className="mk-cta-band mk-reveal">
        <h2 className="mk-h2">{title}</h2>
        {lead ? (
          <p className="mk-lead" style={{ marginBlockStart: '0.875rem', marginInline: 'auto', maxInlineSize: '48ch' }}>
            {lead}
          </p>
        ) : null}
        <div style={{ marginBlockStart: '1.75rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href={href ?? APP_PATH} className="mk-btn mk-btn-primary mk-btn-lg">
            {label ?? chrome('openAppFree', lang)}
          </a>
          {children}
        </div>
      </div>
    </section>
  )
}
