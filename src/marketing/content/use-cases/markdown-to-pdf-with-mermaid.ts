import type { UseCaseContent } from '../../types'

export const markdownToPdfWithMermaid: UseCaseContent = {
  slug: 'markdown-to-pdf-with-mermaid',
  meta: {
    title: 'Mermaid Diagrams in PDF — Export Markdown Docs Free',
    description:
      'Export Markdown with Mermaid flowcharts, sequence and Gantt diagrams to PDF — diagrams render as crisp vectors inside the document. Free, in your browser.',
    path: '/markdown-to-pdf-with-mermaid',
    keyword: 'markdown mermaid to pdf',
  },
  h1: 'Ship docs where the diagrams are in the PDF.',
  intro: [
    'Mermaid made diagrams-as-code the default for engineering docs: a fenced code block becomes a flowchart, a sequence diagram, a state machine. But the moment those docs need to leave the wiki as a PDF, most exporters print the code block instead of the diagram — or rasterize it into a blurry screenshot.',
    'Scripto renders Mermaid natively in the preview and carries the rendered diagram into the exported PDF as a crisp vector, scaled to fit the page and never split across a page break.',
  ],
  howTo: {
    title: 'How to export Mermaid diagrams to PDF',
    steps: [
      {
        name: 'Write a mermaid code block',
        text: 'Fence your diagram with ```mermaid — flowchart, sequenceDiagram, classDiagram, erDiagram, gantt, stateDiagram and more.',
      },
      {
        name: 'See it rendered instantly',
        text: 'The preview draws the diagram as you type, with syntax errors surfaced inline instead of a blank box.',
      },
      {
        name: 'Let pagination handle placement',
        text: 'Diagrams are kept whole: if one doesn’t fit the remaining space, it moves to the next page with its caption.',
      },
      {
        name: 'Export PDF',
        text: 'Diagrams export as sharp vectors — zoom to 800% in the PDF and the lines stay clean.',
      },
    ],
  },
  sections: [
    {
      heading: 'All the diagram types your docs use',
      paragraphs: [
        'Scripto ships current Mermaid with the full grammar set: flowcharts, sequence diagrams, class and ER diagrams, state machines, Gantt charts, git graphs, user journeys, pie charts, mind maps and timelines. There are ready-made templates for each, so a new architecture doc starts from a working diagram, not from the docs page.',
      ],
    },
    {
      heading: 'Why vector output matters',
      paragraphs: [
        'Screenshot pipelines rasterize diagrams at screen resolution; on paper (or on a retina display at 150% zoom) the text inside nodes turns to mush. Scripto keeps the diagram as vector graphics through the whole pipeline, so labels stay as sharp as the body text, and the PDF stays small.',
      ],
    },
    {
      heading: 'Architecture docs, RFCs, runbooks',
      paragraphs: [
        'Pair Mermaid with the rest of the technical toolkit — code blocks with highlighting, callout boxes, footnotes, a table of contents — and export design docs the whole company can read: engineers get the source in git, everyone else gets a paginated PDF with the diagrams intact.',
      ],
    },
  ],
  faq: [
    {
      q: 'Which Mermaid diagram types are supported?',
      a: 'Everything in current Mermaid: flowchart, sequence, class, ER, state, Gantt, gitgraph, journey, pie, mindmap and timeline. Scripto ships templates for each.',
    },
    {
      q: 'Are diagrams raster or vector in the PDF?',
      a: 'Vector. They scale losslessly in the exported file and print cleanly at any size.',
    },
    {
      q: 'What happens if a diagram is bigger than the page?',
      a: 'It is scaled down proportionally to fit the content width, and kept on a single page rather than being sliced by a page break.',
    },
    {
      q: 'Can I theme diagrams to match my document skin?',
      a: 'Mermaid’s default theme is tuned to match the document typography; per-diagram directives (%%{init: ...}%%) work for custom theming.',
    },
    {
      q: 'Does this work offline?',
      a: 'Yes — Mermaid runs locally like everything else. Install Scripto as a PWA and export diagram-heavy PDFs with no connection.',
    },
  ],
  related: [
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'README to PDF', to: '/readme-to-pdf' },
    { label: 'Flowchart template', to: '/templates/diagram-flowchart' },
    { label: 'Sequence diagram template', to: '/templates/diagram-sequence' },
    { label: 'Math & LaTeX to PDF', to: '/markdown-to-pdf-with-math' },
  ],
  templateIds: ['diagram-flowchart', 'diagram-sequence', 'diagram-gantt', 'diagram-er'],
  ctaQuery: '?template=diagram-flowchart',
  ctaLabel: 'Try a Mermaid template',
}
