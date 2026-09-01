# Scripto — The Handwriting Engine

> **Follow-up to `docs/V2_FRONTEND_PROMPT.md`.** That brief is largely delivered: the Stage system,
> the visual page-break editor, export presets, the `App.tsx` decomposition, the Paged.js stall
> root-cause, and 8 new skins have all shipped. This document is the next body of work.
>
> **Still frontend-only. No backend, no network calls beyond font CDN.**
>
> This is the most design-sensitive feature Scripto has attempted. Read §1 and §3 before writing
> a line of code — the naive implementation (pick a handwriting font, ship it) looks fake, and the
> difference between fake and convincing is entirely in the details specified here.

---

## 0. Where the codebase is now

Re-orient before starting; several things named in the v2 brief have changed.

- **29 skins**, not 21 — `src/data/skins.ts` now carries a `SkinGroup` taxonomy
  (`essentials | business | technical | editorial | academic | expressive`) with `SKIN_GROUPS`.
- **The Stage system exists.** `src/preview/stage/stages.ts` is
  `Record<DocumentSkin, StageDescriptor>` — **adding a skin without a stage is a compile error.**
  Stage vocabulary: `StageMotion` (10 primitives), `StageFrame` (12 decorations), `StageMark`.
  All screen-only, keyed `[data-stage='<skin>']` in `src/preview/stage/stage.css`.
- **`PdfConfig.hand` does not exist yet** — you are adding it.
- `DocumentFont` is still a 5-value union (`serif | sans | lora | system | arabic`).
- **Fonts load from one Google Fonts URL**, duplicated in **two** places that must stay in sync:
  `index.html` (preload → stylesheet swap) and `FONTS_HREF` in `src/io/exporters.ts`.
- The five invariants from `V2_FRONTEND_PROMPT.md` §0 still hold. **Re-read them.** The most
  important, restated: **`.scripto-doc` is cloned verbatim into the PDF/HTML/Word exports.**

---

## 1. The thesis: why handwriting fonts look fake, and what fixes it

Drop Caveat on a document and it reads as *a font*, not as writing. Six things give it away, and
each has a specific fix. **This table is the feature.**

| Tell | Why it reads fake | The fix |
| --- | --- | --- |
| Every `a` is identical | Real hands never repeat a glyph exactly | OpenType `calt` + stylistic sets; per-word variation palette (§3) |
| Perfect baseline | Real lines drift and wobble | Per-word `translateY` jitter, ±0.6 px |
| Uniform slant | Real slant varies word to word | Per-word `rotate` jitter, scaled by *neatness* |
| Uniform stroke weight | Real pens vary with pressure | Per-word `font-variation-settings: 'wght'` on variable hands (§3.4) |
| Text floats above the paper | Real writing sits **on** the rule | Rule-pitch locking (§4.2) — the hardest part of this feature |
| Rules, bullets and boxes are machine-straight | Nothing drawn by hand is straight | Hand-drawn element layer (§5) |

**The single most important sentence in this document:** all variation must be **deterministic** —
a pure function of `(seed, wordIndex)`, never `Math.random()`.

Three independent reasons:
1. Paged.js re-renders on every pagination. Fresh randomness ⇒ different word widths ⇒ **different
   page breaks every time you open Print Preview.**
2. `preview === PDF` would break — the preview and the export would jitter differently.
3. The preview would visibly shimmer on every keystroke re-render.

Use a small seeded PRNG (`mulberry32`) in `src/lib/handwriting/random.ts`. Seed from a stable hash of
the document id. **Add a unit test asserting that the same input produces byte-identical output
across two independent runs.**

---

## 2. The data model — a new orthogonal axis

Handwriting is **not a skin**. It is `hand × ink × stationery × neatness × slant × variation ×
aging × drawn-elements`. Expressed as skins that would need 20+ entries; expressed as an axis it
composes with all 29 existing skins.

Add to `src/types/index.ts`:

