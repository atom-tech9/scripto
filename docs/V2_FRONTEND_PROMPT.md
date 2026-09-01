# Scripto v2.0 — Frontend Master Brief

> Hand this file to a fresh Claude Code session. It is **self-contained**: it explains the codebase,
> the invariants, and specifies every workstream for v2.0.
>
> **Hard constraint: NO BACKEND.** No server, no accounts, no sync, no share links, no API.
> Everything here runs in the browser. Anything requiring a server is explicitly out of scope
> and listed in §12.
>
> **The headline work is §2 — the Preview Stage system.** Everything else is supporting.

---

## 0. Orientation — read this first

**What Scripto is.** A 100% client-side Markdown → PDF studio at `md.atom.sa`. Vite 5 + React 18 +
TypeScript (strict) + Tailwind 3. Markdown renders through react-markdown (remark/rehype); PDF is
produced by **Paged.js + the browser's native print-to-PDF**. There is a multi-document library in
`localStorage`, optional AES-256 passphrase lock, PWA offline, 21 document skins, 58 templates,
22 presets, full EN + AR with real RTL, and a prerendered zero-JS marketing site (~102 pages).

**Run / verify (all three must stay green):**
```bash
npm install
npm run dev                                   # http://localhost:5173/app
npx tsc -b --force && npm run lint && npm run build
npm run test                                  # 4 suites; visual harness is opt-in
SCRIPTO_VISUAL=1 npm run test                 # opt-in Paged.js layout assertions
```

**Read before writing code:** `ARCHITECTURE.md` (§5 rendering pipeline, §6 PDF engine, §17 RTL),
`docs/RENDERING_AUDIT.md` (why the layout code looks the way it does), `docs/P1_FEATURES.md` §0
(the dialog/command wiring recipe).

### Conventions — non-negotiable
- **TypeScript strict, no `any`.** Use `unknown` + narrowing. Explicit types on exported APIs.
- **Immutable updates** everywhere (spread; never mutate).
- **No `console.log`** — use `logger` from `src/lib/logger.ts` and `getErrorMessage(err)`.
- **Reuse `src/components/ui/*`** — `Button`, `Dialog`, `Field` (`TextInput`/`Select`/`Switch`/
  `Slider`/`Segmented`), `Menu`, `Tooltip`, `Confirm` (`useConfirm()`), toasts via `sonner`.
- **i18n is mandatory.** Every user-visible string goes in `src/lib/i18n.ts` (`EN_STRINGS` **and**
  `STRINGS.ar`) and is read via `useLanguage().t`. A green `tsc` proves no key is missing.
- **Logical CSS only** — `ms-/me-`, `ps-/pe-`, `start-/end-`, `text-start`, `rtl:`. Never
  `ml-/mr-/left-/right-/text-left` in new code. Everything must be correct in LTR **and** RTL.
- **Light + dark** both correct. Design tokens live as CSS vars in `src/index.css`.
- **`prefers-reduced-motion` respected.** The app wraps in `<MotionConfig reducedMotion="user">`;
  reused presets live in `src/lib/motion.ts`.
- Path alias `@/` → `src/`.

### 🚨 The five invariants you must not break

1. **`preview === PDF`.** The live preview element and the exported PDF are produced from the *same*
   rendered DOM and the *same* stylesheet (`src/styles/document.css`). This is the product's moat.
2. **`.scripto-doc` (the `docRef` element in `Preview.tsx`) is cloned verbatim by the export path.**
   `src/pdf/buildExportContent.ts` and `src/io/exporters.ts` both `cloneNode(true)` it. **Anything you
   put inside it ships into the PDF, the HTML export, and the Word export.** Screen-only decoration
   must live *outside* it. This is the single most important rule in this document.
3. **`PreviewHandle.getDocElement()` must keep returning that element.** `PrintPreview.tsx`,
   `exporters.ts` and `useScrollSync.ts` all depend on it. Preserve the contract exactly.
4. **CodeMirror props must be identity-stable.** `useCodeMirror` reconfigures the editor when
   `extensions` / `onChange` / `basicSetup` change by reference, and reconfiguring destroys
   runtime-attached extensions (most visibly the ⌘F search panel). `MarkdownEditor` reads callbacks
   through a ref — keep that pattern.
