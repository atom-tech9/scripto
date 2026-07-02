import type { ComparisonContent } from '../types'

const notion: ComparisonContent = {
  slug: 'notion-pdf-export',
  meta: {
    title: 'Scripto vs Notion PDF Export — An Honest Comparison',
    description:
      'Notion exports pages to PDF, but with fixed styling and no page control. See when Notion is enough and when a paginated Markdown studio produces better documents.',
    path: '/vs/notion-pdf-export',
    keyword: 'notion pdf export alternative',
  },
  h1: 'Scripto vs Notion’s PDF export',
  competitor: 'Notion',
  intro: [
    'Notion is a superb workspace, and for internal notes its Export → PDF is perfectly fine. The gaps appear when the PDF is the deliverable: client reports, proposals, formal documents. Notion’s export gives you one look, no running headers, and page breaks that fall wherever they fall.',
    'This comparison is honest by design — if you live in Notion and the PDF is an afterthought, keep using Notion. If the PDF is the product, read on.',
  ],
  rows: [
    ['Page breaks', 'Real paginated preview — you see and control every break', 'Breaks decided at export; no preview'],
    ['Headers & footers', 'Running headers/footers, custom text, page numbers, X of Y', 'None (page number only via print dialog)'],
    ['Cover page & TOC', 'One-click cover + clickable TOC in the PDF', 'No cover; TOC block prints as links list'],
    ['Styling', '20+ skins + custom CSS, per-document fonts/margins', 'One fixed Notion look, 3 font choices'],
    ['Source format', 'Portable Markdown — works in git, any editor', 'Notion blocks (Markdown export is lossy)'],
    ['Privacy', '100% client-side; documents never uploaded', 'Cloud-hosted; export happens server-side'],
    ['Offline', 'Full offline PWA', 'Limited offline; export needs connection'],
    ['Collaboration', 'Single-writer (share the file or repo)', 'Excellent real-time multiplayer'],
    ['Databases & wikis', 'Not a workspace — documents only', 'Best-in-class'],
    ['Price', 'Free, open source (MIT)', 'Free tier; paid plans for teams'],
  ],
  verdict: {
    scripto: [
      'The PDF is the deliverable: client reports, proposals, formal docs',
      'You need headers, footers, page numbers or a cover page',
      'Your source of truth is Markdown in a repo',
      'The document is confidential and must stay on your machine',
    ],
    competitor: [
      'The document lives its whole life inside your team workspace',
      'You need real-time collaboration and comments',
      'Databases, wikis and tasks matter more than print fidelity',
    ],
  },
  sections: [
    {
      heading: 'The core difference: a workspace vs a typesetter',
      paragraphs: [
        'Notion optimizes for living documents on screens; printing is an exit ramp. Scripto optimizes for the printed artifact: the editor shows real pages while you write, and the export engine (CSS paged media via Paged.js) applies book-style rules — widow control, kept headings, repeating table headers — that a workspace app has no reason to implement.',
        'A practical workflow many teams use: draft and collaborate in Notion, export Markdown, paste into Scripto for typesetting when a document graduates to “official PDF”. Two tools, each doing the part it is built for.',
      ],
    },
  ],
  faq: [
    {
      q: 'Can I move a Notion page into Scripto?',
      a: 'Yes — Export → Markdown in Notion, then paste or drop the file into Scripto. Tables, lists and code blocks carry over; database views do not (they are not Markdown).',
    },
    {
      q: 'Does Scripto have Notion-style collaboration?',
      a: 'No. Scripto is local-first and single-writer by design; share the Markdown through git or any file channel.',
    },
    {
      q: 'Why does my Notion PDF break tables across pages?',
      a: 'Notion’s export prints the page without paged-layout rules. Scripto repeats table headers after breaks and avoids slicing rows.',
    },
  ],
  related: [
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Scripto vs Typora', to: '/vs/typora' },
    { label: 'Scripto vs Pandoc', to: '/vs/pandoc' },
  ],
}