```ts
/** Which hand writes the document. `none` = normal typeset text. */
export type HandStyle =
  | 'none'
  // Latin — everyday
  | 'casual'        // Caveat — relaxed ballpoint, variable weight axis
  | 'neat-print'    // Patrick Hand — tidy printing, very legible
  | 'architect'     // Architects Daughter — drafting hand, all-caps feel
  | 'marker'        // Gloria Hallelujah — thick felt tip
  | 'scratchy'      // Reenie Beanie — fast, untidy, ballpoint
  | 'rushed'        // Just Another Hand — tall, condensed, hurried
  // Latin — expressive
  | 'script'        // Dancing Script — flowing, connected
  | 'copperplate'   // Great Vibes — formal calligraphic
  | 'monoline'      // Sacramento — even-width script
  | 'cursive'       // Cedarville Cursive — schoolbook cursive
  | 'chalk'         // a chalkboard hand
  // Arabic
  | 'ruqaa'         // Aref Ruqaa — the everyday Arabic hand
  | 'naskh-hand'    // Lateef — softer handwritten Naskh
  | 'diwani'        // decorative Arabic
  // User-supplied
  | 'custom'        // an uploaded font — see §7

export type InkStyle =
  | 'ballpoint-blue' | 'ballpoint-black' | 'fountain-blue' | 'fountain-black'
  | 'pencil' | 'marker' | 'red-pen' | 'gel' | 'chalk-white' | 'sepia'

export type Stationery =
  | 'blank' | 'ruled-college' | 'ruled-wide' | 'ruled-narrow'
  | 'graph' | 'dot-grid' | 'isometric'
  | 'legal-pad' | 'engineering' | 'cornell' | 'index-card' | 'steno'
  | 'practice-lines'   // 4-line with dashed midline — handwriting worksheets
  | 'music-staff'
  | 'parchment' | 'kraft' | 'graph-blue'

/** How far the variation engine goes. Higher tiers cost DOM weight (§3.5). */
export type HandVariation = 'none' | 'word' | 'expressive'

export interface HandConfig {
  readonly hand: HandStyle
  /** A second hand for headings — real notes title more carefully than they write. */
  readonly headingHand: HandStyle | 'same'
  readonly ink: InkStyle
  readonly stationery: Stationery
  /** 0 = careful and even, 1 = rushed and messy. Scales all jitter amplitudes. */
  readonly neatness: number
  /** -1 = left-handed back-slant, 0 = upright, 1 = strong right lean. */
  readonly slant: number
  readonly variation: HandVariation
  /** 0 = fresh, 1 = yellowed paper, faded ink, fold creases. */
  readonly aging: number
  /** Hand-drawn rules, bullets, checkboxes, underlines, table borders (§5). */
  readonly drawnElements: boolean
  /** A stable seed so jitter never changes under the same document. */
  readonly seed: number
}
```

Then `readonly hand: HandConfig` on `PdfConfig`, with `DEFAULT_HAND` (`hand: 'none'`) in
`src/lib/constants.ts`. **`hand: 'none'` must be a total no-op** — no extra DOM, no extra CSS, no
plugin work, no font requests. A user who never touches handwriting must not pay one byte for it.

**Front-matter** (`src/lib/frontmatter.ts`): map `hand`, `ink`, `paper`/`stationery`, `neatness`,
`aging` with the existing validation style (validate against the unions; ignore unknown values).
That is what lets a template declare its own hand.

---

## 2.5 Libraries — what to use, what to build

**Do not hand-roll what is already solved.** Verified against this repo's installed tree:

| Need | Use | Size / licence | Notes |
| --- | --- | --- | --- |
| Hand-drawn rules, boxes, underlines, ticks (§5) | **`roughjs`** | ~9 KB gz, MIT | **Already in the tree** — Mermaid 11.16.0 depends on `roughjs ^4.6.6`. Adding it as a direct dependency dedupes to ~0 extra bundle. |
| Sketchy Mermaid diagrams (§5.2) | **`look: 'handDrawn'`** | **free** | Mermaid 11.16.0 supports it natively (that is *why* it bundles rough.js). A config flag, not a dependency. |
| Pressure-sensitive stroke capture (§7) | **`perfect-freehand`** | ~4 KB gz, MIT | Turns pointer input into a variable-width outline. Also powers the signature line. |
| Generating a real font file in-browser (§7) | **`opentype.js`** | ~200 KB, MIT | Can **write** `.otf`, not just parse. Must be lazy-loaded. |
| The hands themselves | **Google Fonts** (OFL) | — | Caveat (variable `wght`), Patrick Hand, Architects Daughter, Aref Ruqaa… |
| Seeded PRNG, word wrapping, stationery, rule-pitch locking | **build our own** | ~150 lines | Too specific to generalise; `mulberry32` is five lines. |
| Font readiness | **native `FontFace` / `document.fonts`** | — | No `fontfaceobserver`. |