5. **Print isolation.** `src/styles/print.css` hides everything except `.scripto-print-portal` when
   `body.scripto-printing` is set. Any new chrome must be hidden by that rule or live inside the
   portal. Verify by actually exporting a PDF.

### Key files
| File | Purpose |
| --- | --- |
| `src/App.tsx` | Orchestrator (1,150 lines): state, dialogs, `commands` array, shortcuts, deep links |
| `src/components/preview/Preview.tsx` | **The live preview — the main subject of §2** |
| `src/components/preview/PrintPreview.tsx` | Paged.js modal + Save-as-PDF (subject of §3) |
| `src/pdf/renderPaged.ts` | Runs Paged.js; image preload, 45s watchdog, `fitToPage` |
| `src/pdf/buildExportContent.ts` | Clones the live doc, namespaces ids, prepends cover + TOC |
| `src/pdf/pageStyles.ts` | Generates the `@page` CSS |
| `src/styles/document.css` | **Shared** preview + PDF stylesheet; skins live here (49 KB) |
| `src/styles/print.css` | Print isolation + on-screen page chrome |
| `src/data/skins.ts` | `SKIN_OPTIONS` (21) + `SKIN_VALUES` |
| `src/data/presets.ts` | `DOCUMENT_PRESETS` (22) |
| `src/data/templates.ts` | `TEMPLATES` (58) |
| `src/types/index.ts` | `PdfConfig`, `DocumentSkin`, `DocumentRecord`, `ExportProgress` |
| `src/lib/constants.ts` | `DEFAULT_CONFIG`, `PAPER_SIZES`, `MARGIN_PRESETS`, `FONT_STACKS` |
| `src/lib/motion.ts` | Shared easing/duration/variant presets |
| `src/lib/analytics.ts` | `trackEvent` (Vercel Analytics) |
| `src/hooks/useDocumentLibrary.ts` | The localStorage document library |

---

## 1. The central idea: **the Stage and the Sheet**

Today the preview pane is one white rounded card on a flat grey ground. It is honest and readable —
and completely undesigned. Every skin looks like the same product.

The fix is a hard architectural split:

```
┌─────────────────────────────────── THE STAGE ────────────────────────────────────┐
│  Screen-only. Never cloned. Never printed. Never exported.                        │
│  Ground, texture, lighting, depth, rulers, chrome, motion, transitions.           │
│  This is where 100% of the visual drama lives — with ZERO risk to the PDF.        │
│                                                                                   │
│        ┌───────────────────── THE SHEET (.scripto-doc) ─────────────────┐         │
│        │  SACRED. Cloned verbatim into PDF / HTML / Word.                │         │
│        │  Governed by document.css. Typography only. No animation.       │         │
│        │  Changing anything here changes the exported document.          │         │
│        └─────────────────────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────────────────────┘
```

**Why this matters:** it lets you build something that looks like Framer built it, while the export
path stays byte-for-byte as trustworthy as it is today. Every animation, every texture, every glow
lives on the Stage. The Sheet only ever changes through real typography work in `document.css`.

**The designer's rule:** the Stage must never outshine the Sheet. The document is the hero; the
Stage is the room it sits in. If a reviewer's eye goes to the background first, the Stage is wrong.

---

## 2. PHASE A — The Preview Stage system  ⭐ *the headline work*

**Goal:** 21 skins → 21 genuinely distinct **stages**, each with its own ground, paper treatment,
lighting and motion signature, built as one coherent design system rather than 21 one-offs.
Switching skins should feel like walking into a different room.

### A1 · Module layout (build this separately — do not bolt it into `Preview.tsx`)

Create a new, self-contained module. `src/components/preview/Preview.tsx` becomes a **thin adapter**
that renders `PreviewSurface` and forwards the `PreviewHandle` ref, so `App.tsx` barely changes.

