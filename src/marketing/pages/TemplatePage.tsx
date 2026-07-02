import ReactMarkdown from 'react-markdown'
import { useLocation } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import { TEMPLATES } from '@/data/templates'
import { Breadcrumbs, CtaBand } from '../components/blocks'
import { Seo } from '../components/Seo'
import { APP_PATH } from '../content/site'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb } from '../seo/jsonld'

/** Raw-HTML templates render misleadingly without rehype-raw; show source only. */
const containsRawHtml = (markdown: string): boolean => /<[a-z][\s\S]*>/i.test(markdown)

export function TemplatePage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/\/+$/, '').split('/').pop() ?? ''
  const template = TEMPLATES.find((entry) => entry.id === slug)

  if (!template) {
    throw new Error(`Unknown template route: ${pathname}`)
  }

  const isDiagram = template.category === 'diagram'
  const kind = isDiagram ? 'Mermaid Diagram' : 'Markdown'
  const meta = {
    title: `${template.name} Template — Free ${kind} to PDF`,
    description: `${template.description} Free ${kind.toLowerCase()} template — open it in Scripto, make it yours, export a typeset PDF. No signup.`,
    path: `/templates/${template.id}`,
    keyword: `${template.name.toLowerCase()} markdown template`,
  }
  const related = TEMPLATES.filter(
    (entry) => entry.id !== template.id && (entry.category === 'diagram') === isDiagram,
  ).slice(0, 4)
  const crumbs = [
    { name: 'Templates', path: '/templates' },
    { name: template.name, path: meta.path },
  ]
  const showRendered = !containsRawHtml(template.content)

  return (
    <MarketingLayout lang="en">
      <Seo meta={meta} lang="en" ogTag="Template" jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs])]} />
      <div className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
        <Breadcrumbs items={crumbs} lang="en" />
        <h1 className="mk-h1" style={{ marginBlockStart: '1.5rem', fontSize: 'clamp(2.25rem, 5vw, 3.5rem)' }}>
          <span aria-hidden="true">{template.emoji}</span> {template.name} template
        </h1>
        <p className="mk-lead" style={{ maxInlineSize: '60ch', marginBlockStart: '1.25rem' }}>
          {template.description} Open it in the editor, replace what needs replacing, and export a
          typeset PDF — free, no signup, nothing uploaded.
        </p>
        <div style={{ marginBlockStart: '1.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href={`${APP_PATH}?template=${template.id}`} className="mk-btn mk-btn-primary mk-btn-lg">
            Use this template
          </a>
          <a href="/templates" className="mk-btn mk-btn-ghost mk-btn-lg">
            All templates
          </a>
        </div>
      </div>

      {showRendered ? (
        <div className="mk-container mk-section-tight">
          <h2 className="mk-h3" style={{ marginBlockEnd: '1rem' }}>
            Preview
          </h2>
          <div className="mk-card mk-reveal" style={{ padding: 'clamp(1.5rem, 4vw, 2.75rem)' }}>
            <div className="mk-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{template.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mk-container mk-section-tight">
        <h2 className="mk-h3" style={{ marginBlockEnd: '1rem' }}>
          The Markdown source
        </h2>
        <div className="mk-prose" style={{ maxInlineSize: 'none' }}>
          <pre>
            <code>{template.content}</code>
          </pre>
        </div>
        <p className="mk-muted" style={{ marginBlockStart: '0.875rem' }}>
          Copy it anywhere Markdown works — or open it pre-loaded in Scripto with the button above.
        </p>
      </div>

      {related.length > 0 ? (
        <div className="mk-container mk-section-tight">
          <h2 className="mk-h3" style={{ marginBlockEnd: '1.25rem' }}>
            Related templates
          </h2>
          <div className="mk-grid mk-grid-4">
            {related.map((entry) => (
              <a key={entry.id} href={`/templates/${entry.id}`} className="mk-card" style={{ padding: '1.25rem' }}>
                <span className="mk-tpl-emoji" aria-hidden="true">
                  {entry.emoji}
                </span>
                <h3 className="mk-h3" style={{ fontSize: '1.0625rem' }}>
                  {entry.name}
                </h3>
                <p className="mk-muted" style={{ marginBlockStart: '0.375rem', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  {entry.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mk-container">
        <CtaBand
          lang="en"
          title={`Ship your ${template.name.toLowerCase()} today.`}
          lead="One click opens this template in the editor with a live paginated preview."
          href={`${APP_PATH}?template=${template.id}`}
          label="Open in Scripto"
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = TemplatePage

export const getStaticPaths = (): string[] =>
  TEMPLATES.map((template) => `templates/${template.id}`)

// Branded 404 for unmatched slugs reached via client-side navigation.
export { NotFoundPage as ErrorBoundary } from './NotFoundPage'