### Why rough.js rather than our own stroke generator

It takes a **`seed`** option — so it satisfies §1's determinism requirement directly — and exposes
`roughness` and `bowing`, which map onto the *neatness* slider with no translation layer. It emits
SVG `<path>` elements, so output stays vector: **selectable, scalable, and correct at print DPI.**

**Bundle discipline:** lazy-load `roughjs` only when `drawnElements` is on, and `opentype.js` +
`perfect-freehand` only when the "create my hand" flow opens. A user with `hand: 'none'` must
download none of it.

---

## 3. The variation engine

### 3.1 The plugin

`src/markdown/plugins/rehypeHandwriting.ts` — a rehype plugin, registered in
`MarkdownRenderer.tsx` **last**, after `rehype-prism-plus` and `rehype-katex`.

**Skip list — never descend into these:**
`pre`, `code`, `.katex`, `.katex-display`, `svg` (Mermaid), `.mermaid-figure`, `.ascii-figure`,
`.hljs`, anything with `data-code-chunk`, and any element already carrying `.hw`.

Rationale: Prism has already produced a precise span tree; KaTeX layout is positionally exact;
Mermaid is SVG. Wrapping inside any of them corrupts them.

### 3.2 Word wrapping — use a class palette, not inline styles

The naive approach writes `style="--hw-r:0.7deg;--hw-y:0.4px"` on every word. On a 100-page
document that is ~50,000 inline style attributes, which bloats the DOM, the export clone, the
standalone HTML export, and pagination time.

**Do this instead:** precompute **16 jitter buckets** as CSS classes.

```html
<span class="hw hw-7">handwriting</span>
```

```css
.scripto-doc[data-hand] .hw   { display: inline-block; will-change: auto }
.scripto-doc[data-hand] .hw-7 { transform: translateY(.35px) rotate(.42deg); font-variation-settings: 'wght' 412 }
/* …16 buckets, amplitudes multiplied by --hw-neatness at the root… */
```

Bucket = `prng(seed, wordIndex) * 16 | 0`. Sixteen buckets is enough to defeat the eye and costs
16 CSS rules instead of 50,000 style attributes. Amplitudes scale from one root custom property
(`--hw-neatness`) so the *neatness* slider is a single CSS variable change — **no re-parse, no
re-wrap, no re-pagination.** That is the difference between a slider that feels instant and one
that hangs the tab.

### 3.3 Never split inside a word

Split on whitespace only. **Never split a word into per-character spans.**

- For Latin it destroys kerning and ligatures.
- **For Arabic it is catastrophic** — Arabic is a connected script; splitting a word breaks glyph
  shaping and the text renders as disconnected isolated forms. It becomes unreadable.

Therefore `variation: 'expressive'` must **never** mean glyph-level DOM splitting. It means:
more buckets (32), wider amplitude, and OpenType stylistic sets — nothing structural.

### 3.4 Pressure, via variable fonts

Caveat ships a `wght` axis. Where the active hand is variable, add a jittered
`font-variation-settings: 'wght' <380–460>` to each bucket. This simulates pen pressure and is the
single highest-payoff detail in the whole engine — it is what stops the text looking flat.
Gate it behind a per-hand `variable: true` flag in the hand registry; for static fonts, omit it.

### 3.5 Performance contract

- `variation: 'none'` → the plugin returns the tree untouched. Zero cost.
- Above **20,000 words**, degrade to `'none'` automatically and toast once (i18n string). Do not
  let a thesis freeze the tab.
- Wrapping runs inside the existing debounced render path — it must not add more than ~15 ms for a
  typical 10-page document. Measure it; report the number.
- `transform` on inline-blocks is compositor-friendly, but 50k composited layers are not. Do **not**
  set `will-change: transform` on `.hw`.

---

## 4. Stationery — and the hard part

### 4.1 Papers, all CSS-only

Every stationery is built from `repeating-linear-gradient` / `radial-gradient` / `conic-gradient`.
**Zero image bytes.** Live in a new `src/styles/stationery.css`, keyed `[data-stationery='x']`.