```
src/preview/
├── PreviewSurface.tsx        # composes Stage + Sheet; owns docRef; keeps the PreviewHandle contract
├── stage/
│   ├── stages.ts             # the 21 stage descriptors — DATA, not components
│   ├── StageBackdrop.tsx     # renders ground/texture/lighting for the active stage
│   ├── PaperFrame.tsx        # renders the paper treatment around (never inside) the Sheet
│   ├── stage.css             # ALL stage styling, keyed by [data-stage='x']
│   └── types.ts              # StageDescriptor, StageMotion, StageTexture
├── motion/
│   ├── vocabulary.ts         # the 10 shared motion primitives (see A3)
│   └── useStageTransition.ts # orchestrates the skin→skin transition
├── chrome/
│   ├── PreviewToolbar.tsx    # mode switch, zoom, sync, front-matter toggle
│   ├── SkinRail.tsx          # hover-to-preview skin rail (A6)
│   ├── PageRuler.tsx         # page-boundary overlay (A7)
│   └── PreviewEmpty.tsx      # designed empty state
└── index.ts
```

**Rules for this module:**
- `stage.css` is imported once by `PreviewSurface`. It must contain **no `.scripto-doc` selectors**
  other than read-only positioning of the wrapper — never typography, never colour of document text.
- Stages are **data** (`StageDescriptor[]`), not 21 bespoke components. A stage that needs a
  component gets one small named component; the other 20 must fall out of the descriptor + CSS.
- Every stage descriptor is keyed by `DocumentSkin`, so `tsc` proves all 21 exist
  (`Record<DocumentSkin, StageDescriptor>` — exhaustive by construction).

### A2 · Design foundation (do this before any stage)

Add a small token layer in `stage.css` so the 21 stages are one system:

- **Depth scale** — `--stage-lift-1/2/3`: layered multi-stop shadows (never a single flat shadow).
- **Ground scale** — `--stage-ground`, `--stage-ground-2`, `--stage-vignette`.
- **Edge scale** — `--stage-edge` (paper border), `--stage-edge-glow`.
- **Motion scale** — durations `--m-snap: 90ms`, `--m-quick: 160ms`, `--m-base: 280ms`,
  `--m-slow: 480ms`, `--m-drift: 700ms`; easings `--e-out` (reuse `EASE_OUT` from `lib/motion.ts`),
  `--e-spring`, `--e-linear`, `--e-steps`.
- **Texture primitives, CSS-only** — no image assets. Grids, scanlines, halftone dots, paper grain
  and blueprint rules must all be built from `repeating-linear-gradient` / `radial-gradient` /
  `conic-gradient`. **Bundle budget: the entire stage system adds ≤ 12 KB gzipped CSS and 0 image bytes.**

### A3 · The shared motion vocabulary (10 primitives)

Every stage composes its entrance from these — parameterised, not reinvented. Implement in
`motion/vocabulary.ts` as named variant factories.

| Primitive | Motion | Feels like |
| --- | --- | --- |
| `rise` | opacity 0→1, translateY 12→0 | calm, default |
| `wipe` | a masked bar sweeps along the inline axis, content resolves behind | editorial |
| `draw` | borders/rules scale from 0 length, then content fades | technical |
| `type` | children reveal sequentially with micro x-jitter | mechanical |
| `snap` | 90 ms, no easing curve, no overshoot | efficient |
| `spring` | scale 0.96→1 with bounce 0.22 | friendly |
| `glow` | a light travels the paper perimeter, then content fades | nocturnal |
| `cascade` | children stagger top→bottom, tight 24 ms steps | tabular |
| `bloom` | vignette/spotlight widens while content fades up | cinematic |
| `stamp` | scale 1.04→1 with a hard short settle | institutional |

### A4 · The 21 stages

One per skin in `src/data/skins.ts`. Ground/paper are **screen-only**; the motion column names the
primitive from A3.