const pandoc: ComparisonContent = {
  slug: 'pandoc',
  meta: {
    title: 'Scripto vs Pandoc — Which Markdown to PDF Tool to Use?',
    description:
      'Pandoc is the universal document converter; Scripto is a visual Markdown → PDF studio. An honest guide to which fits your workflow — and when to use both.',
    path: '/vs/pandoc',
    keyword: 'pandoc alternative gui',
  },
  h1: 'Scripto vs Pandoc',
  competitor: 'Pandoc',
  intro: [
    'Pandoc is one of the great pieces of open-source software: a command-line converter between dozens of document formats, with a LaTeX-grade PDF pipeline. If you have it configured and love it, nothing here will (or should) talk you out of it.',
    'Scripto answers a different question: how do you get a beautifully paginated PDF from Markdown without installing a toolchain, learning template languages, or leaving the browser — and see the pages while you write.',
  ],
  rows: [
    ['Setup', 'Zero — open a URL', 'CLI install + LaTeX distribution (~1–4 GB) for PDF'],
    ['Preview', 'Live paginated preview; WYSIWYG', 'None — run, open PDF, adjust, repeat'],
    ['Styling', '20+ visual skins + custom CSS', 'LaTeX templates / reference docs — powerful, steep'],
    ['Headers & page numbers', 'Built-in, visual configuration', 'Yes, via LaTeX variables/templates'],
    ['Math', 'KaTeX (TeX syntax)', 'Full LaTeX — the gold standard'],
    ['Mermaid diagrams', 'Native', 'Requires filters (mermaid-filter + headless browser)'],
    ['Citations & BibTeX', 'Not supported', 'First-class (citeproc)'],
    ['Batch / automation', 'No CLI', 'Perfect for CI and scripts'],
    ['Input formats', 'Markdown, DOCX→MD, HTML→MD', 'Dozens (org, rst, LaTeX, EPUB…)'],
    ['Privacy', 'Client-side, offline PWA', 'Local CLI — equally private'],
    ['Price', 'Free (MIT)', 'Free (GPL)'],
  ],
  verdict: {
    scripto: [
      'You want a visual, immediate write-and-export loop',
      'No appetite for LaTeX installs or template debugging',
      'Mermaid, callouts and skins matter more than citations',
      'You are on a machine where you can’t install anything',
    ],
    competitor: [
      'Academic writing with citations, cross-references, BibTeX',
      'Batch conversion in scripts or CI pipelines',
      'Exotic input/output formats beyond Markdown and PDF',
    ],
  },
  sections: [
    {
      heading: 'Different engines, different philosophies',
      paragraphs: [
        'Pandoc’s PDF quality comes from LaTeX (or Typst/wkhtmltopdf), driven by templates and variables — infinitely scriptable, invisible until compiled. Scripto’s comes from the browser’s CSS engine plus Paged.js — visual, immediate, themeable with plain CSS. Both produce genuinely typeset output; they differ in feedback loop and setup cost.',
        'They also compose: plenty of users keep Pandoc for automated pipelines and use Scripto when a human needs to shape one document quickly.',
      ],
    },
  ],
  faq: [
    {
      q: 'Is Scripto built on Pandoc?',
      a: 'No. Scripto uses remark/rehype for parsing and Paged.js for pagination, all running in the browser. Pandoc is a native binary.',
    },
    {
      q: 'Can Scripto do citations like Pandoc?',
      a: 'No — no citeproc/BibTeX. Footnotes exist; for academic citation workflows Pandoc (or LaTeX) is the right tool.',
    },
    {
      q: 'Is there a Scripto CLI for CI?',
      a: 'Not currently; Scripto is a browser studio. For headless batch conversion, Pandoc is excellent.',
    },
  ],
  related: [
    { label: 'Markdown with math to PDF', to: '/markdown-to-pdf-with-math' },
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Scripto vs Typora', to: '/vs/typora' },
  ],
}

