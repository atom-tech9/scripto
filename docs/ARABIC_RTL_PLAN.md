# Scripto — Full Arabic & RTL Support: Phase-wise Plan

> **Status:** Planning only — no code changes yet.
> **Context:** A parallel session is actively building the P1 features (AI assist, GitHub import,
> résumé/templates, theme gallery). This plan is written so RTL work can proceed **without colliding**
> with that session. Read §A (ownership) before touching anything.

---

## A. Non-collision protocol (read first)

To avoid two sessions clobbering each other, files are split into three buckets.

**🚫 Owned by the P1/AI session — DO NOT edit for RTL (request changes instead):**
- `src/App.tsx`
- `src/components/layout/Header.tsx`
- `src/components/editor/MarkdownEditor.tsx`, `EditorToolbar.tsx`, `editorCommands.ts`
- `src/components/layout/AiSettingsDialog.tsx`, `AiDashboardDialog.tsx`, `AiInputDialog.tsx`,
  `GithubDialog.tsx`, `ResumeDetailsDialog.tsx`, `ThemeGalleryDialog.tsx`
- `src/lib/ai.ts`, `src/lib/aiPrompts.ts`

**✅ RTL-owned — safe to create/edit freely:**
- `src/styles/document.css`, `src/styles/print.css`, `src/index.css`
- `src/pdf/documentStyle.ts`, `src/pdf/pageStyles.ts`
- `src/io/exporters.ts`
- `index.html`
- New files: `src/hooks/useUiDirection.ts`, `src/components/editor/direction.ts`,
  `src/lib/i18n.ts`, `src/data/templatesArabic.ts`

**🤝 Shared — edit surgically, additively, and only the lines named here:**
- `src/types/index.ts` (add `direction`, extend `DocumentFont`)
- `src/lib/constants.ts` (`FONT_STACKS`, `DEFAULT_CONFIG`)
- `src/lib/frontmatter.ts` (map `dir`/`lang`)
- `src/components/config/ConfigPanel.tsx` (one new "Direction & language" section)
- `src/AppRoot.tsx` / `src/main.tsx` (mount the UI-direction hook)

**Rules:** additive only; never reformat unrelated code; prefer **CSS logical properties** and Tailwind
**logical utilities** (`ms-/me-`, `ps-/pe-`, `start-/end-`, `text-start/end`, `rtl:`/`ltr:`) so changes
merge cleanly. Verify with `npx tsc -b && npm run build` (note the build may be red from the other
session's WIP — confirm your files aren't the cause).

---

## B. The direction model (mental model)

Two **independent** axes, plus typography:

1. **Document direction** — `PdfConfig.direction: 'auto' | 'ltr' | 'rtl'`. Per-document. Drives the
   `dir` attribute on `.scripto-doc` (preview, PDF, HTML/Word export). `auto` = browser per-element
   heuristic (great for mixed content).
2. **Interface direction** — `uiDir: 'ltr' | 'rtl'`, app-global, persisted to `scripto:ui-dir`.
   Drives `document.documentElement.dir`. Flips the entire chrome.
3. **Typography** — add an `'arabic'` `DocumentFont` (Noto Naskh Arabic / Amiri for body serif, Cairo
   for sans) and load the webfonts. Arabic needs proper shaping fonts; Inter/Source Serif don't cover it.

They're independent because an English document can be authored in an Arabic UI and vice-versa.

---

## Phase 1 — Document RTL + Arabic typography (preview + PDF + export)

**Goal:** An Arabic document renders correctly RTL on screen and in the exported PDF/HTML/Word, with
proper Arabic fonts; code blocks and math stay LTR.

**This phase is self-contained and the highest value — do it first.**

### 1.1 Config & types (shared files, surgical)
- `types/index.ts`: add `export type TextDirection = 'auto' | 'ltr' | 'rtl'`; add
  `readonly direction: TextDirection` to `PdfConfig`; extend `DocumentFont` with `'arabic'`.
- `constants.ts`: add `arabic` to `FONT_STACKS`
  (`'"Noto Naskh Arabic", "Amiri", "Cairo", serif'`); add `direction: 'auto'` to `DEFAULT_CONFIG`.

### 1.2 Apply direction to the rendered doc (RTL-owned)
- `pdf/documentStyle.ts`: in `documentDataAttrs`, add `dir: config.direction`. Optionally also set a
  `lang` (e.g. `ar` when direction is `rtl` or font is `arabic`) for hyphenation/screen readers.
  (`.scripto-doc` already spreads these attrs.)

