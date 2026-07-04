import type { ComponentProps, ReactElement } from 'react'
import { isValidElement } from 'react'
import ReactMarkdown from 'react-markdown'
import { useLocation } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkDirective from 'remark-directive'
import remarkGemoji from 'remark-gemoji'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { TEMPLATES } from '@/data/templates'
import { parseFrontmatter } from '@/lib/frontmatter'
import { remarkCallouts } from '@/markdown/plugins/remarkCallouts'
import { remarkMarks } from '@/markdown/plugins/remarkMarks'
import { Breadcrumbs, CtaBand } from '../components/blocks'
import { Seo } from '../components/Seo'
import { APP_PATH } from '../content/site'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb } from '../seo/jsonld'

/** Raw-HTML templates render misleadingly without rehype-raw; show source only. */
const containsRawHtml = (markdown: string): boolean => /<[a-z][\s\S]*>/i.test(markdown)

/** Mirror the app's remark stack so template previews match the editor. */
const PREVIEW_REMARK_PLUGINS = [
  remarkGfm,
  remarkMath,
  remarkDirective,
  remarkCallouts,
  remarkMarks,
  remarkGemoji,
]

const languageOf = (className: string | undefined): string | undefined =>
  /language-([\w-]+)/.exec(className ?? '')?.[1]

/**
 * Fenced code with the app's chrome: a header bar carrying the language label
 * and a copy button (wired by the site's inline enhancement script).
 */
function PreviewCodeBlock(props: ComponentProps<'pre'>) {
  const child = props.children as ReactElement<{ className?: string }> | undefined
  const language = isValidElement(child) ? languageOf(child.props.className) : undefined
  return (
    <div className="mk-codebox">
      <div className="mk-codebox-bar">
        <span>{language ?? 'code'}</span>
        <button type="button" data-copy aria-label="Copy code">
          Copy
        </button>
      </div>
      <pre>{props.children}</pre>
    </div>
  )
}

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
  // Front-matter is config, not content — the app turns it into cover/TOC
  // settings, so the marketing preview must not print it as text.
  const { body: previewBody } = parseFrontmatter(template.content)
  const showRendered = !containsRawHtml(previewBody)

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
              <ReactMarkdown
                remarkPlugins={PREVIEW_REMARK_PLUGINS}
                rehypePlugins={[rehypeKatex]}
                components={{ pre: PreviewCodeBlock }}
              >
                {previewBody}
              </ReactMarkdown>
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
