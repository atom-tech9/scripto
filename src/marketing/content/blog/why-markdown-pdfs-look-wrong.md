---
title: 'Why Your Markdown PDF Looks Wrong (and the Pagination Fix)'
description: 'Orphaned headings, sliced tables, missing page numbers — the real reason Markdown-to-PDF output disappoints, and how CSS paged media fixes it.'
date: '2026-06-20'
keyword: 'markdown pdf pagination'
---

Every developer has produced one: a PDF where the section heading sits alone at the bottom of page
4, its content beginning on page 5. A table cut mid-row. A code block that walks off the margin.
No page numbers anywhere, because the tool never thought about pages at all.

The root cause is always the same, and it is architectural, not cosmetic.

## Web layout has no concept of a page

HTML/CSS layout — the engine behind almost every Markdown exporter — produces **one infinite
column**. When you "export to PDF", that column gets guillotined into page-sized slices at the last
moment, by code that knows nothing about your document's structure. The guillotine doesn't know
that a heading belongs with its paragraph, that a table row shouldn't be bisected, or that you
might want the chapter name repeated at the top of each page.

Print typesetting works in the opposite order: **pages first**. The engine knows the page geometry
before flowing a single word, so it can apply centuries-old composition rules as it goes.

## The rules a real engine applies

- **Keep-with-next** — a heading is never stranded at a page's bottom edge.
- **Widow/orphan control** — no lonely first or last lines separated from their paragraph.
- **Break avoidance** — figures, diagrams and short code blocks move whole to the next page rather
  than splitting.
- **Repetition** — long tables repeat their header row after every break.
- **Running furniture** — headers, footers and `page X of Y` counters stamped on every page,
  possibly mirrored for RTL documents.

## CSS paged media: the standard nobody uses

The irony is that CSS already specifies all of this — `@page` rules, margin boxes, page counters,
`break-inside: avoid` — in the *paged media* module. Browsers implement it only partially, because
browsers exist to scroll. [Paged.js](https://pagedjs.org) is the open-source polyfill that
implements the standard properly, chunking a document into real page boxes.

That is the engine inside [Scripto](/app). Your Markdown becomes HTML, the paged engine lays it
into pages, and — the crucial part — **the preview pane shows those pages while you type**. The
export step doesn't decide anything; it records what you already saw.

## Seeing it in one paste

Take any Markdown document that has burned you before and paste it into [the editor](/app):

1. Scroll the preview — breaks fall between sections, headings hug their content.
2. Toggle a skin — the whole document restyles for print without touching the source.
3. Turn on the table of contents — entries link to the right pages, numbered.
4. Export — the PDF matches the preview page for page, because it *is* the preview.

The deep-dive guide lives at [Markdown to PDF](/markdown-to-pdf). If your documents involve math or
diagrams, those have their own guides: [KaTeX](/markdown-to-pdf-with-math) and
[Mermaid](/markdown-to-pdf-with-mermaid).