| # | Skin | Stage | Ground | Paper treatment | Motion |
| --- | --- | --- | --- | --- | --- |
| 1 | `modern` | Studio | soft neutral vertical gradient | floating sheet, layered `lift-2`, gentle scroll parallax | `rise` |
| 2 | `classic` | Library | warm cream, faint grain | bound-page look: spine gradient on the inner edge | `wipe` (page-turn, rotateY from spine) |
| 3 | `editorial` | Spread | accent colour-field, oversized muted heading watermark behind | offset sheet, magazine gutter | `wipe` (masthead bar) |
| 4 | `technical` | Spec bench | cool slate + faint isometric grid | corner registration ticks, thin rulers on both edges | `draw` |
| 5 | `compact` | Contact sheet | tight dense ground | snug frame, minimal margin | `snap` |
| 6 | `manuscript` | Typewriter desk | warm paper-bag, fibre texture | platen shadow along the top edge | `type` |
| 7 | `blueprint` | Drafting table | deep cyan blueprint grid | white-on-blue sheet with a title-block corner | `draw` (plotter trace) |
| 8 | `corporate` | Boardroom | clean cool ground, accent band at top of stage | crisp square shadow | `rise` + band fills from start edge |
| 9 | `brutalist` | Concrete | flat raw ground | hard offset shadow, zero blur, thick border | `snap` with `--e-steps` (deliberately jarring) |
| 10 | `notebook` | Desk | soft warm ground | punch-hole/spiral edge, red margin rule, faint ruled lines *behind* the sheet | `spring` (flip-down, rotateX from top) |
| 11 | `resume` | Folder | very clean neutral, generous air | manila folder tab peeking behind the sheet | `rise` (lift out, shadow deepens) |
| 12 | `swiss` | Grid wall | visible modular grid with interval markers | snapped to grid, hairline edge | `cascade` along grid lines, no bounce |
| 13 | `terminal` | CRT | near-black, phosphor vignette, scanlines, very faint flicker | dark panel with a glowing edge | `type` (cursor blink → boot sweep) |
| 14 | `newsprint` | Press | warm grey halftone dots | off-white sheet, CMYK registration marks at corners | `bloom` (ink-set: blur+desaturate → sharp) |
| 15 | `elegant` | Gallery | deep ink ground, soft centred spotlight | hairline accent frame | `bloom` |
| 16 | `playful` | Sticker board | bright pastel blobs | rounded corners, chunky coloured shadow | `spring` (rotation settle) |
| 17 | `dark` | Night desk | true dark, ambient accent glow | luminous border | `glow` |
| 18 | `ledger` | Accounting desk | muted ledger-green | fine ruled columns visible in the gutter | `cascade` |
| 19 | `zen` | Void | almost nothing, very soft light | edge barely exists, no frame | `rise` at `--m-drift`, **no translate** — pure fade |
| 20 | `memo` | Interoffice | flat institutional ground, ghost "INTERNAL" mark **on the stage, not the paper** | header band | `stamp` |
| 21 | `poster` | Gallery wall | dramatic ground, spotlight cone | large centred sheet, strong drop shadow | `bloom` + scale 0.92→1 |

**Acceptance for A4:** screenshot all 21 at 240 px wide. A person who has never seen Scripto must be
able to tell all 21 apart at that size. If two are confusable, one of them is not finished.

### A5 · Skin-change transition

Changing a skin must not be an instant repaint. On `config.skin` change:
1. Cross-fade the old Stage backdrop out and the new one in (`--m-base`).
2. Play the new stage's motion signature on the Sheet **wrapper** (never on `.scripto-doc` itself —
   no transforms on the exported element; animate the parent).
3. Show a brief, tasteful stage-name label (e.g. "Blueprint") that fades after ~900 ms.

Must be interruptible: switching skins rapidly must never leave a stuck backdrop or a half-faded
label. Under `prefers-reduced-motion`, do the cross-fade only — no movement.

### A6 · Skin Rail — hover to preview, click to commit

A slim vertical rail pinned to the inline-end edge of the preview (collapsible, remembered in
`localStorage` as `scripto:preview-rail`).

- 21 small live thumbnails driven by `SKIN_OPTIONS`.
- **Hover** temporarily applies the skin to the live preview (do **not** write to `config`) —
  release restores the committed skin. This is the Figma/Framer move that makes the whole feature
  feel alive.
- **Click** commits via the existing `updateConfig({ skin })`.
- Keyboard accessible: the rail is a `role="listbox"`, arrow keys move a roving tabindex, focus
  previews, Enter commits, Escape restores.
- Hidden below `lg` (mobile gets the existing Theme Gallery instead).
- **Performance:** thumbnails must be static CSS representations, not 21 mounted `MarkdownRenderer`s.
  Reuse the approach in `marketing/content/skinStyles.ts` if it fits.

### A7 · Preview modes + Page Ruler

Add a segmented control to `PreviewToolbar` (persisted as `scripto:preview-mode`):

