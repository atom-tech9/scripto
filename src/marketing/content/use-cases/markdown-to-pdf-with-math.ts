import type { UseCaseContent } from '../../types'

export const markdownToPdfWithMath: UseCaseContent = {
  slug: 'markdown-to-pdf-with-math',
  meta: {
    title: 'Markdown with Math to PDF — KaTeX & LaTeX Equations Free',
    description:
      'Export Markdown with LaTeX math to PDF: KaTeX renders inline and display equations that stay crisp in print. Perfect for notes, papers and problem sets.',
    path: '/markdown-to-pdf-with-math',
    keyword: 'markdown math to pdf',
  },
  h1: 'LaTeX-quality math without the LaTeX toolchain.',
  intro: [
    'For a lecture handout or a problem set, full LaTeX is overkill — but Word’s equation editor is under-kill, and most Markdown exporters drop your `$…$` blocks as literal dollar signs.',
    'Scripto renders math with KaTeX: the same TeX syntax you already know (`$inline$`, `$$display$$`), typeset instantly in the preview and reproduced identically in the paginated PDF. Notes in Markdown, equations in TeX, output that looks like it came from a journal.',
  ],
  howTo: {
    title: 'How to export Markdown with math to PDF',
    steps: [
      {
        name: 'Write TeX inside Markdown',
        text: 'Use $ … $ for inline math and $$ … $$ for display equations — fractions, integrals, matrices, aligned environments.',
      },
      {
        name: 'Preview the typeset result',
        text: 'KaTeX renders as you type. Errors show the offending TeX instead of silently eating the equation.',
      },
      {
        name: 'Choose an academic look',
        text: 'The Academic preset pairs a serif body (Source Serif 4) with numbered headings; the Manuscript skin fits papers and theses.',
      },
      {
        name: 'Export PDF',
        text: 'Display equations are kept whole across page breaks, and inline math baselines align with the surrounding text.',
      },
    ],
  },
  sections: [
    {
      heading: 'The math features that matter',
      paragraphs: [
        'KaTeX covers the overwhelming majority of real-world TeX: Greek letters and operators, fractions and roots, sums, products and integrals with limits, matrices and cases, accents and decorations, text mode, and multi-line aligned environments. It renders synchronously — no flash of raw TeX, no layout shift when equations pop in.',
      ],
      bullets: [
        'Inline math that respects line height and baseline',
        'Display math centered with proper vertical rhythm',
        'Equations never split across page breaks',
        'Unicode input works too — write θ directly or \\theta, both render',
      ],
    },
    {
      heading: 'For students, teachers and researchers',
      paragraphs: [
        'Problem sets with numbered exercises, lecture notes with derivations, cheat sheets that cram a semester into two pages (the Compact skin exists for exactly this), draft papers before they graduate to a journal template. Because documents live in your browser and work offline, the workflow survives exam-season Wi-Fi.',
      ],
    },
    {
      heading: 'When you outgrow it',
      paragraphs: [
        'Scripto is not a LaTeX replacement for camera-ready journal submission — BibTeX, cross-references and journal class files remain LaTeX territory. It is the fastest path for the 95% of math documents that never needed all that. For a full pipeline comparison, see Scripto vs Pandoc.',
      ],
    },
  ],
  faq: [
    {
      q: 'Is it real LaTeX?',
      a: 'It is KaTeX — the fastest web implementation of TeX math syntax. Math notation is TeX; document-level LaTeX (packages, BibTeX, \\ref) is out of scope.',
    },
    {
      q: 'Do equations stay sharp in the PDF?',
      a: 'Yes. Math is typeset as text and vector glyphs, not screenshots — it prints at full resolution and stays selectable.',
    },
    {
      q: 'Can I number equations?',
      a: 'Use \\tag{1} inside display math for explicit numbering; automatic global equation counters are not yet built in.',
    },
    {
      q: 'Does chemistry notation work?',
      a: 'KaTeX’s mhchem extension syntax (\\ce{H2O}) is supported by the KaTeX build Scripto uses for common chemical equations.',
    },
    {
      q: 'Can I mix math with diagrams and code?',
      a: 'Freely — KaTeX, Mermaid diagrams and highlighted code blocks all coexist in one document and all export correctly.',
    },
  ],
  related: [
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Mermaid diagrams to PDF', to: '/markdown-to-pdf-with-mermaid' },
    { label: 'Academic paper template', to: '/templates/academic' },
    { label: 'Cheat sheet template', to: '/templates/cheatsheet' },
    { label: 'Scripto vs Pandoc', to: '/vs/pandoc' },
  ],
  templateIds: ['academic', 'cheatsheet', 'syllabus', 'report'],
  ctaQuery: '?template=academic',
  ctaLabel: 'Start an academic document',
}
