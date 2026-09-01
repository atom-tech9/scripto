# Scripto — The Visual Document Editor

> **The third brief.** `V2_FRONTEND_PROMPT.md` (Stage system, page-break editor, export presets,
> `App.tsx` decomposition) is delivered. `V3_HANDWRITING_PROMPT.md` is the handwriting engine.
> **This one is the largest and the most dangerous** — it changes what Scripto *is*.
>
> **Goal:** *"A professional visual document editor powered by Markdown"* — not *"a Markdown editor
> with a PDF preview."* Click anything in the preview, edit it, and the Markdown updates.
>
> **Still frontend-only. No backend.**
>
> §1 contains five architectural decisions. **Four of them contradict the obvious approach, and
> getting any one wrong makes the feature unshippable.** Read §1 before anything else.

---

## 0. What already exists — do not rebuild it

A generic version of this brief would say "create a document AST", "build a theme system", "add
source mapping". **All three already exist here.** Building parallel versions is the main way this
project can fail.

| The generic instruction | The reality in this repo |
| --- | --- |
| "Create a document AST" | **mdast already is it.** react-markdown parses to mdast → hast. `mdast-util-*`, `remark-parse`, `remark-stringify` and `mdast-util-to-markdown` are **already in `node_modules`** (transitively — declare them directly if you import them). |
| "Add source position mapping" | **`src/markdown/plugins/rehypeSourceLine.ts`** already stamps `data-source-line` on every block element, and `useScrollSync` already consumes it. It needs *extending* (§2.1), not writing. |
| "Build a theme system" | `src/pdf/documentStyle.ts` maps `PdfConfig` → CSS custom properties + `data-*`; `document.css` reads them. It needs *widening* from 4 tokens to a full set (§6). |
| "Templates all look the same" | **Audit before rebuilding.** Commit `e96999e` ("give every skin its own component language") and `42cb1e3` ("pair every template with a skin") landed recently. There are now **29 skins in 6 groups**. Screenshot all 29 first and find what is *actually* still undifferentiated. |
| "Add a directive system" | `remark-directive` is already a dependency and already powers callouts (`:::tip`) and page directives (`::page-break`, `:::keep-together`, `:::landscape`). |
| "Add undo/redo" | CodeMirror 6 already owns a full history. §1.4 explains why you must not build a second one. |

**Also still true — the five invariants from `V2_FRONTEND_PROMPT.md` §0.** Re-read them. The one
this brief stresses hardest: **`.scripto-doc` is cloned verbatim into the PDF, HTML and Word
exports.** Every decision in §1 follows from it.

---

## 1. The five decisions

### 1.1 mdast is the document model

Do not invent a new AST. mdast is a mature, positioned, spec'd document model with a complete
utility ecosystem, and it is already what the renderer consumes. A parallel model would need to stay
in sync with it forever — a permanent bug source for zero benefit.

**The document model is: the Markdown string + its mdast parse.** Nothing else is authoritative.

### 1.2 ⭐ Positional splicing — never whole-document re-serialization

**This is the decision that determines whether the feature ships.**

The obvious design is `edit → mutate AST → remark-stringify → new Markdown`. **Do not do this.**
`remark-stringify` normalises the *entire* document on every write:

| The user wrote | It comes back as |
| --- | --- |
| `* item` | `- item` (bullet marker normalised) |
| `_emphasis_` | `*emphasis*` |
| `Setext heading\n===` | `# Setext heading` |
| A hand-aligned table | Re-aligned to its own convention |
| Their line wrapping | Re-wrapped |
| Their raw HTML | Reformatted |

