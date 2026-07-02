---
title: 'How to Convert a Markdown README to PDF (Without Breaking the Code Blocks)'
description: 'A practical, five-minute walkthrough for turning a GitHub README.md into a clean, paginated PDF — code highlighting, tables and badges included.'
date: '2026-07-01'
keyword: 'convert readme to pdf'
---

Sooner or later a README has to leave GitHub. A client asks for the setup guide "as a document", a
security auditor wants an offline copy, a professor wants a PDF submission. And the moment you try,
you discover the two classic failure modes:

1. **Copy-paste into Word** — code blocks lose their font, tables collapse, and every heading needs
   restyling by hand.
2. **Print the GitHub page** — you get GitHub's sidebar, the browser slices tables mid-row, and
   there are no page numbers.

Here is the workflow that actually works, using [Scripto](/app) — a free, in-browser Markdown → PDF
studio with real pagination.

## Step 1 — Get the raw Markdown

On GitHub, open your README and click **Raw**, then select-all and copy. (Or just drag the
`README.md` file from your repo folder — Scripto reads it locally.)

## Step 2 — Paste into Scripto

Open [the editor](/app) and paste. Everything GitHub renders, Scripto renders too: fenced code with
language labels, GFM tables, task lists, footnotes, emoji shortcodes, even shield badges (they are
just images).

The right-hand pane is the important part: it is not a web preview, it is **your document laid out
into real pages**. Scroll it — you will see exactly where page 2 begins.

## Step 3 — Fix the two things READMEs always need

**Give it a cover.** A README starts with an H1 and dives in, which is right for GitHub and abrupt
on paper. Enable the cover page in the export options — title, subtitle, author, date — and the
document instantly reads like documentation instead of a printout.

**Check the long code blocks.** Scripto breaks long blocks at line boundaries and never mid-line,
but a 120-character line will still be wide on A4 portrait. Options: soften the offending lines,
switch the page to landscape, or let the Technical skin's tighter code styling absorb it.

## Step 4 — Pick a skin

For developer docs, two skins earn their keep:

| Skin | Personality |
| --- | --- |
| **Technical** | Boxed code, side-bar headings — reads like good API docs |
| **Blueprint** | Mono accents on an engineering grid — for architecture docs |

One click restyles the whole document; your Markdown never changes.

## Step 5 — Export

**Export PDF**, and you are done. The export is generated *in your browser* — the README of your
private repo never touches a server. Headers carry the project name, every page is numbered, and
the table of contents links actually jump.

## The five-minute checklist

- Raw README → paste into [Scripto](/app)
- Cover page **on**, table of contents **on** for anything over ~6 pages
- Skim the paginated preview for wide code lines
- Technical skin, A4 or Letter
- Export → attach → get on with your day

*Total time: about five minutes for a typical README — and the next one takes two, because your
settings are remembered locally.*
