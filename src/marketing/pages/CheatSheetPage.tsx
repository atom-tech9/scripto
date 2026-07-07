import { Breadcrumbs, CtaBand, FaqList } from '../components/blocks'
import { Seo } from '../components/Seo'
import { APP_PATH } from '../content/site'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb, faqPage } from '../seo/jsonld'
import type { FaqItem, SeoMeta } from '../types'

const META: SeoMeta = {
  title: 'Markdown Cheat Sheet — Every Syntax, One Page (Free PDF)',
  description:
    'The complete Markdown cheat sheet: basic syntax, GitHub-Flavored extensions, tables, math and Mermaid — with a one-click printable PDF version.',
  path: '/markdown-cheat-sheet',
  keyword: 'markdown cheat sheet',
}

interface SyntaxRow {
  element: string
  syntax: string
  note?: string
}

interface SyntaxGroup {
  title: string
  rows: SyntaxRow[]
}

const GROUPS: SyntaxGroup[] = [
  {
    title: 'Basics',
    rows: [
      { element: 'Heading', syntax: '# H1  ## H2  ### H3', note: 'Six levels; keep one H1 per document' },
      { element: 'Bold', syntax: '**bold text**' },
      { element: 'Italic', syntax: '*italicized text*' },
      { element: 'Bold + italic', syntax: '***both***' },
      { element: 'Blockquote', syntax: '> quoted line', note: 'Nest with >>' },
      { element: 'Ordered list', syntax: '1. First item' },
      { element: 'Unordered list', syntax: '- Item' },
      { element: 'Inline code', syntax: '`code`' },
      { element: 'Horizontal rule', syntax: '---' },
      { element: 'Link', syntax: '[title](https://example.com)' },
      { element: 'Image', syntax: '![alt text](image.png)' },
      { element: 'Line break', syntax: 'two trailing spaces  ', note: 'Or a blank line for a new paragraph' },
    ],
  },
  {
    title: 'Extended (GitHub-Flavored Markdown)',
    rows: [
      { element: 'Table', syntax: '| A | B |\n| --- | --- |\n| 1 | 2 |', note: 'Align with :--- :---: ---:' },
      { element: 'Fenced code block', syntax: '```js\ncode here\n```', note: 'Language enables highlighting' },
      { element: 'Task list', syntax: '- [x] done\n- [ ] todo' },
      { element: 'Strikethrough', syntax: '~~crossed out~~' },
      { element: 'Footnote', syntax: 'text[^1]\n[^1]: The note.' },
      { element: 'Emoji shortcode', syntax: ':rocket: → 🚀' },
      { element: 'Autolink', syntax: 'https://example.com' },
    ],
  },
  {
    title: 'Scripto extras',
    rows: [
      { element: 'Inline math', syntax: '$E = mc^2$', note: 'KaTeX syntax' },
      { element: 'Display math', syntax: '$$\\int_a^b f(x)\\,dx$$' },
      { element: 'Mermaid diagram', syntax: '```mermaid\nflowchart LR\nA --> B\n```' },
      { element: 'Callout', syntax: ':::note Title\nBody text\n:::', note: 'note / tip / warning / danger' },
      { element: 'Highlight', syntax: '==marked text==' },
      { element: 'Definition list', syntax: 'Term\n: definition' },
      { element: 'Page break', syntax: '\\pagebreak', note: 'Force a new PDF page' },
    ],
  },
]

const FAQ: FaqItem[] = [
  {
    q: 'What is Markdown?',
    a: 'A plain-text formatting syntax by John Gruber (2004): readable as raw text, convertible to HTML — and with Scripto, to typeset PDF. It powers READMEs, wikis, note apps and static sites.',
  },
  {
    q: 'What is GitHub-Flavored Markdown (GFM)?',
    a: 'GitHub’s widely-adopted extension set: tables, task lists, strikethrough, autolinks and fenced code blocks. Scripto supports all of it.',
  },
  {
    q: 'How do I get this cheat sheet as a PDF?',
    a: 'Open the Cheat Sheet template in Scripto — it is this reference as an editable document — and click Export PDF. Two-column compact skin recommended.',
  },
  {
    q: 'Which Markdown flavor should I write?',
    a: 'GFM is the safest default — it renders on GitHub, in most editors, and in Scripto identically. Use the extras (math, Mermaid, callouts) when your target supports them.',
  },
]

export function CheatSheetPage() {
  const crumbs = [{ name: 'Markdown cheat sheet', path: META.path }]

  return (
    <MarketingLayout lang="en">
      <Seo
        meta={META}
        lang="en"
        jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs]), faqPage(FAQ)]}
      />
      <div className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
        <Breadcrumbs items={crumbs} lang="en" />
        <h1 className="mk-h1" style={{ marginBlockStart: '1.5rem' }}>
          The Markdown cheat sheet.
        </h1>
        <p className="mk-lead" style={{ maxInlineSize: '62ch', marginBlockStart: '1.25rem' }}>
          Every piece of syntax that matters — the basics, the GitHub-Flavored extensions, and the
          print-focused extras Scripto adds. Bookmark this page, or export it as a one-page PDF from
          the template.
        </p>
        <div style={{ marginBlockStart: '1.75rem' }}>
          <a
            href={`${APP_PATH}?template=cheatsheet`}
            className="mk-btn mk-btn-primary mk-btn-lg"
            data-track="Open App"
            data-track-location="cheatsheet"
            data-track-template="cheatsheet"
          >
            Open as editable template
          </a>
        </div>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} className="mk-container mk-section-tight">
          <h2 className="mk-h2" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', marginBlockEnd: '1.25rem' }}>
            {group.title}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="mk-vs-table">
              <thead>
                <tr>
                  <th style={{ inlineSize: '22%' }}>Element</th>
                  <th>Syntax</th>
                  <th style={{ inlineSize: '30%' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.element}>
                    <td>{row.element}</td>
                    <td>
                      <code
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.8125rem',
                          whiteSpace: 'pre-wrap',
                          color: 'var(--mk-code-fg)',
                        }}
                      >
                        {row.syntax}
                      </code>
                    </td>
                    <td className="mk-muted">{row.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="mk-container">
        <FaqList items={FAQ} title="Frequently asked questions" />
        <CtaBand
          lang="en"
          title="Now put it on paper."
          lead="Write in Markdown, export a typeset PDF with headers, page numbers and a table of contents."
          href={`${APP_PATH}?template=cheatsheet`}
          label="Export the cheat sheet PDF"
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = CheatSheetPage
