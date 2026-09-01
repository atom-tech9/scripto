# Paged.js stalls on an image at a page boundary

Findings from the Phase D investigation in `docs/V2_FRONTEND_PROMPT.md` §5, which
started from `docs/PAGEDJS_RTL_DEBUG_PROMPT.md`. The original hypothesis there —
`overflow-x: auto` + `dir=rtl` preventing the chunker from converging — is
**wrong**. The trigger is narrower and has nothing to do with RTL.

## What happens

Paged.js 0.4.3 lays out two pages and then stops dead. The page count never
grows, `PagedConfig.after` never fires, and nothing throws. It is a **stall, not
a runaway loop** — an important distinction, because a runaway would have been
capped by a page limit.

In the app the 45 s watchdog in `src/pdf/renderPaged.ts` turns this into a clean
error, so users see a failure rather than a frozen tab. That safety net stays.

## Repro

`tests/visual/fixtures/image-stall.md` — the minimal case, bisected down from the
`checklists` fixture. It is seven sections of ordinary content followed by a
paragraph containing one 1×1 GIF data-URI image. The image has to be placed at a
page boundary; that is the whole trigger.

```bash
SCRIPTO_VISUAL=1 npx vitest run tests/visual/layout.test.ts
```

`layout.test.ts` carries it as an `it.fails` tripwire: it passes while the bug
exists and starts failing the moment it is fixed, so any mitigation gets removed
deliberately instead of by accident.

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
| Image not decoded before layout | Still stalls after awaiting every image, as the export does |
| Image is the last node in the document | Still stalls with a paragraph and a whole section after it |
| Wrapping the `img` in an explicitly sized `div` | Still stalls |

## The actual cause

Replacing the `<img>` with **any non-replaced element** — a `div` carrying the
same picture as a `background-image` — paginates cleanly, every time. The
chunker's difficulty is with the replaced element itself.

## Why no fix has shipped

The obvious workaround is to swap `<img>` for a sized `div` with a
`background-image` during pagination. It is not safe to ship as-is:

- Browsers do not print background images unless `print-color-adjust: exact`
  applies, and the print dialog's "Background graphics" toggle is off by default.
  Getting this wrong means images silently vanish from the exported PDF — a far
  worse bug than the one being fixed.
- It needs verification through a real Save-as-PDF on Chrome, Safari and Firefox
  before it can be trusted, not just a green pagination run.

Paged.js 0.4.3 is the latest stable release; 0.5.0 exists only as a beta, so
upgrading the PDF engine is not a safe fix either.

## Recommended next step

Prototype the swap behind a flag in `src/pdf/prepareForPaging.ts`:

1. Measure each image's rendered box on the **live** document before cloning —
   `prepareForPaging` runs on a detached clone, where `getBoundingClientRect`
   returns zero.
2. Replace the `img` with `<div role="img" aria-label="{alt}">` carrying the
   `background-image`, and set `print-color-adjust: exact` on those boxes only.
3. Verify a real Save-as-PDF in Chrome, Safari and Firefox, with the print
   dialog's background-graphics option **off**, before enabling it by default.
4. Delete the `it.fails` tripwire once the stall is gone.