const typora: ComparisonContent = {
  slug: 'typora',
  meta: {
    title: 'Scripto vs Typora — Markdown Editors for PDF Export',
    description:
      'Typora is a beloved desktop Markdown editor ($15). Scripto is a free, browser-based Markdown → PDF studio with true pagination. An honest comparison.',
    path: '/vs/typora',
    keyword: 'typora alternative free',
  },
  h1: 'Scripto vs Typora',
  competitor: 'Typora',
  intro: [
    'Typora earned its reputation: a calm, seamless live-preview Markdown editor for the desktop, with themes and solid export. It costs $14.99 after a trial and treats PDF as one of many exports, rendered through its HTML engine with theme CSS.',
    'Scripto is free, runs in the browser (and offline as a PWA), and is built around the PDF: pagination is the preview, not a post-processing step.',
  ],
  rows: [
    ['Platform', 'Browser + offline PWA — any OS, nothing to install', 'Desktop app (macOS, Windows, Linux)'],
    ['Price', 'Free, open source (MIT)', '$14.99 (15-day trial)'],
    ['Editing feel', 'Source editor + live paginated preview', 'Beautiful inline WYSIWYG (its superpower)'],
    ['Pagination preview', 'Real pages while you write', 'No — export decides breaks'],
    ['Headers/footers & page numbers', 'Visual config, running headers, X of Y', 'Basic, via export settings/theme CSS'],
    ['Cover & TOC', 'One-click cover page + clickable TOC', 'TOC syntax supported; no cover generator'],
    ['Skins/themes', '20+ print-tuned skins + custom CSS', 'Screen themes (CSS), community gallery'],
    ['Math & diagrams', 'KaTeX + Mermaid, exported perfectly', 'MathJax + Mermaid supported'],
    ['Arabic / RTL', 'First-class RTL pagination + Arabic UI', 'RTL text works; no RTL page furniture'],
    ['Files', 'Browser library (+ export .md)', 'Real files on disk — great with git folders'],
  ],
  verdict: {
    scripto: [
      'PDF output quality and page control are the priority',
      'You want free and open source',
      'You hop between machines or can’t install software',
      'You write Arabic/RTL documents',
    ],
    competitor: [
      'You want the smoothest inline WYSIWYG editing on desktop',
      'Working directly on .md files in local folders is essential',
      'You are happy with default export styling',
    ],
  },
  sections: [
    {
      heading: 'The editing philosophy differs',
      paragraphs: [
        'Typora hides the source: you edit the rendered document inline, which many writers adore. Scripto keeps source and pages side by side: the left pane is honest Markdown, the right pane is the actual paginated result. For print work the second model wins — you never wonder where page 3 ends — while for pure drafting Typora’s flow is hard to beat.',
      ],
    },
  ],
  faq: [
    {
      q: 'Can I open my Typora files in Scripto?',
      a: 'Yes — they are plain Markdown. Drag the .md file in; GFM, math and Mermaid render the same or better in the paginated preview.',
    },
    {
      q: 'Does Scripto work offline like a desktop app?',
      a: 'Yes. Install it as a PWA and it launches from your dock/start menu and works fully offline.',
    },
    {
      q: 'Is Scripto’s editor WYSIWYG like Typora?',
      a: 'No — Scripto pairs a source editor with a live paginated preview instead of inline WYSIWYG. Different philosophy, better page control.',
    },
  ],
  related: [
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Scripto vs Notion PDF export', to: '/vs/notion-pdf-export' },
    { label: 'Scripto vs Pandoc', to: '/vs/pandoc' },
  ],
}

export const COMPARISONS: ComparisonContent[] = [notion, pandoc, typora]

export const findComparison = (slug: string): ComparisonContent | undefined =>
  COMPARISONS.find((comparison) => comparison.slug === slug)