Note `cornell` (cue column + summary band), `practice-lines` (4 lines with a dashed midline — this
one exists for teachers making handwriting worksheets, a real and underserved audience), and
`music-staff`.

### 4.2 ⚠️ Rule-pitch locking — read this twice

**Handwriting on ruled paper must sit ON the rules.** If the text baseline and the rule are even
1 px out of phase, the whole illusion collapses and it looks worse than plain text. Three
constraints, all mandatory:

1. **`line-height` must equal the rule pitch exactly.** When a ruled stationery is active, derive
   `--doc-leading` from the pitch instead of `config.lineHeight`, and **disable the line-height
   slider in the UI** with a short explanation (i18n) rather than letting the user silently break it.
2. **The top margin must be an integer multiple of the pitch.** Add
   `snapMarginsToRule(margins, pitch)` in `src/lib/handwriting/rules.ts` and apply it when a ruled
   stationery is active. Surface the adjusted value in `ConfigPanel` so nothing appears to change
   behind the user's back.
3. **The rules must restart in phase on every page.** This is the real problem. Under Paged.js each
   `.pagedjs_page` is its own box, so a background painted on the document body will drift. Paint
   the rules on the **page box** in `src/pdf/pageStyles.ts` (`@page { background-image: … }` /
   `.pagedjs_page` background), not on `.scripto-doc`, and ensure the content box top sits at an
   exact multiple of the pitch from the page top.

**Acceptance for §4.2:** export a 5-page ruled document. On **every** page, every line of body text
must sit on a rule. Check page 1, page 3 and the last page. If page 4 drifts, this is not done.

### 4.3 Aging

`aging` (0–1) drives: paper yellowing (a warm overlay), ink fade (opacity + slight desaturation),
edge vignetting, and fold creases (two faint gradient lines). All CSS. Fold creases and vignette are
subtle at 1.0 — this is a seasoning control, not a filter.

---

## 5. Hand-drawn elements

With `drawnElements: true`, the machine-straight furniture is replaced by hand-drawn strokes.
Implement as **inline SVG paths generated from the seeded PRNG**, in
`src/lib/handwriting/strokes.ts` — three stroke variants per element type, chosen by bucket.

| Element | Hand-drawn treatment |
| --- | --- |
| `h1`–`h3` | A wobbly underline stroke; H1 optionally double-struck |
| `hr` | A squiggle, never a straight rule |
| `blockquote` | A drawn bracket down the inline-start edge |
| `ul` bullets | Drawn dots / dashes / asterisks, varying per item |
| Task checkboxes | A drawn box; checked items get a drawn tick that overshoots the box |
| `table` | Hand-ruled borders with slight wobble |
| Callouts | A drawn box plus a margin doodle for the type |
| `==mark==` | A highlighter swipe with uneven ends, not a rectangle |
| `a` | A hand underline in the ink colour |
| Images | Photo-corner mounts or washi tape |

### 5.1 Code, math and diagrams — the "taped-in printout"

**Do not set code, math or Mermaid in a handwriting font.** It becomes unreadable, and this is the
mistake every handwriting theme makes.

Instead present them as artefacts that were *printed and taped into the notebook*: keep the
monospace/KaTeX/SVG rendering exactly as-is, and give the block a screen-and-print treatment — a
white card, a fraction of a degree of rotation (seeded, so it is stable), a soft drop shadow, and
tape corners. It reads as deliberate. It is also the honest engineering answer, because it preserves
legibility, selectable text and vector output.

### 5.2 Sketchy diagrams — free

Mermaid 11.16.0 (installed) supports `look: 'handDrawn'` natively. When `drawnElements` is on, pass
it in the Mermaid init config in `src/markdown/components/Mermaid.tsx`. Combined with
`handDrawnSeed` (set it from `HandConfig.seed`) the diagrams are deterministic too. **No new
dependency, roughly ten lines.** It is the highest payoff-to-effort item in this brief — do it early
so the demo lands.

## 6. Fonts — loading, offline, and PDF weight

Handwriting fonts must **not** join the global font URL in `index.html`. That URL is preloaded on
every visit including the marketing site; adding 15 display faces would wreck LCP and CLS on pages
that will never use them.

