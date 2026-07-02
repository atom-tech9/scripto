import { TEMPLATES } from '@/data/templates'
import { Breadcrumbs, CtaBand } from '../components/blocks'
import { Seo } from '../components/Seo'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb } from '../seo/jsonld'
import type { SeoMeta } from '../types'

const META: SeoMeta = {
  title: 'Markdown Templates — 50+ Free Documents Ready to Export',
  description:
    'Free Markdown templates: resumes, invoices, proposals, RFCs, meeting notes, syllabi and a full Mermaid diagram set — each one PDF-ready in Scripto.',
  path: '/templates',
  keyword: 'markdown templates',
}

export function TemplatesIndexPage() {
  const documents = TEMPLATES.filter((template) => template.category !== 'diagram')
  const diagrams = TEMPLATES.filter((template) => template.category === 'diagram')
  const crumbs = [{ name: 'Templates', path: '/templates' }]

  const renderGrid = (entries: typeof TEMPLATES) => (
    <div className="mk-grid mk-grid-4">
      {entries.map((template) => (
        <a key={template.id} href={`/templates/${template.id}`} className="mk-card mk-reveal" style={{ padding: '1.25rem' }}>
          <span className="mk-tpl-emoji" aria-hidden="true">
            {template.emoji}
          </span>
          <h3 className="mk-h3" style={{ fontSize: '1.0625rem' }}>
            {template.name}
          </h3>
          <p className="mk-muted" style={{ marginBlockStart: '0.375rem', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            {template.description}
          </p>
        </a>
      ))}
    </div>
  )

  return (
    <MarketingLayout lang="en">
      <Seo meta={META} lang="en" jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs])]} />
      <div className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
        <Breadcrumbs items={crumbs} lang="en" />
        <h1 className="mk-h1" style={{ marginBlockStart: '1.5rem' }}>
          Start from something <span className="mk-gradient-text">great.</span>
        </h1>
        <p className="mk-lead" style={{ maxInlineSize: '60ch', marginBlockStart: '1.25rem' }}>
          {TEMPLATES.length} free templates — complete, well-structured documents you edit down
          rather than build up. Every one exports to a typeset PDF in one click.
        </p>
      </div>

      <div className="mk-container mk-section-tight">
        <h2 className="mk-h2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', marginBlockEnd: '1.5rem' }}>
          Documents ({documents.length})
        </h2>
        {renderGrid(documents)}
      </div>

      <div className="mk-container mk-section-tight">
        <h2 className="mk-h2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', marginBlockEnd: '1.5rem' }}>
          Mermaid diagrams ({diagrams.length})
        </h2>
        {renderGrid(diagrams)}
      </div>

      <div className="mk-container">
        <CtaBand
          lang="en"
          title="Every template is a two-minute PDF."
          lead="Pick one, replace the placeholder text, export. No signup, no watermark."
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = TemplatesIndexPage