### 1.3 Document stylesheet → logical properties (RTL-owned, the core work)
In `styles/document.css`, convert directional physical properties to **logical** so one rule serves
both directions:
- Lists: `padding-left: 1.6em` → `padding-inline-start: 1.6em`.
- Blockquote: `border-left` → `border-inline-start`; flip `border-radius` to logical
  (`border-start-end-radius` / `border-end-end-radius`) or accept symmetric.
- Table headers / cells: `text-align: left` → `text-align: start`.
- `.code-line` padding, callout grid, footnote indent, definition-list `dd` margin → logical.
- **Skins** that use `border-left` (technical, notebook, brutalist side-bars) → `border-inline-start`.
- **Force LTR islands** (code & math are inherently LTR even inside an RTL doc):
  ```css
  .scripto-doc pre,
  .scripto-doc :not(pre) > code,
  .scripto-doc .katex,
  .scripto-doc .katex-display,
  .scripto-doc .mermaid-figure { direction: ltr; }
  .scripto-doc pre,
  .scripto-doc .katex-display { text-align: left; }
  ```
- Add a couple of RTL-only nudges where logical props can't express it
  (`.scripto-doc[dir='rtl'] …`), e.g. editorial drop-cap float side.

### 1.4 Paged.js / PDF (RTL-owned)
- `pageStyles.ts`: page boxes inherit `dir` from content. Running header (`string-set` from H1) and
  page numbers should remain **LTR digits**; ensure margin-box `direction: ltr` so `1 / 10` doesn't
  reverse. Cover/TOC inherit doc direction; TOC leaders/`target-counter` already work.
- Confirm tables flow RTL (column order mirrors) with repeating headers intact.

### 1.5 Fonts (RTL-owned)
- `index.html`: add Arabic families to the Google Fonts link
  (`Noto+Naskh+Arabic`, `Cairo`, optionally `Amiri`).
- `io/exporters.ts`: add the same families to `FONTS_HREF`, and set `dir` on the exported
  `.scripto-doc` root + `<html lang dir>` in the standalone HTML.

### 1.6 Front-matter (shared, surgical)
- `frontmatter.ts`: map `dir` / `direction` / `rtl: true` → `config.direction`; map `lang: ar` to set
  direction `rtl` + `font: arabic` (sensible default). Validate against the union.

### 1.7 Config UI (shared, surgical)
- `ConfigPanel.tsx`: add a **Direction** segmented control (Auto / LTR / RTL) in the Typography or a
  new "Language & direction" section; the Arabic font shows up automatically in the font `Select`.

**Acceptance (P1):** Set direction RTL + Arabic font → preview is RTL with shaped Arabic; a fenced
code block and `$math$` stay LTR; export PDF → identical RTL layout, selectable Arabic text, correct
page numbers; HTML/Word export carry `dir`. Build green.

---

## Phase 2 — App interface RTL (the whole chrome mirrors)

**Goal:** With Arabic UI selected, the entire app (`<html dir="rtl">`) mirrors correctly — header,
panels, dialogs, menus, tooltips, status bar.

### 2.1 Global direction state (RTL-owned + tiny shared mount)
- New `hooks/useUiDirection.ts`: `{ uiDir, setUiDir }` persisted to `scripto:ui-dir`; effect sets
  `document.documentElement.dir = uiDir` and `lang`.
- Mount it in `AppRoot.tsx` (small, shared) so it applies before `App` renders.

### 2.2 Toggle UI (coordinate)
- Add an interface-language toggle. Lowest-collision home: a control in `ConfigPanel.tsx`
  ("Interface: English / العربية"). A header button or ⌘K command is nicer but lives in P1-owned
  files — request the P1 session add `onToggleUiDir` if desired.

### 2.3 Physical → logical conversion (per-component checklist)
Most flex/justify/text **auto-mirror** under `dir=rtl`; the work is replacing explicit physical
offsets. Convert in each component (RTL-owned ones directly; request changes for 🚫 files):

