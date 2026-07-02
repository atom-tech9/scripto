# Prompt — Root-cause the Paged.js pagination hang on RTL / Arabic documents

Paste into a fresh Claude Code session (one that can run the dev server + a browser).

---

**Bug:** Exporting/print-previewing some **Arabic (RTL)** documents gets stuck at **"Laying out pages"**
— Paged.js renders the first pages then never finishes (infinite chunker loop). A safety **watchdog**
(45s) and per-image timeout already exist in `src/pdf/renderPaged.ts`, so it now fails gracefully
instead of hanging — **but the real cause is unfixed**: RTL docs should paginate fully.

**Known-good repro doc** (previews fine, PDF hangs): a full Arabic Markdown doc with headings, ordered
+ nested unordered lists, a blockquote, a **fenced `javascript` code block containing Arabic inside a
template literal**, a 3-column table, a link, an image `![](https://via.placeholder.com/400x200)`
(host is currently down), a task list, and `$$E = mc^2$$`. It stalls around the code-block section.

## How to debug (bisect live)
1. Run `npm run dev`, open the doc, open Print preview, watch where it stalls.
2. **Bisect the content** — remove elements one at a time and re-test to isolate the trigger:
   the broken image, the code block (`pre` is forced `direction: ltr` inside RTL), the table
   (`.table-wrap` has `overflow-x: auto`), KaTeX display. Note which removal unblocks it.
3. **Test `dir` isolation**: does the same doc paginate when the document direction is `ltr`? If yes,
   it's an RTL-specific Paged.js layout loop.
4. Check the relevant CSS in `src/styles/document.css` + `src/pdf/pageStyles.ts`: `break-inside: avoid`
   on code/tables/figures, `overflow-x: auto` on `pre`/`.table-wrap`, and the forced-LTR islands.

## Likely culprits & fixes to try
- **Overflow + RTL**: `overflow-x: auto` on `pre`/`.table-wrap` combined with `dir=rtl` can make the
  Paged.js chunker fail to converge. Try neutralizing horizontal overflow *during pagination* (e.g. a
  print-only rule `.pagedjs_page pre, .pagedjs_page .table-wrap { overflow: visible }` and wrap long
  code) and re-test.
- **Unbreakable element taller than the page**: if any `break-inside: avoid` block can exceed the page
  height, allow it to break as a fallback.
- **Broken image with unknown dimensions**: give images an explicit fallback box (e.g. min-height, or
  strip `src` that failed preload) so the chunker gets a stable height.
- Check Paged.js version + open issues for `direction: rtl` chunker loops; a config/patch may exist.

## Constraints
- Keep the existing watchdog + image timeout as the safety net.
- Don't break LTR export or the "preview === PDF" fidelity. No `any`/`console.log` (use `@/lib/logger`).
- `npx tsc -b --force && npm run build` stay green.

## Acceptance
- The repro Arabic doc paginates to completion and exports a correct RTL PDF (code/math stay LTR).
- LTR docs unaffected; the watchdog still guards against any future pathological doc.