**Required approach:**
- A hand registry in `src/lib/handwriting/hands.ts`:
  `Record<HandStyle, { family, googleParam, variable: boolean, scripts: ('latin'|'arabic')[], fallback }>`.
- Load **on demand** when a hand is selected — inject a `<link rel="stylesheet">` for that family
  only, once, and track loaded families in a module-level `Set`.
- **`await document.fonts.load(...)` before allowing export.** `renderPaged.ts` already awaits
  `document.fonts.ready`; a hand that is still loading when Paged.js measures will paginate against
  the fallback metrics and the PDF will be wrong. Block the Print Preview until the hand is ready,
  showing the existing progress UI.
- **PWA/offline:** Google Fonts are runtime-cached, so a hand used once works offline afterwards,
  but a *newly chosen* hand will not load on a plane. Detect the failure and toast honestly
  (i18n) rather than silently rendering the fallback.
- **`src/io/exporters.ts` `FONTS_HREF`** must include the *active* hand for the standalone HTML and
  Word exports — build it dynamically from the config instead of the current constant.
- **PDF size:** browser print embeds the full face. Display scripts are large; a handwriting PDF may
  be several MB heavier. Note it in the export UI when `hand !== 'none'`.

### 6.1 Arabic hands — the differentiator

No markdown→PDF tool does Arabic handwriting. Ruqʿah (`Aref Ruqaa`) is the everyday Arabic hand and
this is genuinely unprecedented in this product category.

Rules: Arabic hands are `scripts: ['arabic']` and must be filtered out of the picker for LTR
documents (and vice-versa) — or clearly marked, since a Latin hand renders Arabic as tofu. Word-level
jitter is safe; §3.3's no-glyph-splitting rule is **absolute** here. `slant` is meaningless for
Arabic — hide the control when an Arabic hand is active.

---

## 7. "Your own handwriting" — two paths

Fully client-side, and the reason people will tell other people about this.

### 7.1 Path A — import a font (ship this first)

1. **Scripto generates the capture sheet.** A new template (`handwriting-capture`) renders a grid of
   boxes, one per character, sized for a service like Calligraphr. The user exports it as a PDF from
   Scripto itself — the product produces its own onboarding artefact.
2. They print it, write in it, scan it, convert it (Calligraphr has a free tier) to `.ttf`/`.otf`/`.woff2`.
3. **They upload the font back.** Store the bytes in IndexedDB, register at runtime via the
   `FontFace` API, expose as `hand: 'custom'`.
4. It embeds in the PDF like any other font.

**Constraints:** validate magic bytes and reject non-fonts; cap ~5 MB; handle `FontFace` rejection
with a real message; let the user name, list and delete hands. Never send the file anywhere — say so
plainly in the dialog.

### 7.2 Path B — draw your alphabet in the browser (the moonshot)

Path A depends on a printer, a scanner and a third-party service. **Path B removes all three.**

1. A canvas glyph grid: the user writes each character with a finger, stylus or trackpad.
2. **`perfect-freehand`** converts each pointer stroke into a variable-width outline — capture the
   stroke as vectors from the start, so there is **no raster-tracing step at all**.
3. **`opentype.js`** assembles those outlines into glyphs and **writes a real `.otf`** in the browser.
4. Register via `FontFace`, store in IndexedDB, use it like any other hand.

Fully offline, no account, no upload, no external service. This is the single most shareable thing
in this brief — see §9.

**Scope control:** Latin upper + lower + digits + common punctuation (~70 glyphs) is enough. Derive
sensible side bearings from the drawn bounding box; do not attempt kerning pairs. Autosave progress
so a half-finished alphabet survives a reload. **Do not attempt Arabic in Path B** — Arabic needs
four positional forms per letter plus shaping rules, which is a different and much larger project.
Say so in the UI rather than shipping something broken.

## 8. Working across all 29 skins and every template

The handwriting axis composes with **29 skins × 58+ templates**. Most combinations are fine; some
are actively wrong. Handle this with data, not hope.

### 8.1 Hand affinity — a required field on every skin

Add to `SkinOption` in `src/data/skins.ts` (required, so `tsc` forces a decision for all 29):

