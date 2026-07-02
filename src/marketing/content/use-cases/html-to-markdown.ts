import type { UseCaseContent } from '../../types'

export const htmlToMarkdown: UseCaseContent = {
  slug: 'html-to-markdown',
  meta: {
    title: 'HTML to Markdown Converter — Free, Private, In-Browser',
    description:
      'Convert HTML to clean Markdown in your browser: paste rich text or HTML and get GFM with tables, lists and code preserved. Then export to PDF if you like.',
    path: '/html-to-markdown',
    keyword: 'html to markdown',
  },
  h1: 'From messy HTML to clean Markdown.',
  intro: [
    'Content rarely starts life as Markdown. It lives in web pages, CMS editors, emails and rich-text exports — tangled in span soup and inline styles. Getting it into a Markdown workflow usually means manual retyping or a converter website that uploads your text to someone else’s server.',
    'Scripto converts HTML to Markdown locally: paste rich text straight from a web page (formatting comes along), or paste raw HTML, and the editor turns it into tidy GitHub-Flavored Markdown — headings, lists, links, tables, code blocks and images preserved.',
  ],
  howTo: {
    title: 'How to convert HTML to Markdown',
    steps: [
      {
        name: 'Copy from the source',
        text: 'Select and copy from any web page, CMS preview or rich-text editor — or copy raw HTML markup.',
      },
      {
        name: 'Paste into Scripto',
        text: 'Rich-text pastes are converted to Markdown automatically (Turndown with GFM rules). The result lands in the editor as plain, readable Markdown.',
      },
      {
        name: 'Tidy the result',
        text: 'Check headings and tables in the live preview; the paginated view immediately shows how it would print.',
      },
      {
        name: 'Keep it — or export it',
        text: 'Save the Markdown to your library, copy it into your repo, or continue straight to a paginated PDF export.',
      },
    ],
  },
  sections: [
    {
      heading: 'What survives the conversion',
      paragraphs: [
        'The converter maps HTML to GitHub-Flavored Markdown: heading levels, bold/italic/strikethrough, ordered and unordered lists (with nesting), links with titles, images, blockquotes, horizontal rules, inline code and fenced code blocks, and tables. Presentational junk — fonts, colors, tracking spans, empty divs — is deliberately dropped; that is the point.',
      ],
    },
    {
      heading: 'Why convert to Markdown at all?',
      paragraphs: [
        'Markdown is the portable interchange format for text that still has a future: it diffs in git, it edits in anything, it feeds every static-site generator and every LLM cleanly, and — through Scripto — it typesets to PDF. Converting legacy HTML content into Markdown is how you unlock it from the tool it was written in.',
      ],
    },
    {
      heading: 'A converter that can keep a secret',
      paragraphs: [
        'Online HTML-to-Markdown converters process your content server-side. Scripto’s conversion runs in your tab — paste an internal wiki page or a client email without it ever touching a network request.',
      ],
    },
  ],
  faq: [
    {
      q: 'Can I paste directly from a web page?',
      a: 'Yes — copy from the rendered page and paste; the rich-text clipboard flavor is converted to Markdown automatically.',
    },
    {
      q: 'Are tables converted?',
      a: 'Yes, HTML tables become GFM pipe tables. Extremely complex tables (nested tables, row spans) are simplified — check the preview after pasting.',
    },
    {
      q: 'What about images?',
      a: 'Image tags become Markdown image syntax pointing at the original URLs. Images are not downloaded or re-hosted.',
    },
    {
      q: 'Does it handle code snippets from docs sites?',
      a: 'Pre/code blocks convert to fenced code blocks; language hints in class names are preserved where present.',
    },
    {
      q: 'Is my content uploaded during conversion?',
      a: 'No. Turndown (the converter) runs locally in your browser, like the rest of Scripto.',
    },
  ],
  related: [
    { label: 'Word to Markdown', to: '/word-to-markdown' },
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Markdown cheat sheet', to: '/markdown-cheat-sheet' },
  ],
  templateIds: ['blank', 'blog', 'report'],
}
