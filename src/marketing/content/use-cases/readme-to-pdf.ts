import type { UseCaseContent } from '../../types'

export const readmeToPdf: UseCaseContent = {
  slug: 'readme-to-pdf',
  meta: {
    title: 'README to PDF — Convert GitHub Markdown Docs Free',
    description:
      'Turn a GitHub README.md into a clean, paginated PDF with unbroken code blocks, working tables and page numbers. Free, client-side, no upload.',
    path: '/readme-to-pdf',
    keyword: 'readme to pdf',
  },
  h1: 'Turn a README into a PDF worth attaching.',
  intro: [
    'READMEs are written for GitHub, but sooner or later one has to leave GitHub: a client wants the setup guide as a document, a security review needs an offline copy, a course submission requires PDF. Copy-pasting into Word mangles the code blocks; browser printing slices tables in half.',
    'Scripto understands GitHub-Flavored Markdown natively — fenced code with syntax highlighting, tables, task lists, badges, emoji — and typesets it into real pages where code blocks break cleanly and every page carries the project name and a page number.',
  ],
  howTo: {
    title: 'How to convert a README.md to PDF',
    steps: [
      {
        name: 'Grab your README',
        text: 'Copy the raw contents of README.md (the “Raw” button on GitHub) or just drag the file into Scripto.',
      },
      {
        name: 'Paste into Scripto',
        text: 'Open the editor and paste. GitHub-Flavored Markdown — tables, task lists, fenced code, emoji — renders immediately in the paginated preview.',
      },
      {
        name: 'Pick a technical skin',
        text: 'The Technical or Blueprint skins are tuned for documentation: tighter code blocks, clear heading hierarchy, mono accents.',
      },
      {
        name: 'Export PDF',
        text: 'One click. Your README becomes a paginated document with a cover page and clickable table of contents if you want them.',
      },
    ],
  },
  sections: [
    {
      heading: 'Code blocks that survive pagination',
      paragraphs: [
        'The hardest part of converting developer docs is code. Scripto highlights fenced code blocks (with the language label preserved), keeps short blocks intact on one page, and breaks long ones at line boundaries — never mid-line, never mid-character. Inline code stays inline, and wide code can scale down instead of overflowing the page.',
      ],
    },
    {
      heading: 'Tables, badges and the rest of GitHub Markdown',
      paragraphs: [
        'GFM tables render with proper column widths and repeat their header row when they cross a page break. Task lists keep their checkboxes, footnotes become real footnotes, and shield badges render as images. If your README embeds raw HTML, that works too.',
      ],
    },
    {
      heading: 'Make it a real document',
      paragraphs: [
        'A README printed as-is still looks like a web page. Two clicks turn it into a document: enable the cover page (title, subtitle, author, date) and the table of contents generated from your headings. Add a running footer like “MyProject — Setup Guide” and it is ready for the people who will never open GitHub.',
      ],
    },
  ],
  faq: [
    {
      q: 'Does syntax highlighting survive in the PDF?',
      a: 'Yes. Fenced code blocks are highlighted (Prism grammar set) and the colors are preserved in the exported PDF exactly as previewed.',
    },
    {
      q: 'What happens to relative image links?',
      a: 'Images with absolute URLs render normally. Relative repo paths (./docs/img.png) have no file to resolve to — paste the absolute raw.githubusercontent.com URL for those.',
    },
    {
      q: 'Can I convert several project docs into one PDF?',
      a: 'Concatenate the Markdown files in the editor (they stack into one document), add a cover and TOC, and export a single handbook-style PDF.',
    },
    {
      q: 'Will GitHub badges (shields.io) show up?',
      a: 'Yes — they are ordinary images. If you prefer a cleaner print, delete the badge line before exporting.',
    },
    {
      q: 'Is anything uploaded to a server?',
      a: 'No. The conversion runs entirely in your browser; your documentation never leaves your machine.',
    },
  ],
  related: [
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Mermaid diagrams to PDF', to: '/markdown-to-pdf-with-mermaid' },
    { label: 'README template', to: '/templates/readme' },
    { label: 'API docs template', to: '/templates/api-docs' },
    { label: 'Scripto vs Pandoc', to: '/vs/pandoc' },
  ],
  templateIds: ['readme', 'api-docs', 'changelog', 'rfc'],
  ctaQuery: '?template=readme',
  ctaLabel: 'Open the README template',
}
