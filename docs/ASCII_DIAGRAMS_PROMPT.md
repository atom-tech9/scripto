# Prompt — First-class ASCII / box-drawing diagram rendering (preview + PDF + editor)

Paste into a fresh Claude Code session in the **markdown-to-pdf** repo (Scripto). Meaty but
self-contained feature — keep the build green throughout
(`npx tsc -b --force && npm run build && npm run lint && npm run test`). No `any`, no
`console.log`, no new dependencies unless truly unavoidable. Minimal comments (one line only where
a constraint isn't obvious).

---

## Why (what "looks weird" today)

Users — and especially AI assistants — constantly produce Markdown containing ASCII architecture
diagrams in fenced code blocks: Unicode box-drawing (`┌─┐ │ ▼ ═ ║`), classic ASCII (`+--+ | ->`),
tree listings (`├── └──`), and shaded bars (`█▓▒░`). Today Scripto renders these as ordinary code
blocks, which ruins them:

- `rehype-prism-plus` runs with `showLineNumbers: true` → **line numbers** appear beside diagrams.
- Code blocks inherit the document's line-height (`--doc-leading`, default 1.65) → **vertical `│`
  segments don't connect** — the diagram looks shredded. This is the single biggest "weird".
- JetBrains Mono **ligatures** turn `->` `=>` `|>` into single arrow glyphs — widths shift,
  alignment breaks subtly.
- Wide diagrams **wrap or overflow**; one wrapped line destroys the picture, and in the PDF a
  too-wide diagram overflows the page.
- A diagram **taller than one page** hits the known Paged.js pathology: `pre` carries
  `break-inside: avoid`, and an unbreakable element taller than the page content box makes Paged.js
  spill broken/blank pages (we fixed exactly this for Mermaid — see `src/pdf/pageStyles.ts`, the
  "Tall diagrams / images are scaled to fit" rule; that clamp covers `svg`/`img` only, **not**
  `pre`). Read commit `3feab4d` for the failure signature.
- In the **editor** itself, soft word-wrap is on by default — long diagram lines wrap while
  editing, so even authoring looks broken.

Goal: a dedicated, beautiful diagram treatment. The preview must equal the PDF — that's the
product's core promise (ARCHITECTURE.md §5: one stylesheet, one rendered DOM, cloned for export).

## What to build

### 1. Detection — which code blocks are diagrams

A fenced block is a diagram when **either**:

- **Explicit language**: ` ```ascii `, ` ```diagram `, or ` ```ascii-art ` (all three aliases), or
- **Heuristic (untagged blocks only)**: no language AND the text scores as diagram-like.

**Escape hatch:** ` ```text `, ` ```txt `, ` ```plain ` are explicit "never a diagram, never
highlighted" — the user's way to force plain rendering when the heuristic would fire.
A tagged language (` ```js ` etc.) must NEVER be treated as a diagram, whatever its content.

Heuristic — implement as pure, unit-tested functions in a new `src/markdown/asciiDiagram.ts`:
≥ 2 lines, and characters from the diagram alphabet — box drawing U+2500–U+257F, block elements
U+2580–U+259F, shades `░▒▓`, arrows `← ↑ → ↓ ↔ ▲ ▼ ◄ ►`, plus the classic set when structurally
used (`+-|` corners, `->`, `=>`, `<->`) — exceeding a threshold (suggested: ≥ 8 occurrences across
≥ 2 distinct lines). Tune against the fixtures below AND the negative cases (real code with `=>`
arrows, YAML, diffs, markdown tables must NOT match). Keep it O(n), single pass — it runs on every
untagged block per (debounced) render.

### 2. Rendering — the `AsciiDiagram` component

Wire it exactly where Mermaid is wired: `src/markdown/MarkdownRenderer.tsx`'s `pre` component
override already extracts `language` + `raw` (see the `language === 'mermaid'` branch →
`<Mermaid code={raw} …/>`, ~line 89–93). Add the diagram branch there (explicit alias, or
`!language && isAsciiDiagram(raw)`), rendering a new
`src/markdown/components/AsciiDiagram.tsx` modeled on `Mermaid.tsx` / `CodeBlock.tsx`.

**Critical:** feed the component the **`raw`** string (already available in the override) — never
the prism-processed children, which may contain `.code-line` / line-number spans. Render it as a
single text node inside `<pre>` (no HTML injection surface — raw text only).

Visual spec (styles in `src/styles/document.css` — it styles BOTH preview and PDF; colors via the
existing `--doc-*` variables so every skin and the forced-white print surface stay correct):

- `<figure class="ascii-diagram">`, treatment like `.mermaid-figure`: centered, vertical margins,
  `break-inside: avoid; page-break-inside: avoid;`.
- **No code-block chrome**: no header bar, no line numbers, no syntax colors. At most a whisper of
  background — decide by eye against fixtures in 2–3 skins; scope everything under
  `.ascii-diagram` so per-skin `pre` overrides (technical/terminal/blueprint style code heavily)
  don't leak in, and skins can later theme it deliberately.
- Typography — the make-or-break details:
  - `font-family: 'JetBrains Mono', ui-monospace, monospace` (full box-drawing coverage);
  - **`line-height: 1.2` fixed** — explicitly independent of `--doc-leading`/the user's line-height
    setting (tune 1.15–1.25 until a stacked column of `│` glyphs visually connects; test literally
    with that);
  - `font-variant-ligatures: none; font-feature-settings: 'liga' 0, 'calt' 0;` (kills the arrow
    ligatures) and `font-kerning: none; letter-spacing: 0;`;
  - `white-space: pre; tab-size: 4;` — never wrap, and no horizontal scrollbar in the PDF.
- **Direction: always LTR**, even inside RTL/Arabic documents (`direction: ltr; text-align: start`
  on the figure — same approach as `.mermaid-figure`). Arabic/emoji labels *inside* a line are fine
  (bidi handles the run) — but see width handling in §3.
- **Caption (fence meta)**: support ` ```ascii title="Server layers" ` → `<figcaption>` under the
  diagram, styled like a small muted caption. The meta string is available on the hast node
  (`node.data?.meta` on the code child — verify how react-markdown exposes it in this pipeline);
  parse just `title="…"` defensively, ignore anything else. Escape nothing manually — render as a
  React text child.
- **Accessibility**: `role="img"` on the figure with `aria-label` = the caption title when present,
  else a generic localized "ASCII diagram" (i18n key in both `EN_STRINGS` and the Arabic map,
  `src/lib/i18n.ts`); `aria-hidden="true"` on the `<pre>` so screen readers aren't read 500 box
  characters. Selection/copy must still yield the raw diagram text.
- Optional: reuse `CodeBlock`'s copy-button pattern (with `data-pdf-hide-interactive` so it's
  hidden in export). Nice, not required.

### 3. Auto-fit — the "perfect way" requirement

A diagram must always fit the content width, scaled down proportionally when too wide:

- Compute `maxCols` = longest line's **visual** column count: expand tabs, and count wide
  characters as 2 — East Asian Wide/Fullwidth and emoji (a compact `codePointWidth()` helper in
  `asciiDiagram.ts` is enough: ranges for CJK, Hangul, emoji presentation; unit-test it). Counting
  code points alone breaks the math the moment an AI puts ✅ or Arabic in a box.
- Preferred mechanism — **container-query units**, so the same CSS is correct in the preview card
  AND the PDF page box without DOM measurement: `container-type: inline-size` on the figure; the
  component emits `--diagram-cols` inline; document.css does
  `font-size: min(<base code size>, calc(100cqw / (var(--diagram-cols) * 0.6)))`
  (0.6 ≈ JetBrains Mono advance width in em).
  **Verify `cqw` resolves inside Paged.js pages** (export a wide fixture and measure the rendered
  width). If it doesn't: fall back to measuring in the component effect (`scrollWidth` vs
  `clientWidth` → inline `font-size`); the inline style survives the export clone by construction
  (`buildExportContent.ts` clones the live DOM). Container-relative CSS is preferred because
  preview and page widths differ — chase it first.
