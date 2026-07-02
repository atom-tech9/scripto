---
title: 'The Best Way to Make an Arabic PDF from Markdown in 2026'
description: 'Why Arabic breaks most Markdown-to-PDF pipelines — bidi, shaping, mirrored page furniture — and a free in-browser workflow that gets all of it right.'
date: '2026-06-28'
keyword: 'arabic pdf from markdown'
---

Try exporting an Arabic document through a typical Markdown-to-PDF pipeline and you will meet a
predictable parade of bugs: numbers reading backwards, punctuation stranded on the wrong side of
the line, page numbers sitting bottom-left like the document is still English, and — in the worst
toolchains — disconnected letter forms that no Arabic reader should be shown.

None of this is because Arabic is "hard". It is because most pipelines treat right-to-left as a
text-alignment option instead of what it actually is: a different page geometry.

## What a correct Arabic PDF requires

**1. The Unicode bidirectional algorithm, per paragraph.** Real documents mix directions — an
Arabic sentence quoting an English product name, a phone number, a code identifier. Bidi decides
the visual order; skip it and mixed lines scramble.

**2. Contextual shaping.** Arabic letters change form by position (initial, medial, final,
isolated). Any pipeline that renders text through a layout engine without proper shaping produces
the dreaded disconnected letters.

**3. Mirrored page furniture.** In an RTL document the *entire page* mirrors: margins, running
headers, footer order, list indentation, table flow, even where "page 3 of 12" sits. This is the
part almost every exporter forgets.

**4. Fonts designed for Arabic at print sizes.** System defaults are tuned for UI labels, not body
text. A print document wants a proper naskh for reading or a modern sans like Cairo for reports.

## The pipelines, compared

- **LaTeX (babel/polyglossia + ArabTeX/XeLaTeX)** — can be excellent, after a specialist setup that
  most people abandon halfway.
- **Word / Google Docs** — fine RTL text support, but no Markdown source, and their PDF export
  flattens document structure.
- **Browser print of a rendered page** — shaping works (browsers are great at Arabic), but no
  running headers, no mirrored page numbers, breaks land anywhere.
- **[Scripto](/app)** — uses the browser's world-class Arabic text engine *and* adds the paged
  layer: direction is a document setting that mirrors headers, footers, page numbers and lists,
  with Cairo, Noto Naskh Arabic and Amiri bundled.

## The two-minute workflow

1. Open [Scripto](/app) — switch the UI to Arabic if you like (سكربتو is fully translated).
2. In document settings, set **direction: RTL** and pick an Arabic font stack.
3. Paste your Markdown. Headings, lists, tables and quotes mirror instantly in the paginated
   preview — including mixed Arabic/English lines.
4. Export. The PDF's headers, footers and page numbers come out mirrored and correct.

Everything runs client-side, so contracts and internal reports never leave your machine — and the
whole thing works offline as a PWA.

## The details that sell the result

- Use **Amiri** for classical/formal documents, **Noto Naskh** for comfortable body text,
  **Cairo** for modern corporate reports.
- Arabic-Indic digits (١٢٣) render exactly as typed; pick one digit style per document and stay
  consistent.
- For an Arabic resume, combine RTL with the single-column resume skin — see the
  [resume guide](/resume-to-pdf).

The full walkthrough lives here: [Arabic Markdown to PDF](/markdown-to-pdf-arabic) — also available
[بالعربية](/ar/markdown-to-pdf-arabic).
