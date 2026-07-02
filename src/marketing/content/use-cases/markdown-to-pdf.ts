import type { UseCaseContent } from '../../types'

export const markdownToPdf: UseCaseContent = {
  slug: 'markdown-to-pdf',
  meta: {
    title: 'Markdown to PDF — Free Converter with Real Page Layout',
    description:
      'Convert Markdown to PDF free, in your browser. Real pagination with headers, footers, page numbers, cover page and TOC — no upload, no watermark, no signup.',
    path: '/markdown-to-pdf',
    keyword: 'markdown to pdf',
  },
  h1: 'Convert Markdown to PDF — properly.',
  intro: [
    'Markdown is the fastest way to write. PDF is still the way documents get shared, submitted and archived. The gap between the two is where most tools fail: they render your Markdown as one long web page, print it, and let the browser guess where the pages break.',
    'Scripto closes that gap with a real paged-layout engine. Your Markdown is typeset into actual pages — with running headers, footers, page numbers, a cover page and a clickable table of contents — and the preview shows you those exact pages before you export a single byte.',
  ],
  howTo: {
    title: 'How to convert Markdown to PDF',
    steps: [
      {
        name: 'Open Scripto and paste your Markdown',
        text: 'Open the free editor at md.atom.sa/app — no account needed. Paste your Markdown or start from one of 50+ templates.',
      },
      {
        name: 'Watch the paginated preview',
        text: 'The preview pane shows real pages, not a scrolling web view. Fix headings, breaks and spacing while you write.',
      },
      {
        name: 'Pick a skin and page setup',
        text: 'Choose from 20+ document skins, set paper size (A4, Letter, and more), margins, fonts, headers and footers.',
      },
      {
        name: 'Export your PDF',
        text: 'Click Export PDF. The file is generated locally in your browser — nothing is uploaded anywhere.',
      },
    ],
  },
  sections: [
    {
      heading: 'Why “print to PDF” isn’t enough',
      paragraphs: [
        'Printing a rendered Markdown page from your browser gives you whatever the browser’s print reflow decides: headings orphaned at the bottom of a page, tables sliced mid-row, code blocks split without context, and no headers or page numbers at all.',
        'A paged-media engine works the other way around. It knows the page geometry first, then flows your content into it with typesetting rules — keep headings with their content, avoid widowed lines, repeat table headers, and stamp running headers and page numbers on every page.',
      ],
      bullets: [
        'Running headers and footers with the document title or custom text',
        'Page numbers, “Page X of Y” counters, and per-section numbering',
        'Automatic cover page and a clickable table of contents',
        'Widow/orphan control and clean breaks for code, tables and figures',
      ],
    },
    {
      heading: 'Everything renders — math, diagrams, tables, callouts',
      paragraphs: [
        'Scripto supports GitHub-Flavored Markdown plus the extensions technical writers actually use: KaTeX math (inline and display), Mermaid diagrams drawn from fenced code blocks, footnotes, task lists, definition lists, callout boxes and highlighted text. All of it is reproduced faithfully in the exported PDF, because the export is the preview.',
      ],
    },
    {
      heading: 'Private by architecture, not by promise',
      paragraphs: [
        'There is no convert-server behind Scripto. The Markdown parser, the layout engine and the PDF pipeline all run inside your browser tab, so confidential reports and contracts never leave your device. It also means the whole thing works offline once installed as a PWA.',
      ],
    },
  ],
  faq: [
    {
      q: 'Is this Markdown to PDF converter really free?',
      a: 'Yes — free and open source (MIT), with every feature included. No trial, no watermark, no export limits.',
    },
    {
      q: 'Do I need to upload my Markdown file?',
      a: 'No. Scripto runs 100% client-side. You can drop a .md file into the editor, but it is read locally — nothing is transmitted.',
    },
    {
      q: 'Can I control page size and margins?',
      a: 'Yes. A4, Letter and other paper sizes, portrait or landscape, custom margins, font families and sizes, line height, and per-document custom CSS.',
    },
    {
      q: 'Does it support page numbers and headers?',
      a: 'Yes — running headers and footers with custom text or the document title, plus automatic page numbers and “X of Y” counters.',
    },
    {
      q: 'Can I convert multiple Markdown files?',
      a: 'Scripto has a document library, so you can keep many documents and export each to PDF. Batch/CLI conversion is better served by Pandoc — see our honest comparison.',
    },
  ],
  related: [
    { label: 'README to PDF', to: '/readme-to-pdf' },
    { label: 'Resume to PDF', to: '/resume-to-pdf' },
    { label: 'Markdown with math to PDF', to: '/markdown-to-pdf-with-math' },
    { label: 'Markdown with Mermaid to PDF', to: '/markdown-to-pdf-with-mermaid' },
    { label: 'Scripto vs Pandoc', to: '/vs/pandoc' },
    { label: 'Markdown cheat sheet', to: '/markdown-cheat-sheet' },
  ],
  templateIds: ['report', 'proposal', 'meeting', 'prd'],
}