So the first click on a checkbox silently rewrites the user's whole file. Their diff explodes. Their
git history is noise. **This is the single most common reason bidirectional Markdown editors fail**,
and the brief you are replacing asks for exactly this ("Do NOT introduce ugly, unreadable generated
Markdown" — while specifying the architecture that guarantees it).

**Do this instead.** Every mdast node carries
`position: { start: { line, column, offset }, end: { … } }`. An edit is therefore a **byte-range
splice on the Markdown string**:

```ts
const next = markdown.slice(0, node.position.start.offset)
            + replacement
            + markdown.slice(node.position.end.offset)
```

Everything outside that range stays **byte-identical**. The user's formatting, spacing and style are
untouched. The diff is one line.

**The rule, stated once:** *serialize only what is new; never re-serialize what already exists.*
When inserting a genuinely new node, use `mdast-util-to-markdown` on **that node alone** and splice
the result. Never stringify the root.

### 1.3 Overlay editing — not `contenteditable`

Making `.scripto-doc` editable is tempting and wrong, for three reasons:

1. It is **cloned into the PDF/HTML/Word export**. `cleanClone()` in `src/io/exporters.ts` already
   strips `contenteditable` — someone has already been bitten by this. Do not add more of it.
2. `contenteditable` + React + a Markdown round-trip is a well-known disaster: the browser injects
   `<br>`, `<div>`, `<span style>` and pasted formatting that has no Markdown representation.
3. React will fight the browser over DOM ownership on every re-render.

**Instead:** clicking a text node opens a **positioned overlay** — a plain `<textarea>` or
`<input>` rendered above the node at its measured rect, pre-filled with the node's *Markdown source*
slice. Commit on Enter/blur, splice, done. Escape cancels.

The user edits real Markdown for that one node; the rest of the interface hides that fact.

⚠️ `Preview.tsx` applies the CSS `zoom` property to the preview wrapper. `getBoundingClientRect`
interacts with `zoom` inconsistently across browsers — compute overlay positions relative to the
scroll container and divide by the active zoom. **Test at 50%, 100% and 250%.**

### 1.4 One undo stack — CodeMirror's

Do not build a command/history stack. You would end up with two, and `⌘Z` would do different things
depending on which pane had focus. That is a bug users cannot form a mental model of.

**Every preview mutation must be applied as a CodeMirror transaction**, through the existing
`editorView` that `App.tsx` already holds:

```ts
view.dispatch({ changes: { from: startOffset, to: endOffset, insert: replacement } })
```

Undo, redo, autosave, cross-tab sync, the dirty indicator and the document library all keep working
for free, because the Markdown changed exactly the way typing changes it. **This single decision
deletes an entire subsystem from the brief you were given.**

Note `parsed.bodyLineOffset` — front-matter is split off before rendering, so mdast offsets are
relative to the *body*. Add the front-matter offset before dispatching. `useScrollSync` already does
this correctly; copy its handling.

### 1.5 Theme-first, element-second

"Full control over every element" — font, colour, border, radius, width, position, on every
heading — sounds generous. In practice it produces documents nobody can maintain, Markdown nobody
can port, and a `PdfConfig` that cannot be a preset.

Observe what users actually ask for: *"make all my H2s centered"*, *"this template's headings are
too big"*, *"I want a serif heading font"*. **Those are theme edits, not element edits.**

So build an **escape ladder**, and design the UI to keep users on the top rung:

| Rung | Scope | Stored as | Use for |
| --- | --- | --- | --- |
| **1 · Theme token** *(default)* | Every element of that type | `PdfConfig.theme` → frontmatter | "All H2 centered", heading font, spacing rhythm |
| **2 · Semantic directive** | One block | `:::center` / `:::figure` in the Markdown | A genuinely one-off alignment or treatment |
| **3 · Scoped style** *(escape hatch)* | One block | A generated id + a rule in `config.customCss` | Last resort; warn that it is not portable |

The Inspector's default action is rung 1. When a user changes one heading's alignment, offer both:
**"Center this heading"** and **"Center all H2 headings"** — and make the second the visually
primary choice. That one interaction design decision is what keeps documents clean.

**Rung 2 must degrade.** A `.md` file with `:::center` opened on GitHub must still be readable.
Container directives satisfy this; invented syntax does not.

---

## 2. The selection system

### 2.1 Extend `rehypeSourceLine` to carry offsets

Today it stamps `data-source-line` (a line number) on block tags. Splicing needs exact ranges. Add
`data-pos="<startOffset>:<endOffset>"` from `node.position`, keeping `data-source-line` unchanged so
`useScrollSync` is unaffected.

Extend `BLOCK_TAGS` to cover what must be selectable — notably `td`, `th`, `figcaption`, `code`
(fenced only) and task-list `input`. Keep inline tags out: the anchor count must stay manageable.

⚠️ The attribute lands on the live preview DOM, which is **cloned into the export**.
`prepareForPaging.ts` / `buildExportContent.ts` must strip `data-pos` (they already strip
`data-source-line`). **Verify with a real PDF export and a diff.**

### 2.2 Selection is a source range, not a DOM node

A DOM node dies on every re-render; a source range survives. Model selection as:

```ts
interface Selection {
  readonly start: number        // offset into the body Markdown
  readonly end: number
  readonly type: NodeType       // heading | paragraph | list | listItem | table | …
  readonly revision: number     // the document revision this was resolved against
}
```

After each render, re-resolve the range to a DOM node via `[data-pos]` and redraw the selection ring.

**The staleness guard is mandatory.** If the user types in the editor while a preview selection is
open, every offset after the edit shifts. Splicing at a stale offset corrupts the document silently
— the worst possible failure. Keep a monotonic `revision` on the document; if
`selection.revision !== current`, **invalidate the selection** (clear the ring, close the overlay)
rather than attempting to remap. Cheap, and always correct.

### 2.3 Interaction

Hover → a subtle outline plus a type label. Click → select. Click again on a text node → the
overlay editor (§1.3). `Escape` deselects. `↑`/`↓` move to the previous/next sibling block, `←`
selects the parent, `→` the first child. `⌘C` / `⌘V` / `Delete` / `⌘D` (duplicate) operate on the
node's source range.

Selection chrome is **screen-only** — an absolutely positioned overlay layer in the Stage, never
attributes or elements inside `.scripto-doc`. RTL must mirror; use logical properties.

Multi-select: support contiguous sibling ranges only (shift-click extends). Non-contiguous
multi-select is a large amount of work for a rare case — skip it and say so.

---

## 3. The command layer — and why it is also the agent API

Every mutation is a **pure function**:

```ts
// src/editor/commands/*.ts
type Command<A> = (markdown: string, sel: Selection, args: A) =>
  { from: number; to: number; insert: string } | null
```

It takes the document and a selection, and returns a splice — or `null` if inapplicable. It touches
no DOM, no React state, no CodeMirror. `App.tsx` applies the returned splice as a transaction (§1.4).

Starting set: `setText` · `toggleTask` · `setAlignment` · `setHeadingLevel` · `wrapInDirective` ·
`unwrap` · `insertSection` · `moveBlock` · `deleteBlock` · `duplicateBlock` · `setTableCell` ·
`addTableRow` / `Column` · `setImageAttrs` · `setCaption`.

Three payoffs from this shape:

1. **Trivially unit-testable** — `(markdown, selection, args) → splice`. No rendering. Test every
   command against fixtures including edge cases: a node at offset 0, at EOF, inside a blockquote,
   inside a list, with CRLF line endings, with front-matter present.
2. **It is the agent API, for free.** The brief you were given asks for a future MCP surface
   (`update_element`, `change_theme`, `insert_section`…). That is exactly this signature. Build the
   command layer well now and the agent integration is a thin adapter later — **but do not build MCP
   in this phase.**
3. Undo/redo, autosave and persistence come free via §1.4.

**`toggleTask` is your "hello world".** Click a task checkbox in the preview → splice `[ ]` → `[x]`
at a known offset → it re-renders checked, the editor text changes, `⌘Z` undoes it, and the exported
PDF shows the real state. It is ~40 lines and it proves the entire architecture end to end.
**Build it first, before any UI work.**

---

## 4. What Markdown cannot express

The escape ladder (§1.5) decides where each property lives. Concretely:

| Property | Rung | Representation |
| --- | --- | --- |
| Heading/paragraph text | — | The Markdown itself |
| Task checked | — | `[x]` |
| Heading level | — | `#` count |
| Alignment (all of a type) | 1 | `theme.headings.h2.align` in front-matter |
| Alignment (one block) | 2 | `:::center` container directive |
| Table column alignment | — | The GFM delimiter row (`:---:`) — **use it, do not invent** |
| Image width / caption | 2 | `:::figure{width=60%}` wrapping the image |
| Font, size, weight, leading, tracking, colour, spacing | 1 | Theme tokens |
| Per-block colour/border/background | 3 | Scoped `customCss` + generated id, with a portability warning |
| Page size, margins, header, footer, numbering | — | `PdfConfig` (already exists) |

**Front-matter is the theme's home.** Extend `src/lib/frontmatter.ts` with the same validation style
it already uses. Keep it human-readable — a user must be able to hand-edit it:

```yaml
---
title: Q3 Report
theme:
  headings:
    h1: { align: center, weight: 700, tracking: -0.02em }
    h2: { align: start }
  paragraph: { align: justify, leading: 1.65 }
---
```

**Never emit invented inline syntax** (`# Heading {color=red}`). It is unportable, breaks on GitHub,
and is exactly the "ugly generated Markdown" outcome to avoid.

---

## 5. The Inspector

The right rail becomes contextual. `ConfigPanel.tsx` (558 lines) is not deleted — it **becomes the
Document tab**, shown when nothing is selected.

- **Nothing selected** → Document: page, margins, theme, typography, skin, export, presets.
- **Something selected** → that node's controls, with the **theme-vs-element** choice made explicit
  at the top (§1.5), and a "Selected: Heading 2" breadcrumb that also allows walking to the parent.

Per-type panels: Heading (level, text, align, theme typography) · Paragraph · List (type, tightness,
markers) · Table (rows, columns, per-column align, header style) · Image (source, width, align,
caption, alt) · Code (language, wrap, theme) · Callout (type) · Page (size, orientation, margins,
header/footer/numbering).

Every control writes through the command layer (§3) — **the Inspector never touches the DOM.**

Reuse `components/ui/Field.tsx` primitives throughout. Every string i18n'd, EN **and** AR.

---

## 6. Making the 29 skins genuinely distinct

**Audit first.** Render one fixture document in all 29 skins and produce a contact sheet. Commits
`e96999e` and `42cb1e3` recently addressed this; find what is *actually* still undifferentiated
rather than assuming.

Then widen the token set. `documentStyleVars` currently emits four variables
(`--doc-font`, `--doc-size`, `--doc-leading`, `--doc-accent`). Extend to a real typographic system:

```
--doc-font-heading   --doc-scale-ratio    --doc-h1..h6-{size,weight,tracking,leading,
                                            margin-top,margin-bottom,align,case,rule}
--doc-measure        --doc-rhythm         --doc-para-{align,indent,spacing}
--doc-rule-weight    --doc-surface-alt    --doc-quote-*  --doc-table-*  --doc-code-*
```

Each skin becomes a **token composition**, not a pile of ad-hoc overrides. That is what makes new
skins cheap and user themes (§below) possible at all.

**The distinctiveness bar:** a skin must differ in **at least four** of — heading typeface, scale
ratio, weight contrast, alignment, case, rule treatment, spacing rhythm, colour usage. Changing only
the accent colour is not a skin.

**Acceptance:** the 29-up contact sheet at 240 px wide. A stranger must tell them apart. Any two
that are confusable are not finished.

**User themes:** once skins are token compositions, a custom theme is a token override object —
stored, named, and round-tripped through the existing `ExportPreset` JSON export/import. That is the
whole feature, and it only works if §6 is done properly first.

---

## 7. The application shell

Three panels, and it must not feel like three panels bolted together.

```
┌──────────────────────────────────────────────────────────────────┐
│ Header — brand · title+status · centre: mode · right: export     │
├────────────┬─────────────────────────────────┬───────────────────┤
│ Left rail  │  Editor  ·  Preview  ·  Split   │  Inspector        │
│ Outline    │                                 │  (contextual)     │
│ Pages      │                                 │                   │
│ Assets     │                                 │                   │
│ Themes     │                                 │                   │
└────────────┴─────────────────────────────────┴───────────────────┘
```

**Header** (`Header.tsx`, 474 lines — rebuild it). Three zones: identity (logo, editable document
title, save status), centre (view mode, zoom), right (export split-button, settings, language,
theme). Nothing else lives permanently in the header. Everything demoted goes to `⌘K`, which already
exists and is good. Progressive disclosure: below `lg`, collapse the centre zone into an overflow
menu — never a horizontal scrollbar, never a squeezed row.

**Left rail.** Collapsible to icons, persisted. *Outline* (promote the existing
`OutlineNavigator` — clicking a heading selects it in the preview, closing the loop with §2),
*Pages* (thumbnails from the paginated render), *Assets* (embedded images, with sizes and a way to
delete the ones bloating storage), *Themes* (skins + presets + user themes).

**Floating toolbar.** On selection, a small toolbar near the node with the 3–5 highest-value actions
for its type. `SelectionToolbar.tsx` already exists for the editor — extend that pattern to the
preview rather than writing a second one. It must flip above/below at page edges and mirror in RTL.

**Motion.** Reuse `src/lib/motion.ts` and `useStageTransition`. Do not introduce a second motion
vocabulary.

---

## 8. Responsive

| Width | Layout |
| --- | --- |
| ≥ 1440 | Three panels, all persistent |
| 1024–1439 | Three panels; Inspector overlays on demand |
| 768–1023 | Editor/Preview tabs; Inspector and rail as sheets |
| < 768 | **Preview-first.** Bottom tab bar (Edit · Preview · Design). Inspector is a bottom sheet with drag-to-expand. Tap-to-select works; the overlay editor becomes a full-width sheet above the keyboard. |

Test at **320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920**. Touch targets ≥ 44 px.
Do not shrink the desktop layout — design the small layout deliberately.

---

## 9. Depth and 3D — extend the Stage, do not replace it

The Stage system (`src/preview/stage/`) already owns screen-only depth. All of this belongs there.

Worth doing: layered paper shadow that responds to scroll velocity; a slight perspective tilt on the
sheet while dragging the split handle, settling flat on release; real page-stack depth in Pages mode
(edges of pages behind the current one); a genuine page-turn between pages in Pages mode; depth-aware
hover on selectable blocks (1–2 px lift, no more).

**Hard limits.** Never apply a transform, perspective, filter or 3D context to `.scripto-doc` — it is
the exported element (invariant #2), and a 3D context also creates a containing block that will
break the selection overlay's coordinate math. Transform the **wrapper**. Everything
`transform`/`opacity` only. All of it collapses to a flat cross-fade under
`prefers-reduced-motion`. Reading the document must never be harder because of an effect.

---

## 10. Performance

The document re-parses on a 120 ms debounce today, and that must not regress.

- **Selection must not re-parse.** Clicking a heading changes overlay state only. Verify with a
  React profile: selecting a node must cause **zero** `MarkdownRenderer` renders.
- **Splices are incremental** — a CodeMirror transaction, then the existing debounced path. No full
  reload, ever.
- **Parse in a worker** if a 100-page document stutters — but measure first; the debounce may be
  sufficient.
- **Pages-mode thumbnails** must be virtualised.
- **Budget:** typing latency unchanged; select-to-highlight < 50 ms; splice-to-repaint < 150 ms.
  Report real numbers.

---

## 11. Accessibility

The preview becomes an interactive control surface, so it needs real semantics: a `role="tree"`-ish
model or per-block `tabindex` with a roving index; visible focus rings distinct from selection rings;
`aria-live` announcements for applied changes; full keyboard parity for everything doable with a
mouse (§2.3); AA contrast for all new chrome in light and dark; `prefers-reduced-motion` honoured.

**The document itself must stay clean.** Selection affordances live in the overlay layer, never as
ARIA attributes inside `.scripto-doc` — they would ship into the exported HTML.

---

## 12. Verification

```bash
npx tsc -b --force && npm run lint && npm run build && npm run test
SCRIPTO_VISUAL=1 npm run test
```

**Required new tests** — the command layer (§3) is pure, so test it hard:
- Every command against fixtures: node at offset 0, at EOF, inside a blockquote, inside a nested
  list, with CRLF, with front-matter present, with a Unicode/emoji body.
- **Byte-preservation:** apply a command to a document using `*` bullets, `_emphasis_`, a Setext
  heading and a hand-aligned table — assert **every byte outside the spliced range is unchanged.**
  This is the §1.2 guarantee; it must be a test, not an intention.
- **Round-trip:** edit → undo → the document is byte-identical to the original.
- **Staleness:** a splice attempted against a stale revision is refused (§2.2).
- Offset mapping with front-matter present matches `useScrollSync`'s behaviour.

**Manual:**
- [ ] Toggle a checkbox in the preview → editor text updates → `⌘Z` reverts → PDF shows real state.
- [ ] Edit a heading via the overlay → only that line differs in the Markdown.
- [ ] Type in the editor with a preview selection open → selection invalidates cleanly, no corruption.
- [ ] Export a PDF → **no `data-pos`, no selection chrome, no `contenteditable`** in the output; diff
      against `main` for an unedited document must be identical.
- [ ] Export HTML and Word → same check.
- [ ] Overlay positioning correct at 50%, 100%, 250% zoom.
- [ ] Full keyboard-only pass: select, navigate, edit, undo.
- [ ] RTL: selection rings, floating toolbar, Inspector, overlay all mirror.
- [ ] 320 px and 1920 px both usable.
- [ ] 100-page document: typing latency unchanged; selection responsive.

---

## 13. Out of scope

Anything needing a server. Also **not now**: MCP/agent integration (build the command layer to
*enable* it — §3 — but ship no agent surface), AI document restyling, drag-to-reorder blocks
(add after selection is proven), non-contiguous multi-select, and free-form absolute positioning of
elements (meaningless in a paginated flow document — do not offer it).

---

## 14. Order — and where to stop

**This is too large for one session. Ship it in four.**

| # | Scope | Proves |
| --- | --- | --- |
| **1** | §2.1 offsets · §2.2 selection model + staleness guard · §3 command layer · **`toggleTask` only** · full unit tests | The whole architecture, end to end, with almost no UI |
| **2** | Selection UI, overlay text editing, floating toolbar, keyboard navigation | The interaction model |
| **3** | §5 Inspector · §1.5 escape ladder · §4 front-matter theme · §6 token widening + 29-skin audit | The design system |
| **4** | §7 shell revamp · §8 responsive · §9 depth · §10 performance pass | The polish |

**Do not start session 2 until session 1's byte-preservation test passes.** Everything else rests
on it.

---

## 15. Final report

Per session: what shipped; the byte-preservation and round-trip test results; the PDF diff for an
unedited document; measured selection and splice latencies; the 29-skin contact sheet; bundle delta;
and anything deferred with the reason.

**If any part of §1 turned out to be wrong, say so explicitly** — those decisions are load-bearing
and a later session needs to know they moved.