```ts
/** How well this skin receives a handwriting hand. */
export type HandAffinity = 'native' | 'good' | 'adapts' | 'discouraged'
```

| Affinity | Meaning | Skins |
| --- | --- | --- |
| `native` | Designed for a hand; ships one by default | the 6 new skins (§10.1) |
| `good` | Reads well immediately | `modern` `classic` `notebook` `manuscript` `zen` `editorial` `playful` `handout` `poster` `elegant` |
| `adapts` | Works once the skin's own furniture yields (§8.2) | `compact` `memo` `letter` `thesis` `journal` `newsprint` `brutalist` `dark` `corporate` `technical` |
| `discouraged` | Handwriting fights the skin's purpose | `terminal` `blueprint` `swiss` `ledger` `invoice` `contract` `rfc` `changelog` `resume` |

**`resume` deserves a specific warning.** A handwritten CV defeats the entire point of the ATS skin.
Warn clearly and offer to switch skins — but still allow it. Users get to make their own choices.

**Policy — guide, never block:**
- The skin picker and Skin Rail show a small hand-affinity badge.
- Applying a hand to a `discouraged` skin shows a **one-time, dismissible inline notice** (not a
  modal, not on every change) offering a one-click switch to `handwritten`.
- Nothing is ever hard-blocked or silently overridden.

### 8.2 Yield rules — the compatibility work

Every skin decorates with its own furniture. Some of it contradicts a hand and must yield when
`[data-hand]` is present on the root. Because `documentDataAttrs` already emits `data-skin`, adding
`data-hand` makes combined selectors natural:

```css
.scripto-doc[data-skin='corporate'][data-hand] h2 { background: none; color: var(--ink) }
```

**Audit all 29.** Most need nothing; write an override block only where the skin genuinely fights
the hand. Known cases to check:

| Skin | What must yield |
| --- | --- |
| `corporate` | Filled heading bars → a drawn underline |
| `technical` | Boxed sidebars → drawn boxes |
| `swiss` / `brutalist` | Heavy machine rules → drawn rules, or hold the skin's rules deliberately |
| `terminal` / `dark` | Ink colour must invert to a light chalk/gel ink; `chalk-white` is the sane default |
| `ledger` / `invoice` | **Keep tabular figures monospace** — handwritten numerals in a totals column are unreadable |
| `newsprint` | The kicker rule → a drawn stroke |
| `memo` / `letter` | The header band → a drawn rule |
| `poster` | Display sizes need jitter amplitude scaled *down* — large type magnifies wobble |

**That last point is a general rule:** jitter amplitude must scale **inversely** with font size, or
headings look drunk while body text looks fine. Bake it into the bucket CSS via `em`-relative units,
not `px`.

### 8.3 Templates

All 58+ templates must render acceptably with a hand applied. Add a **dev-only contact-sheet route**
(`/app?dev=hand-matrix`, excluded from the SSG route table) that renders every template at thumbnail
size with `hand: 'casual'` — one screen, one glance, obvious breakage. Fix what breaks; for templates
where a hand is genuinely wrong (`invoice`, `contract`, ATS résumés), rely on §8.1's affinity badge
rather than special-casing.

### 8.4 Applying smoothly — the transition contract

Turning a hand on or off swaps the font, which changes metrics, which reflows the document. Done
naively it is a jarring flash-and-jump. Required sequence:

1. **Load the font first.** `await document.fonts.load('1em <family>')` **before** touching config.
   Never apply a hand that has not loaded — the fallback flash followed by a metric jump is the
   single worst thing this feature can do.
2. Show a brief inline pending state on the Handwriting toggle while loading.
3. Apply in **one frame**, and run the transition through the existing
   `src/preview/motion/useStageTransition.ts` — reuse the vocabulary, do not invent a second
   transition system.
4. `neatness`, `slant` and `aging` are **CSS-variable-only** changes (§3.2) — instant, no re-wrap,
   no re-pagination. Verify by dragging the slider on a 20-page document.
5. Under `prefers-reduced-motion`, cross-fade only.
6. If the font fails to load (offline, blocked), **do not apply the hand.** Toast honestly and leave
   the document as it was.

---

## 9. The viral moment — design for it deliberately

The output has to be worth posting, and posting it has to bring people back. Four mechanics, all
frontend:

