# Prompt — Independently verify the v2 + handwriting work

> Paste into a **fresh** Claude Code session with a browser available. Your job is to
> **test, not to build.** Do not implement features. Fix only what you can prove is broken,
> and say so explicitly when you do.
>
> Assume nothing in this document is true. Everything below is a *claim made by the
> engineer who wrote the code*. Your job is to confirm or refute each one.

---

## 0. Ground rules

- Work on branch `dev`. The baseline for every "did this regress?" question is **`bc6eba0`**
  (the commit before this work started). Create a worktree for it:
  ```bash
  git worktree add /tmp/scripto-base bc6eba0
  ln -sfn "$PWD/node_modules" /tmp/scripto-base/node_modules
  ```
- **Report per commit.** For each of the 14 commits below: PASS / FAIL / NOT VERIFIED, with
  the evidence. "Looks fine" is not evidence — a screenshot, a test name, or a measured
  number is.
- When something fails, say whether it also fails on `bc6eba0`. A pre-existing bug is not a
  regression, and the distinction matters.
- Do not trust the commit messages. Several make specific measurable claims. Check them.

## 1. Gates that must be green

```bash
npm install
npx tsc -b --force && npm run lint && npm run build && npm run test
SCRIPTO_VISUAL=1 npm run test
```

Expected, and worth confirming rather than assuming:

| Gate | Expected |
| --- | --- |
| `tsc` | clean |
| `lint` | **0 errors**, 12 warnings (all pre-existing `react-refresh` / unused-directive) |
| `test` | all pass, 26 skipped |
| `SCRIPTO_VISUAL=1` | **19 passed · 6 failed · 1 expected-fail** |