| Component | What to fix |
| --- | --- |
| `ui/Menu.tsx` | `right-0`/`left-0` align → `end-0`/`start-0`; AnimatePresence x-offset neutral |
| `ui/Tooltip.tsx` | `left`/`right` side classes swap under RTL (add `rtl:` variants) |
| `ui/Field.tsx` | Select chevron `background-position: right` → flip for RTL; `Switch` `translate-x` → logical/`rtl:`; `Slider` gradient direction |
| `ui/Dialog.tsx` | close button uses flex (ok); check paddings use logical |
| `layout/CommandPalette.tsx` | search icon margin, `kbd` placement, `text-left` → `text-start` |
| `layout/StatusBar.tsx` | gaps fine; any `text-left` → `text-start` |
| `layout/OutlineNavigator.tsx` | depth indent uses inline `paddingLeft` → `paddingInlineStart` |
| `preview/Preview.tsx` | reading-progress bar `left`-origin → logical; doc dir handled in P1 |
| `preview/PrintPreview.tsx` | zoom controls position; `transform-origin` |
| `config/ConfigPanel.tsx` | the right-docked aside (`absolute right-0`) → `inset-inline-end`; sliders |
| 🚫 `Header.tsx` | search `ml-2`, dividers, export split control rounding, menu align → logical (request) |
| 🚫 `App.tsx` | config aside side, zen floating `right-4` → `inset-inline-end`, resize handle math (clientX vs rect for RTL) (request) |
| 🚫 `EditorToolbar.tsx` | group dividers (cosmetic) |

> **Gotcha — resize handle:** the split-pane drag in `App.tsx` computes ratio from
> `clientX - rect.left`; under RTL the editor is on the right, so invert (`rect.right - clientX`) when
> `dir=rtl`. Flag to the App owner.

**Acceptance (P2):** Toggle Arabic UI → header brand/title/search/actions mirror; settings panel docks
on the correct side; menus/tooltips open on the correct side; dialogs, command palette, status bar all
read RTL; light/dark both fine; LTR mode unchanged.

---

## Phase 3 — Editor (CodeMirror) RTL

**Goal:** Authoring Arabic feels native — RTL caret/lines, gutter on the correct side; code fences LTR.

- New `components/editor/direction.ts`: an extension that sets the editor direction, e.g.
  `EditorView.contentAttributes.of({ dir: docDirection })` (or `'auto'` for mixed). CodeMirror's
  per-line bidi then works via the browser. Gutter/line-number side flips with `dir`.
- Wire it in `MarkdownEditor.tsx` (🚫 P1-owned) — provide the extension and **request** the P1 session
  add it to the `extensions` array (and pass the current `direction`).
- Keep the `collapseImages` chip and formatting commands working (they're direction-agnostic).

**Acceptance (P3):** Typing Arabic shows RTL lines with the gutter on the right; mixed LTR tokens
(code, URLs) display correctly; ⌘B/⌘I etc. still wrap correctly.

---

## Phase 4 — Interface translation (i18n) — optional for "full Arabic"

**Goal:** Arabic *labels*, not just RTL layout.

- New `lib/i18n.ts`: `type Lang = 'en' | 'ar'`; `STRINGS: Record<Lang, Record<Key, string>>`;
  `useT()` hook returning `t(key)`. Tie `lang` to `uiDir` (ar ⇒ rtl).
- Replace hardcoded UI strings (tooltips, buttons, dialog titles, toasts, command labels) with
  `t('…')`. This is broad and touches 🚫 files — do it **after** the P1 session lands, in a dedicated
  pass, or coordinate key-by-key.
- Optional: Arabic template set in `data/templatesArabic.ts` (résumé, letter, report in Arabic).

**Acceptance (P4):** Switching to العربية translates the chrome; English unchanged.

---

## Phase 5 — QA matrix & rollout

Test each in **LTR and RTL**, **light and dark**, **preview and exported PDF**:
- Headings (incl. numbered), paragraphs, **lists (bullets/markers on correct side)**, blockquotes,
  callouts, **tables (column order + repeating headers)**, task lists, definition lists, footnotes.
- **LTR islands inside RTL:** fenced code, inline code, KaTeX inline/display, Mermaid.
- Cover page, TOC (leaders + page numbers), running header, **page numbers stay `1 / N` LTR**.
- HTML & Word export carry `dir`; images/drawings still embed.
- App chrome: header, settings panel side, menus, tooltips, command palette, dialogs, status bar,
  outline indents, reading-progress bar, resize-handle drag direction, zen floating controls.
- Editor: RTL caret/gutter, mixed content, shortcuts.
- Regressions: print isolation, PWA, encryption gate, autosave.

**Rollout order:** P1 (ship-able alone) → P2 → P3 → P4. Each phase ends green
(`npx tsc -b && npm run build`).

---

## Appendix — AI assist reasoning/temperature (for the P1/AI session, not RTL)

Per the earlier note: the AI settings (`AiSettingsDialog` / `lib/ai.ts`) should expose
**temperature** (0–1 slider, default ~0.4) and a **reasoning effort** selector
(`low | medium | high`) mapped per provider (e.g. OpenAI `reasoning_effort`, Anthropic extended
thinking budget, OpenRouter passthrough). This is the AI session's scope; noted here so it isn't lost.
