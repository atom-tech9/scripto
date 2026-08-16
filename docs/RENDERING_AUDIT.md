# Rendering audit & page-layout features

Written 2026-08-16. Covers the checklist/code/table rendering bugs found from two
editor screenshots, the fixes, the new author-facing layout controls, and what is
still open.

---

## 1 · The bug that started it

Every checklist in the editor was rendering as columns — bold runs in one column,
inline code broken to one character per line in another.

One declaration caused it:

```css
.scripto-doc .task-list-item { display: flex }
```

A flex container promotes **every inline child to a flex item**. So `**bold**`,
`` `code` ``, and each text run became its own column. `word-break: break-word`
on inline code then let those items shrink to their min-content width, which for
a code token is a single character.

Replaced with normal inline flow and a hanging checkbox:

```css
.scripto-doc li.task-list-item { list-style: none }
.scripto-doc .task-list-item input[type='checkbox'] {
  font: inherit;                      /* the HTML export ships no Tailwind preflight */
  margin-inline: -1.55em 0.5em;       /* hangs into the list's own indent */
}
```

Five further defects fell out of the same rule and were fixed with it:

| Symptom | Why |
| --- | --- |
| Nested checklists rendered sideways | A nested `<ul>` became a sibling flex column |
| Plain bullets lost their markers next to task items | `list-style: none` was on the list, not the item |
| Ordered checklists lost their numbering | A flex item is not a `list-item`, so the counter never advanced |
| Code blocks and quotes sat beside the checkbox | Block children became flex columns |
| Long URLs ran off the page | A flex item will not shrink below min-content |

---

## 2 · Code blocks

### Long lines were clipped

`pre` had `overflow-x: auto`. A scrollbar means nothing on paper — the excess is
simply cut off. Lines now wrap with `white-space: pre-wrap`, and a wrapped
continuation hangs past the line-number gutter so it reads as a continuation
rather than a new statement.

### Tall blocks jumped pages instead of splitting

The cause was not obvious. `overflow-x: auto` made every block a **scroll
container**, and a scroll container is *monolithic* under CSS fragmentation — it
can never be split, so `break-inside` was being ignored regardless of its value.

Removing it let blocks split, but Paged.js then blanks the line straddling the
page edge. Rather than fight the paginator, the export now cuts long listings
into page-sized atomic pieces before pagination:

- `src/pdf/chunkCodeBlocks.ts` — splits at ~10 rendered rows, estimated from the
  page width and the `pre` metrics.
- `document.css` `[data-code-chunk]` rules — suppress every interior edge so the
  pieces read as one block.

Paged.js therefore only ever places whole blocks, which is the case it handles
correctly. Verified: a 59-line block ends page 2 at line 28 and resumes page 3 at
line 29, with nothing lost.

---

## 3 · Wide tables

Type and padding step down automatically as the column count grows, gated with
`:has()` so it needs no markup from the author:

| Columns | Font | Cell padding |
| --- | --- | --- |
| ≤ 5 | 0.92em | 0.55em 0.85em |
| 6–7 | 0.82em | 0.4em 0.5em |
| 8–9 | 0.74em | 0.3em 0.35em |
| 10+ | stacked — one labelled block per row |

Only long tokens and URLs may break (`overflow-wrap: anywhere` on `code` and `a`
inside cells); ordinary words use `break-word`. Without that split, a long
free-text column starves the rest and headers come out as `Platfor / m`.

Past 10 columns `stackWideTables.ts` copies each header into a `data-label` on the
body cells and CSS renders one labelled block per row — CSS alone cannot reach
across rows to fetch a header.

---

## 4 · New author controls

Three directives, handled by `remarkPageDirectives.ts`:

```markdown
::page-break                  start the next block on a fresh page

:::keep-together              never split this run across a page boundary
| Step | Owner |
| --- | --- |
| Draft | Platform |
:::

:::landscape                  put this run on its own rotated page
…a table too wide for portrait…
:::
```

`landscape` uses a named `@page` sized from the configured paper, rotated, and
breaks either side of the section.

---

## 5 · Content that still cannot fit

`src/pdf/fitToPage.ts` runs after pagination and scales down anything still wider
than its page — display math, diagrams, ASCII figures, code. Type size is reduced
rather than a transform applied, because that also shrinks the element's box; a
transform would leave the original height behind as a gap. Shrinking only frees
vertical space, so the pages already laid out stay valid.

`renderPagedPreview` now returns `fit: { scaled, clipped }` so the UI can warn
when something was still too wide at the minimum scale.

---

## 6 · Export leaks fixed

- The **Copy** button was being printed into every PDF.
- Every checkbox carried `node="[object Object]"` into the preview DOM, the
  standalone HTML export, and the PDF (react-markdown's hast node, spread onto
  the element).
- The standalone HTML export linked KaTeX CSS from a CDN. If unreachable,
  `.katex-mathml` stops being hidden and every equation renders twice — once
  typeset, once as raw MathML. Now inlined, so the export is genuinely
  self-contained. The Word export gained the same stylesheet, so math survives
  there too.

---

## 7 · Visual regression harness

`tests/visual/` renders fixtures through the **real** pipeline — same stylesheet,
same `buildPageCss`, same export DOM transforms, same paginator — then asserts on
the laid-out result:

- no element extends past the page content box
- the rendered code-line sequence matches the source exactly
- no line renders blank where the source has content

Fixtures: `checklists`, `code-blocks`, `tables`, `structure`, `rtl-arabic`,
`page-directives`. Every bug in this document would have been caught by the first
assertion alone.

### Status: opt-in, not yet gating

```bash
SCRIPTO_VISUAL=1 npm test
```

Headless Chrome's `--dump-dom` races Paged.js's async layout under a virtual time
budget — the run is not yet reliable enough to gate commits on. Two things were
found and fixed along the way and are worth knowing:

- Paged.js **preloads every `@font-face`** before laying out, and stalls silently
  — zero pages, no error — if one cannot load. KaTeX's relative font URLs resolve
  nowhere from a temp page, so the harness embeds the faces as data URIs.
- `PagedConfig.before` / `.after` are the supported hooks for running transforms
  and probing results; `window.PagedPolyfill` does not exist.

**Remaining fix:** drive Chrome over the DevTools Protocol and wait on the
`after` hook, instead of `--dump-dom` plus a virtual time budget.

---

## 8 · Still open

| Item | Note |
| --- | --- |
| Harness reliability | See above — the blocker to making it gate CI |
| Chunk slack | Code chunks are ~10 rows, so a page can end that far short |
| Stacked table rendering | Transform and CSS are in, but not yet visually confirmed end to end |
| Templates | 5 proposed (Arabic/bilingual invoice, incident postmortem, ADR, statement of work, investor update) — not built. With 55 templates and 19 skins already shipped this was judged the lowest-value track |
| Export presets | Named bundles of paper size, margins, skin and font — not started |