- **Flow** (default, today's behaviour) — one continuous sheet.
- **Pages** — the **Page Ruler** overlay: measure the rendered document height against the usable
  page height derived from `resolvePageDimensions(config)` minus `config.margins`, then draw
  screen-only page separators with page numbers in the gutter.
  - ⚠️ **Be honest about accuracy.** This is a *geometric estimate*; it does not run the paginator
    and will not account for `break-inside: avoid`, `::page-break`, `:::keep-together`, table-header
    repetition or `chunkCodeBlocks`. Label it as approximate in the UI (i18n string) with a
    "Open Print Preview for exact pages" affordance. **Do not claim exactness.**
  - The overlay is absolutely positioned in the Stage layer. It must not touch `.scripto-doc`.
- **Focus** — dims everything except the block under the cursor (reuse the `rehypeSourceLine`
  data attributes that `useScrollSync` already relies on).

### A8 · Contracts this phase must honour

- **Typing latency must not regress.** The Stage must not re-render on keystroke — memoise it on
  `config.skin` / `config.accentColor` only. Verify with a React profile: typing 60 chars must not
  re-render `StageBackdrop` once.
- **GPU-composited only** — animate `transform` and `opacity`. No animated `box-shadow`, `filter` on
  large surfaces, `width`/`height`, or `background-position` on the whole ground.
- The existing **`zoom`** on the preview inner wrapper and the **pinch-to-zoom** touch handlers must
  keep working. If a stage transform fights `zoom`, put the stage transform on a different element.
- **Reduced motion:** all stage entrances collapse to a plain 120 ms opacity fade. Textures stay;
  motion goes.
- **RTL:** every stage must be correct with `dir="rtl"`. Asymmetric stages (2 spine, 10 margin rule,
  11 folder tab, 18 gutter) must mirror. Use logical properties; add `[dir='rtl']` tweaks only where
  logical props genuinely cannot express it.
- **Escape hatch:** a setting `scripto:preview-stage` = `full | minimal | off`. `off` restores
  today's plain card exactly. Zen/focus mode forces `minimal`.
- **i18n:** stage names, mode labels, rail labels, ruler labels — EN + AR.

### A9 · Acceptance for Phase A
- [ ] 21 stages, all visually distinct at 240 px.
- [ ] Skin change plays a designed transition; rapid switching never breaks.
- [ ] Skin Rail previews on hover, commits on click, fully keyboard-navigable.
- [ ] Flow / Pages / Focus modes work and persist.
- [ ] **Export a PDF and diff it against `main`: byte-level layout must be unchanged.** Nothing from
      the Stage appears in the PDF, the HTML export, or the Word export.
- [ ] `SCRIPTO_VISUAL=1 npm run test` still passes.
- [ ] Correct in LTR + RTL, light + dark, reduced-motion, and at 375 px width.
- [ ] `npx tsc -b --force && npm run lint && npm run build && npm run test` green.

---

## 3. PHASE B — Visual page-break editor  ⭐ *the launch feature*

**Why this is the moat:** every markdown→PDF tool's #1 complaint is "the page break landed in the
wrong place and I can't fix it." Pandoc means editing LaTeX. Typora means guessing. And Scripto
already has the write target: `src/markdown/plugins/remarkPageDirectives.ts` implements
`::page-break`, `:::keep-together` and `:::landscape` **today**. This phase is a UI layer over a
working directive system — not a new pipeline.

**In `PrintPreview.tsx`, over the paginated `.pagedjs_page` boxes:**

1. On hover between two block elements, show a thin insertion affordance: **"✂ Break here"**.
2. Clicking it inserts `\n\n::page-break\n\n` into the markdown at the right source position, then
   re-renders. **Source mapping:** `rehypeSourceLine.ts` already stamps source line numbers onto
   rendered elements and `useScrollSync` already consumes them — reuse that, and account for
   `parsed.bodyLineOffset` (front-matter offset) exactly as `useScrollSync` does.
3. Existing `::page-break` markers render as a removable chip on the page edge (click ✕ → delete
   those lines from the source).
4. Select a run of blocks → "Keep together" wraps them in `:::keep-together … :::`.
5. A wide table shows an inline suggestion: "Too wide for portrait — make this page landscape?" →
   wraps in `:::landscape`.
6. Surface the `fit` result that `renderPagedPreview` already returns (`{ scaled, clipped }`) as a
   visible warning strip: "3 elements were scaled to fit; 1 is still clipped."

**Rules:** every mutation goes through the normal `setMarkdown` path so undo works. Never write into
the rendered DOM as the source of truth — the markdown is always authoritative. Round-trip test:
insert a break, remove it, and the document must be byte-identical to the original.

---

## 4. PHASE C — Export presets

The last feature the repo explicitly names as unstarted (`docs/RENDERING_AUDIT.md` §8: *"Named
bundles of paper size, margins, skin and font — not started"*).

- New type `ExportPreset { id, name, config: Partial<PdfConfig>, createdAt }`, persisted at
  `scripto:export-presets`.
- "Save current settings as preset…" in `ConfigPanel` + a ⌘K command; rename and delete.
- User presets appear alongside `DOCUMENT_PRESETS` in the Theme Gallery, visually separated.
- Export/import presets as a `.json` file (frontend-only portability — this is the closest thing to
  "sync" available without a backend, and it is genuinely useful for teams sharing a house style).
- Applying a preset must merge exactly like `applyPreset` in `App.tsx` does today (note the
  `marginPreset` → `margins` mapping).

---

## 5. PHASE D — Root-cause the Paged.js RTL pagination hang

**This is a real, shipped bug on the product's key differentiator.** Some Arabic RTL documents stall
at "Laying out pages"; a 45 s watchdog makes it fail gracefully but they still cannot export.

Full repro and investigation plan already exist in **`docs/PAGEDJS_RTL_DEBUG_PROMPT.md`** — follow it.
Leading hypothesis stated there: `overflow-x: auto` on `pre` / `.table-wrap` combined with `dir=rtl`
prevents the chunker from converging (the same class of defect as the scroll-container/fragmentation
bug documented in `RENDERING_AUDIT.md` §2).

Keep the watchdog and the image timeout as the safety net regardless of the fix. Add an RTL fixture
to `tests/visual/fixtures/` that reproduces it, so the harness covers it.

---

## 6. PHASE E — Mobile

`App.tsx:216` gates split view on `isDesktop` (`min-width: 1024px`) and `App.tsx:267` only
auto-opens the config panel on desktop. Meanwhile résumé and AI-output traffic is heavily mobile.

- Tabbed Editor ⇄ Preview with a proper bottom switcher (not a degraded desktop layout).
- Config panel becomes a bottom sheet on small screens.
- Verify the Save-as-PDF path end-to-end on **iOS Safari** and **Android Chrome** — this is the
  riskiest part of the whole product on mobile and it is currently unverified. Document what works.
- Touch targets ≥ 44 px; the editor toolbar must be reachable one-handed.
- Stage system: `minimal` on small screens by default (perf).

---

## 7. PHASE F — IndexedDB migration

`useDocumentLibrary.ts` `JSON.stringify`s the entire library — including base64 images — into
`localStorage` on a 300 ms debounce. Quota exhaustion is handled gracefully
(`scripto:quota-exceeded`) but the ceiling is low and real.

- Move documents and image blobs to IndexedDB (or OPFS), keeping `localStorage` for small settings.
- **Migrate on first run, non-destructively**: copy from `scripto:library:v1`, verify, and only then
  stop writing the old key. Keep the old key readable for one release.
- Preserve the debounced-write / `pagehide` flush behaviour — it is the reason typing is smooth.
- **The passphrase vault must keep working.** `lib/vault.ts` snapshots `scripto:*` localStorage
  entries; it needs to learn about the new store, and `AppRoot`'s lock gate must still never mount
  `App` with plaintext readable. Re-verify the full lock → reload → unlock cycle.
- Add local **version snapshots** (last 20 per document) now that space allows — the single cheapest
  trust feature for a local-first app.

---

## 8. PHASE G — Decompose `App.tsx`

1,150 lines, ~20 dialog `useState`s, a 40-entry `commands` array. Adding the dialogs above will make
it unworkable. Extract, with no behaviour change:

- `hooks/useDialogs.ts` — one reducer for all overlay state.
- `hooks/useCommands.ts` — builds the `commands` array from injected handlers.
- `hooks/useDeepLinks.ts` — the `?template=` / `?skin=` allowlist effect.
- `hooks/useAiActions.ts` — the AI selection/transform handlers.

Do this **before** Phases B and C if you are running them in the same session; otherwise after A.

---

## 9. PHASE H — Funnel analytics

`lib/analytics.ts` tracks actions but no funnel, so there is no way to tell where users are lost.
Add to `AppAnalyticsEvent` (keep props flat, structural only — **never document content or PII**):

`Time To First Export` · `Export Dialog Opened` · `Print Dialog Reached` · `Paste Detected`
(with `{ kind: 'rich' | 'plain' | 'image' }`) · `Page Break Inserted` · `Stage Viewed`
(`{ skin }`) · `Skin Previewed` (rail hover→commit) · `Mobile Export Attempted`.

Define and write down the targets: **activation** = first export in session 1 (>35%);
**north star** = weekly returning exporters.

---

## 10. PHASE I — Content sprint (no code, pure leverage)

The marketing infrastructure auto-generates a page, sitemap entry, hreflang cluster, JSON-LD and OG
card for every template, skin, use-case and blog post. It is built for hundreds and currently holds
**4 blog posts, 3 comparisons, 9 use-cases**. Feeding it is the cheapest growth available.

1. **The 5 unbuilt templates** named in `RENDERING_AUDIT.md` §8 — Arabic/bilingual invoice, incident
   postmortem, ADR, statement of work, investor update. (These are also the business/team wedge.)
2. **A `/ai-output-to-pdf` use-case page.** Paste-to-Markdown already ships
   (`MarkdownEditor.tsx:228`) — the feature exists and nobody knows. Target *"chatgpt to pdf"*,
   *"claude output to pdf"*, *"ai answer formatting"*. Add the Arabic variant to `USE_CASES_AR`.
3. **10 blog posts** against the keyword map in `docs/SEO_PLAYBOOK.md`.
4. **More comparisons:** VS Code Markdown-PDF, Dillinger, StackEdit, Obsidian, md-to-pdf, Overleaf.
5. Update the landing hero: it says *"Markdown in."* It should also say **"paste anything."**

Follow the recipes in `ARCHITECTURE.md` §14 — do not hand-write routes.

---

## 11. Global verification

Before declaring any phase done:

```bash
npx tsc -b --force && npm run lint && npm run build && npm run test
SCRIPTO_VISUAL=1 npm run test
```

Then **manually**:
- [ ] Export a PDF from a document with tables, code, math, Mermaid, ASCII and images — compare
      against a PDF exported from `main`. **Any layout difference is a regression unless intended.**
- [ ] Export HTML and Word — confirm no stage markup leaked in.
- [ ] Switch to العربية: full RTL chrome, RTL document, code/math still LTR, page numbers still
      `1 / N` LTR.
- [ ] Enable the passphrase lock, reload, unlock — data intact.
- [ ] Go offline (DevTools) — the PWA still edits and exports.
- [ ] `prefers-reduced-motion: reduce` — no movement anywhere.
- [ ] 375 px width — everything usable.
- [ ] Lighthouse on `/` ≥ 95 Perf/SEO/A11y (marketing pages must still ship zero framework JS).

---

## 12. Explicitly OUT of scope (needs a backend — do not build)

Accounts · cloud sync · share links · comments/collaboration · server-side rendering (and therefore
PDF bookmarks, PDF/A, tagged PDF, password-protected PDF, batch/merge) · REST API · CLI · GitHub
Action · e-signature.

If you find yourself wanting a server, stop and note it in the final report instead.

---

## 13. Suggested execution order

| Session | Contains | Why |
| --- | --- | --- |
| 1 | §8 Phase G (decompose `App.tsx`) | Cheap, unblocks everything, zero behaviour change |
| 2 | §2 Phase A — **the Stage system** | The headline. Big enough to own a whole session. |
| 3 | §3 Phase B + §4 Phase C | Both live in the preview/export surface |
| 4 | §5 Phase D (RTL hang) + §6 Phase E (mobile) | Both are "fix what's shipped" |
| 5 | §7 Phase F (IndexedDB) + §9 Phase H (analytics) | Both touch persistence/instrumentation |
| — | §10 Phase I (content) | Runs continuously alongside all of the above |

Ship each phase independently. Do not batch — this repo's strength is that every feature landed
complete, documented, and green.

---

## 14. Final report

End with: what shipped per phase, before/after screenshots of all 21 stages, the PDF regression
diff result, bundle-size delta, anything deferred and why, and any invariant you had to bend
(with justification).