1. **The artefact is the ad.** A handwritten PDF page is recognisable at thumbnail size in a
   timeline — which is exactly what the Stage system already optimises for. When a hand is active,
   set the **"Made with Scripto" attribution footer in the same hand**. Small, charming, and it
   signs every shared document without being an ad.
2. **Shareable hand recipes.** `HandConfig` is tiny. Encode it into the existing deep-link system
   (`src/hooks/useDeepLinks.ts`, already allowlist-validated) as `/app?hand=<compact-encoding>`, so
   someone can post *"here's my exact setup"* and a stranger lands in the editor with it applied.
   Reuse the existing validation pattern — **never `eval` or trust the parameter shape.**
3. **"I made a tool that writes in my handwriting."** §7.2 is the story. Path B — draw your alphabet
   with your finger, get a real font, export a PDF — is a 20-second screen recording that explains
   itself with no voiceover. Build it, then record it.
4. **Feed the content machine** (`ARCHITECTURE.md` §14 — pages generate automatically):
   a `/handwriting` use-case page (+ Arabic variant), the six new skin pages, the new template pages,
   and a blog post. Add a **before/after slider** on the landing page: the same Markdown as a plain
   PDF and as a handwritten one.

**Honest framing:** market it as *notes, letters, journals, cards and worksheets* — not as
"make documents look authentic." That framing is both truthful and, per §12, the right boundary.

---

## 10. Skins, stages, templates and presets

### 10.1 Six new skins — each needs a stage (compile-enforced)

Add to `DocumentSkin`, `SKIN_OPTIONS` (group `expressive`, except `worksheet` → `academic`;
all six `handAffinity: 'native'`), a `document.css` block, an i18n label, **and a `STAGES` entry** —
`stages.ts` is `Record<DocumentSkin, StageDescriptor>`, so `tsc` fails until every one exists.

| Skin | Character | Stage (screen-only) | Motion |
| --- | --- | --- | --- |
| `handwritten` | The default hand — casual, college-ruled | **Desk** — warm wood ground, soft lamp pool, pen shadow at the edge | `type` |
| `journal-hand` | Personal diary, aged paper, sepia ink | **Nightstand** — dim ground, warm lamp vignette | `bloom` |
| `field-notes` | Pocket notebook, small, dense, graph | **Field** — canvas texture, notebook elastic band | `snap` |
| `chalkboard` | Chalk on slate, white/pastel ink | **Classroom** — dark slate ground, chalk dust bloom | `draw` |
| `letter-hand` | Personal correspondence, fountain ink | **Writing desk** — linen ground, envelope shadow behind the sheet | `wipe` |
| `worksheet` | Practice lines, teaching material | **Schoolroom** — pale ground, pencil-tray edge | `cascade` |

⚠️ Name it `journal-hand`, not `journal` — an academic `journal` skin already exists.

Reuse existing `StageFrame` values where they fit; add new ones only where genuinely needed, and
keep them in `stage.css` — **never on the sheet.**

### 10.2 Templates

Seven, each declaring its hand in front-matter: **Handwritten letter**, **Journal entry**,
**Lecture notes** (Cornell), **Recipe card** (index card), **Handwriting worksheet** (practice
lines — for teachers), **Handwriting capture sheet** (§7.1), and an **Arabic handwritten letter**
using `ruqaa`. Add `nameKey`/`descKey` to `EN_STRINGS` **and** `STRINGS.ar`.

### 10.3 Presets

Add hand-aware entries to `DOCUMENT_PRESETS`, and confirm the `ExportPreset` flow round-trips a
`hand` block through save → JSON export → import.

---

## 11. The UI

A **Handwriting** section in `ConfigPanel`, collapsed by default, opening with a single `Switch`.
When off, everything below is hidden and nothing loads.

- **Hand** — a visual picker rendering the sample phrase *in each hand*, not a text dropdown.
  Grouped by script; Arabic hands only shown for RTL/auto documents.
- **Ink** — colour swatches with the pen name.
- **Paper** — thumbnail grid of the stationeries.
- **Neatness**, **Slant** — `Slider`s updating a CSS variable live (§3.2). Slant hidden for Arabic.
- **Aging** — `Slider`.
- **Hand-drawn elements** — `Switch` (lazy-loads `roughjs`).
- **Two hands** — heading hand selector.
- **My handwriting** — §7 upload / draw flow.