- **Interplay with preview zoom**: the preview applies CSS `zoom` (pinch/zoom control in
  `Preview.tsx`). Confirm the fit math still holds at 50%/150% zoom (container queries should be
  zoom-agnostic; just verify visually).
- **Tall diagrams**: extend the tall-figure strategy in `src/pdf/pageStyles.ts` so a diagram taller
  than the page content box **scales down** instead of triggering the blank-page spill. For text a
  `max-height` alone won't reflow — reduce font-size through the same custom-property mechanism
  (emit `--diagram-rows` too; height ≈ rows × 1.2 × font-size, so a max-height in mm converts to a
  font-size cap the same way), or `transform: scale()` with a measured wrapper height. Prove it
  with fixture A: exported PDF shows it **intact on one page**, no leaked style text, no blanks.

### 4. Editor experience (authoring shouldn't look broken either)

- **Slash command**: add a "Diagram (ASCII)" item to `src/components/editor/slashCommands.ts`
  inserting an ` ```ascii ` fence scaffold (mirror how existing insert items work); i18n label
  en + ar.
- **Optional stretch (skip if it grows big):** disable soft-wrap inside diagram fences in
  CodeMirror via a line-decoration extension. ⚠️ If you attempt it, obey the invariant documented
  at the top of `src/components/editor/MarkdownEditor.tsx`: extensions/props must stay
  identity-stable or the ⌘F search panel dies (reconfigure wipes runtime extensions). If in doubt,
  don't touch the editor beyond the slash command — the preview is the product here.

### 5. Polish (small, do last)

- **Cheat sheet**: add a row to the "Scripto extras" group in
  `src/marketing/pages/CheatSheetPage.tsx` (` ```ascii ` → crisp auto-fitted diagram figures,
  `title="…"` caption).
