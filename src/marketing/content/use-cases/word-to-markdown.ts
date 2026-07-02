import type { UseCaseContent } from '../../types'

export const wordToMarkdown: UseCaseContent = {
  slug: 'word-to-markdown',
  meta: {
    title: 'Word to Markdown — Convert DOCX Files Free & Privately',
    description:
      'Convert Word documents (DOCX) to clean Markdown in your browser — headings, lists, tables and images preserved, no upload. Then export a typeset PDF.',
    path: '/word-to-markdown',
    keyword: 'word to markdown',
  },
  h1: 'Set your documents free: DOCX → Markdown.',
  intro: [
    'Word documents age badly: layouts drift between machines, tracked changes fossilize, and the content is locked to one editor. Markdown is the escape hatch — but retyping a 30-page DOCX is nobody’s afternoon.',
    'Scripto imports .docx directly: drop the file into the editor and it is converted to structured Markdown locally (Mammoth under the hood) — heading levels from Word styles, lists, tables, bold and italics, hyperlinks and embedded images. From there it is plain text you can version, reuse and typeset into a far better PDF than Word ever printed.',
  ],
  howTo: {
    title: 'How to convert a Word document to Markdown',
    steps: [
      {
        name: 'Drop the .docx into Scripto',
        text: 'Drag the file into the editor (or use Import). Conversion happens instantly, in your browser.',
      },
      {
        name: 'Review the structure',
        text: 'Word’s Heading 1/2/3 styles become #, ##, ### — check the outline panel to confirm the hierarchy came through.',
      },
      {
        name: 'Clean up Word-isms',
        text: 'Manual formatting (bold lines pretending to be headings) needs a quick promote-to-heading pass — a minute, not an afternoon.',
      },
      {
        name: 'Save or export',
        text: 'Keep the Markdown in your library, commit it to a repo, or export a freshly typeset PDF with a proper skin.',
      },
    ],
  },
  sections: [
    {
      heading: 'What converts, honestly',
      paragraphs: [
        'Reliable: styled headings, paragraphs, bold/italic/underline-as-emphasis, ordered and bulleted lists with nesting, hyperlinks, simple tables, embedded images and footnotes. Lossy by design: colored text, columns, text boxes, headers/footers and page-level layout — Markdown has no vocabulary for these, and that is precisely why the result is portable.',
        'The one habit that makes conversions perfect: documents that use Word’s style system (Heading 1, Heading 2) convert flawlessly; documents formatted by hand need that quick promote pass afterwards.',
      ],
    },
    {
      heading: 'Word → Markdown → beautiful PDF',
      paragraphs: [
        'The round trip is the payoff. A DOCX that looked like 2009 comes out of the pipeline as Markdown, then goes back to your client as a typeset PDF with a modern skin, running headers and a table of contents — while you keep the source in git next to the code it documents.',
      ],
    },
    {
      heading: 'Contracts and confidential docs welcome',
      paragraphs: [
        'DOCX converters online mean uploading your contract to a stranger’s server. Scripto parses the file in-browser; the document never leaves your machine, and the optional passphrase vault encrypts what you keep.',
      ],
    },
  ],
  faq: [
    {
      q: 'Are images from the Word file preserved?',
      a: 'Embedded images are extracted and inlined into the document during import, so they show in the preview and export to PDF.',
    },
    {
      q: 'Do Word tables convert?',
      a: 'Simple tables convert to Markdown pipe tables. Merged cells and nested tables are flattened — review them in the preview.',
    },
    {
      q: 'What about tracked changes and comments?',
      a: 'The conversion takes the document’s current (accepted) text; tracked-change markup and comments are not carried into Markdown.',
    },
    {
      q: 'Can I convert .doc (the old format)?',
      a: 'Only .docx is supported. Open the .doc in Word/LibreOffice, save as .docx, then import.',
    },
    {
      q: 'Is the file uploaded for conversion?',
      a: 'No — parsing happens locally with Mammoth.js. Nothing is transmitted.',
    },
  ],
  related: [
    { label: 'HTML to Markdown', to: '/html-to-markdown' },
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Scripto vs Typora', to: '/vs/typora' },
    { label: 'Markdown cheat sheet', to: '/markdown-cheat-sheet' },
  ],
  templateIds: ['report', 'proposal', 'letter'],
}