Plus a `⌘K` command, hand-affinity badges in the skin picker and Skin Rail (§8.1), and hover-preview
in the rail for the six new skins.

---

## 12. Guardrails — handwriting, signatures and authenticity

Handwriting plus aging plus signatures is, taken together, a document-forgery kit. This feature is
legitimate and creative and should ship — but keep these boundaries:

- **Do not build handwriting replication from a photo or writing sample.** §7 is the user's *own*
  hand, produced by their own deliberate effort. Never "match this handwriting" from an image.
- **Signature blocks are signature *lines*** — a labelled ruled space to sign, not a rendered
  imitation of a real person's signature.
- **Do not ship preset combinations framed as making a document look like a genuine aged or official
  record.** Aging is a stylistic control, not an authenticity simulator.
- Leave the "Made with Scripto" attribution default **on**.
- Keep the framing creative — notes, letters, journals, worksheets, cards.

---

## 13. Verification

```bash
npx tsc -b --force && npm run lint && npm run build && npm run test
SCRIPTO_VISUAL=1 npm run test
```

**New tests (required):**
- **Determinism** — the PRNG yields byte-identical bucket sequences across two runs for one seed.
- **Skip list** — the plugin leaves `pre`, `code`, `.katex` and `svg` subtrees untouched (assert node
  counts unchanged).
- **Arabic integrity** — an Arabic paragraph splits only at spaces; no word contains a nested `.hw`.
- **Rule snapping** — `snapMarginsToRule` returns an exact multiple of the pitch.
- **Affinity exhaustiveness** — every one of the 29 skins declares a `handAffinity`.
- **Visual fixture** — `tests/visual/fixtures/handwriting.md` (ruled + drawn elements + a code block
  + a table) in the Paged.js harness.

**Manual:**
- [ ] **`hand: 'none'` is a total no-op** — PDF byte-identical to `main`, and **zero** handwriting
      font / `roughjs` / `opentype.js` requests in the network tab.
- [ ] A 5-page ruled document: text sits on the rules on **every** page (§4.2).
- [ ] Code, math and Mermaid stay legible in a handwriting document.
- [ ] Arabic Ruqʿah exports correctly RTL with connected letterforms intact.
- [ ] Exported PDF text is still **selectable and searchable** — nothing rasterised.
- [ ] The hand-matrix contact sheet (§8.3): no template is visibly broken.
- [ ] Neatness slider on a 20-page document: instant, no re-pagination.
- [ ] Toggling a hand on/off: no fallback flash, no metric jump (§8.4).
- [ ] 20k-word document degrades gracefully with the toast.
- [ ] Offline: a used hand works; a new one fails with an honest message.
- [ ] Reduced motion, LTR + RTL, light + dark, 375 px.

---

## 14. Out of scope

Anything needing a server. Also explicitly **not** now: rasterising SVG-filter ink texture into the
PDF (it destroys the text layer — prototype it screen-only and opt-in if at all), scan/photocopy
simulation, glyph-level DOM splitting (§3.3), and Arabic in the §7.2 draw-your-own flow.

---

## 15. Suggested order

**Release 1 — "Handwriting"**
1. §2 data model + prove `hand: 'none'` is a no-op
2. §6 font registry + on-demand loading (nothing works without it)
3. §5.2 sketchy Mermaid — ten lines, biggest demo payoff, do it early
4. §3 variation engine + determinism tests
5. §4 stationery, then **§4.2 rule-pitch locking — budget real time for this**
6. §5 hand-drawn elements via `roughjs`
7. §8 the 29-skin affinity + yield audit, §8.4 smooth application
8. §10 skins/stages/templates, §11 UI

**Release 2 — "Your own hand"**
9. §7.1 font import
10. §7.2 draw-your-alphabet (`perfect-freehand` + `opentype.js`)
11. §9 viral mechanics + content

Ship the two releases separately. Do not batch.

---

## 16. Final report

What shipped; screenshots of the 6 new skins, the stationery grid, and the §8.3 hand matrix; the
`hand: 'none'` PDF diff result; the §3.5 wrap-time measurement; PDF size delta with a hand active;
bundle delta with `drawnElements` off vs on; and anything deferred, with the reason.