- **FormattingHelpDialog** (`src/components/layout/FormattingHelpDialog.tsx`): short entry if it
  has a code/diagrams section (i18n en + ar).
- **Templates**: add 1–2 `DocumentTemplate` entries in `src/data/templates.ts` (category
  `'diagram'`), e.g. "ASCII Architecture" seeded with fixture A — template pages on the marketing
  site auto-generate from this data (free SEO). Include `nameKey`/`descKey` + translations, and
  verify the diagram renders on its `/templates/<id>` marketing page: that page has its OWN
  ReactMarkdown `pre` override (`src/marketing/pages/TemplatePage.tsx`) — give it the same diagram
  branch or it will show the broken code-block treatment you're fixing.
- **Other exports**: HTML and Word exports (`src/io/exporters.ts`) serialize the same DOM —
  spot-check the diagram survives as monospace text in the self-contained HTML export and doesn't
  crash the `.doc` export (best-effort fidelity there is acceptable; no crash is mandatory).
- **Docs**: one bullet in README's Rich Markdown feature list; one row in ARCHITECTURE.md §14
  ("Extending") for adding diagram flavors.

## Test fixtures (use verbatim)

**A — wide + tall Unicode box diagram (the real-world stress case):**

````
```ascii
                 Internet (your users & clients)
                          │
                          ▼
                 ┌──────────────────┐
                 │    Cloudflare     │  DNS + proxy/CDN in front of the domain
                 └────────┬─────────┘
                          │
        ══════════════════▼══════════════════════════════════
        ONE ECS SERVER (ARM64) — everything below is this box
        ══════════════════════════════════════════════════════
                 ┌──────────────────┐
                 │      Nginx        │  Terminates HTTPS, forwards to:
                 │   (ports 80/443)  │
                 └────────┬─────────┘
                          │
          ┌───────────────┼───────────────────────┐
          ▼               ▼                       ▼
   :3000 sqcm-prod   :3003 marketing        :3002 hr-backend
                       │
              ┌────────┴─────────────────────────────┐
              │ PM2 (process manager)                 │
              │  ├─ marketing         (Next.js web)   │
              │  └─ marketing-worker  (BullMQ jobs)   │
              └────────┬──────────────┬──────────────┘
                       ▼              ▼
              MongoDB (Docker)   Redis (queues)
```
````

