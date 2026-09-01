# Paged.js stalls on an image at a page boundary — fixed

Findings from the Phase D investigation in `docs/V2_FRONTEND_PROMPT.md` §5, which
started from `docs/PAGEDJS_RTL_DEBUG_PROMPT.md`. The original hypothesis there —
`overflow-x: auto` + `dir=rtl` preventing the chunker from converging — is
**wrong**. The trigger is narrower and has nothing to do with RTL.

**Status: fixed.** `src/pdf/flattenImages.ts` swaps every `<img>` for an
equivalent `background-image` box before pagination. The `image-stall` fixture
went from an unbounded hang to 3 pages in under 3 seconds, and the visual suite
is green at 26/26.

## What happened

Paged.js 0.4.3 laid out two pages and then stopped dead. The page count never
grew, `PagedConfig.after` never fired, and nothing threw. It was a **stall, not
a runaway loop** — an important distinction, because a runaway would have been
capped by a page limit.

The 45 s watchdog in `src/pdf/renderPaged.ts` turned this into a clean error
rather than a frozen tab. That safety net stays.

## Repro

`tests/visual/fixtures/image-stall.md` — the minimal case, bisected down from the
`checklists` fixture. Seven sections of ordinary content followed by a paragraph
containing one 1×1 GIF data-URI image, which has to be placed at a page
boundary.

```bash
SCRIPTO_VISUAL=1 npx vitest run tests/visual/layout.test.ts
```

`layout.test.ts` now carries `paginates an image sitting on a page boundary` as
an ordinary regression test.

## Ruled out

Each of these was tested against the minimal repro and did **not** fix the stall:

| Hypothesis | Result |
| --- | --- |
| RTL / `dir=rtl` | Not involved — the repro is pure LTR |
| Task lists / checkbox items | Not involved — a plain paragraph stalls identically |
| `break-inside: avoid` on `img` | Still stalls with `break-inside: auto` |
| `overflow-x: auto` on `pre` / `.table-wrap` | Not involved; already `overflow: visible` while paginating |
| Unresolved image box | Still stalls with an explicit `width`/`height` in the page CSS |
| `display: block` + `margin: auto` | Still stalls as `display: inline; margin: 0` |
| Image not decoded before layout | Still stalls after awaiting every image |
| Image is the last node in the document | Still stalls with a paragraph and a whole section after it |
| Wrapping the `img` in an explicitly sized `div` | Still stalls |

## The cause

Replacing the `<img>` with **any non-replaced element** — a `div` carrying the
same picture as a `background-image` — paginates cleanly, every time. The
chunker's difficulty is with the replaced element itself.

## Why the fix was safe to ship this time

The workaround was written up but held back because browsers do not print
background images unless `print-color-adjust: exact` applies, and Chrome's
"Background graphics" toggle is **off by default**. Getting that wrong would
silently drop images from exported PDFs — far worse than the stall.

That objection is now closed. `.pagedjs_page, .pagedjs_page *` carry
`print-color-adjust: exact`, and the flattened boxes set it inline as well, so
the picture no longer depends on the dialog. Verified end to end by driving the
real export over the DevTools Protocol with `printBackground: false`: the
exported PDF contains the image as a 64×64 XObject and renders it correctly.

## Two ordering bugs found along the way

Both were real, and either alone would have defeated the workaround:

1. **`preloadImages` ran *after* `buildExportContent`**, so the DOM transforms
   saw images that had not decoded and reported no intrinsic size.
2. **The renderer marks images `loading="lazy"`.** Anything below the fold never
   loads, and an export clone is never scrolled — so those images reported no
   intrinsic size at all. `preloadImages` now forces `loading="eager"` and
   `decoding="sync"` on the clone before waiting.

## Sizing

`flattenImages` sizes each box from the image's **intrinsic** dimensions, not a
measured box: it runs against the editor pane, whose width is not the printed
page's width, so a baked pixel size would be wrong on paper. `width` +
`max-width: 100%` + `aspect-ratio` reproduces how an `<img>` with `height: auto`
behaves in flow. An image with no intrinsic size is left as an `<img>`.