⚠️ Those **6 visual failures are claimed to be pre-existing**. Verify that claim by running
the same suite in `/tmp/scripto-base` after copying `tests/visual/harness.ts` across (the
baseline's own harness produces no output at all — see §3). If the counts differ, that is a
regression and a finding.

## 2. The invariant that matters most

`.scripto-doc` is cloned verbatim into the PDF / HTML / Word exports. Everything the Stage
system added is supposed to live outside it.

- [ ] Export a PDF from a document with tables, code, math, Mermaid, ASCII art and images.
      Export the same document from `/tmp/scripto-base`. **Diff the layout.** Any difference
      that is not explained by the deliberate `document.css` changes (commit `e96999e`) is a
      regression.
- [ ] Export HTML and Word. Grep the output for `stage-`, `skin-thumb`, `break-layer`,
      `skin-palette`. **Any hit is a bug.**
- [ ] With handwriting off, confirm the exported PDF is byte-identical in layout to the
      baseline, and that the network tab shows **zero** handwriting font requests.

## 3. Claims to check, commit by commit

**`8a3d312` decompose App.tsx** — claims no behaviour change except three deliberate fixes.
Exercise every ⌘K command, every header menu item, every dialog. Check the AI abort actually
fires on unmount (DevTools → Network, start an AI action, navigate away).

**`9785a18` Preview Stage system** — claims 21 distinct stages, ≤12 KB gzipped CSS, 0 image
bytes, and that typing never re-renders `StageBackdrop`.
- [ ] Screenshot all 35 skins now. Are any two indistinguishable at 240 px?
- [ ] Measure the CSS: `npx esbuild src/preview/stage/stage.css --minify | gzip -9 | wc -c`.
- [ ] React Profiler: type 60 characters. Does `StageBackdrop` re-render? It must not.
- [ ] Rapidly switch skins 20 times. Any stuck backdrop or half-faded label is a failure.

**`e8b4611` page-break editor** — claims insert→remove restores the document byte for byte.
- [ ] Do it in the UI on a real document. Compare the source before and after, exactly.
- [ ] Check Keep-together and Landscape actually change pagination.
- [ ] Confirm undo (⌘Z) reverses a break insertion.

**`3b19365` export presets** — claims a preset never carries document `meta`.
- [ ] Save a preset from a document with a title and author. Export the `.json`. **Open it
      and confirm no title or author is in there.**
- [ ] Import a deliberately malformed `.json`. It must be rejected, not crash the app.

**`7b3dd56` Paged.js stall** — claims the harness was broken on Chrome ≥132 and the stall is
an upstream defect, unfixed on purpose.
- [ ] Confirm `SCRIPTO_VISUAL=1` produces **no output at all** on the untouched baseline.
- [ ] Confirm the `it.fails` tripwire is genuinely failing-as-expected, not silently passing.
- [ ] Read `docs/PAGEDJS_IMAGE_STALL.md` and spot-check two of its "ruled out" rows yourself.

**`e96999e` skin component language** — this one **deliberately changes exported PDFs**.
- [ ] Confirm the change is confined to callouts, code blocks, quotes, tables, rules and
      lists, and that no skin became *less* legible.
- [ ] Check Terminal and Dark specifically, in light and dark UI. Claim: they used to render
      pale text on a white sheet in light mode. Verify that is fixed and that preview matches
      PDF for both.

**`7dd6102` / `51f441a` new skins** — 35 total, each with a stage and a marketing page.
- [ ] `npm run build` should prerender 118 pages. Open `/skins/invoice` and `/skins/chalkboard`.
- [ ] Confirm every skin has an Arabic label (switch the UI to العربية and open the picker).

**`42cb1e3` templates** — claims all 54 except Blank declare a skin, and that the rewritten
ones contain no placeholder text.
- [ ] Script it: parse `src/data/templates.ts`, assert each has `skin:` in its front-matter.
- [ ] Open every template in the app. Any that still reads as filler is a finding — note it.
      **`menu` is known to still be placeholder-heavy.**

**`40c2848` numbering + record validation**
- [ ] Turn on numbered headings, then paste a document whose headings are `# 1 · Thing`,
      `# 2 · Other`. There must be no double numbering.
- [ ] Check `2024 Annual Report` and `3D Rendering` are still auto-numbered (not mistaken for
      manual numbering).
- [ ] Put junk in `localStorage['scripto:library:v1']` — `{"docs":[{"content":"x","config":{"meta":null}}]}` —
      reload. The app must survive.

**`b1a32d0` / `a70fb97` skin palette**
- [ ] Hover a card: the preview changes but the config must **not** be written. Confirm via
      `localStorage['scripto:library:v1']`.
- [ ] Escape and click-away must restore the committed skin.
- [ ] Keyboard: arrows walk the grid, Enter applies. Check with a screen reader if you can.

**`94e6735` / `51f441a` / `ef49350` handwriting**
- [ ] **`hand: 'none'` is a total no-op.** No `data-hand` attribute, no `--hw-*` property, no
      font request. This is the single most important handwriting claim.
- [ ] Determinism: open Print Preview five times on the same document. Page count and page
      breaks must be identical every time.
- [ ] Ruled paper: export a **5-page** ruled document. Check page 1, page 3 and the last page.
      Every line of body text must sit on a rule. **If page 4 drifts, this is not done.**
- [ ] Arabic: export with `hand: ruqaa` and with `hand: nastaliq`. Letterforms must be
      connected, direction right-to-left, numbering in Arabic-Indic digits.
- [ ] Confirm the exported PDF text is still **selectable and searchable** — nothing rasterised.
- [ ] Code, maths and Mermaid must stay in their own typefaces, never the hand.
- [ ] Drag the neatness slider on a 20-page document. It must be instant, with no
      re-pagination.
- [ ] Offline (DevTools): a previously used hand still works; a new one fails with an honest
      message and **does not apply**.
- [ ] 20k-word document: confirm it degrades to no variation rather than freezing.

## 4. Cross-cutting checks

- [ ] العربية end to end: RTL chrome, RTL document, code and maths still LTR, page numbers
      `1 / N` LTR. **Look for any English string left in the Arabic UI** — two were found this
      way already (the paginator's progress messages, and the error boundary).
- [ ] `prefers-reduced-motion: reduce` — no movement anywhere, textures still present.
- [ ] 375 px width — everything usable; the palette and rail must not trap the layout.
- [ ] Passphrase lock → reload → unlock: documents, presets and hand settings all intact.
- [ ] Offline (PWA): edit and export still work.
- [ ] Lighthouse on `/` ≥ 95 Perf/SEO/A11y, and confirm marketing pages still ship **zero**
      framework JS.
- [ ] Bundle: report the CSS gzip delta against `bc6eba0`. It has grown; confirm by how much
      and whether that is justified.

## 5. Tooling you may want

There is no committed screenshot harness. If you want one, drive Chrome over the DevTools
Protocol — **not** `--dump-dom` with `--virtual-time-budget`, which silently does nothing on
Chrome ≥132 (that was the harness bug fixed in `7b3dd56`). `tests/visual/harness.ts` has a
working minimal CDP client to copy.

Useful: seed `localStorage` from the marketing origin (`/`) rather than `/app` — the editor
flushes its own library on `pagehide` and will overwrite your seed on the way out.

## 6. Report back

For each commit: verdict, evidence, and any finding with a minimal reproduction. Then:

1. Anything that regressed against `bc6eba0`.
2. Anything the commit messages claim that you could not confirm.
3. The three findings you would fix first, in order, with your reasoning.