**B — classic ASCII style, untagged (the heuristic must catch it):**

````
```
            +-------------+        +--------------+
   users -->|  Cloudflare | -----> |    Nginx     |
            +-------------+        +------+-------+
                                          |
                              +-----------+-----------+
                              v                       v
                        +-----------+           +-----------+
                        |  Next.js  |           |  Worker   |
                        +-----------+           +-----------+
```
````

**C — tree listing with caption (tagged + meta):**

````
```ascii title="Project layout"
src/
├── markdown/
│   ├── MarkdownRenderer.tsx
│   └── components/
│       ├── Mermaid.tsx
│       └── AsciiDiagram.tsx
└── styles/
    └── document.css
```
````

**D — wide characters (emoji + Arabic label; width math must hold):**

````
```ascii
┌────────────────────┐      ┌────────────────────┐
│  ✅ النشر التلقائي │ ───► │  📦 Object Storage │
└────────────────────┘      └────────────────────┘
```
````

**Negative cases** (must stay normal code blocks): untagged JavaScript with `=>` arrows; untagged
YAML; untagged diff with `+`/`-` prefixes; a GFM table pasted untagged; fixture B inside a tagged
` ```js ` block; and ` ```text ` containing fixture A (escape hatch wins).

## Verification (all of it — look at pixels, don't just assert)

1. `npx tsc -b --force && npm run build && npm run lint && npm run test` — green, 0 lint errors;
   unit tests for the detector (A–D positive, all negatives) and for `codePointWidth`/maxCols.
2. **Preview pass** (headless Chrome via playwright-core — repo-standard pattern; seeding recipe in
   `docs/PRODUCT_DEMO_RECORDING_PROMPT.md`: preload `scripto:library:v1`, dismiss
   `scripto:onboarding`, set `scripto:view-mode`). Screenshot fixtures A–D and INSPECT: verticals
   connected (no gaps), nothing wrapped, no line numbers/chrome, caption on C, D's boxes aligned.
   Repeat: dark theme; skins `technical` + `terminal` + `newsprint`; inside an RTL/Arabic document
   (diagram stays LTR, page furniture mirrors); preview zoom 50% and 150%.
3. **PDF pass**: Export PDF → wait `.pagedjs_page` → screenshot each fixture's page. A lands
   **intact on one page**, auto-scaled; no blank pages; no leaked `#…{` style text; captions print;
   a normal ` ```js ` block in the same doc still shows header/copy/line numbers.
4. **Regressions**: a Mermaid flowchart still renders; KaTeX untouched; marketing build still
   prerenders all pages (~102+; count grows if you added templates — the build logs exact counts);
   HTML + Word exports don't crash.

## Workflow

- Branch `dev`; clear commit message; merge into `main` with `--no-ff`. **Do not push.**
- `npm run dev` for the app at `/app`; stop the server when done.
- Conventions: strict TS (no `any`), no `console.log` (use `lib/logger.ts`), i18n keys in en + ar,
  logical CSS properties only (RTL), minimal comments.

## Acceptance

- Fixtures A–D render as crisp, connected, auto-fitted diagram figures in preview AND exported PDF
  (A on a single page), light + dark, LTR + RTL, ≥ 3 skins, zoom-proof.
- Untagged fixture B auto-detected; every negative case untouched; ` ```text ` escape hatch works;
  tagged languages never hijacked.
- Caption via ` title="…" ` renders and prints; figure is accessible (role="img" + localized
  label, pre aria-hidden).
- `/diagram` slash command inserts a working scaffold.
- Zero regressions (code blocks, Mermaid, KaTeX, marketing build, HTML/Word export).
- All checks green: `tsc`, `build`, `lint` (0 errors), `test`.
