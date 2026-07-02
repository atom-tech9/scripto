# Prompt — Add 10 more unique, design-forward document templates

Paste into the session that owns `templates.ts` / templates work.

---

Add **10 new, visually distinctive document templates** to Scripto. Each should look *great out of the
box* by setting a **skin + accent + structure** in its YAML front-matter (Scripto has 10 skins:
modern, classic, editorial, technical, compact, manuscript, blueprint, corporate, brutalist, notebook;
plus `cover`, `toc`, `numbered`, `paper`, `accent`, `direction`). Make them feel premium, not generic.

## Conventions (must follow — the app is i18n + RTL now)
- `DocumentTemplate` uses **`nameKey` / `descKey`** (typed `TranslationKey`), `emoji`, `content`,
  and `category` ('document' | 'diagram' — these are all `'document'`).
- For every template add the `nameKey`/`descKey` to **both** `EN_STRINGS` and `STRINGS.ar` in
  `src/lib/i18n.ts` (Arabic names + descriptions). A green `tsc` proves no key is missing.
- Don't duplicate existing templates (README, Report, Academic, Letter, Meeting, Résumé/ATS, Blog,
  Changelog, PRD, Invoice, Cover Letter, Proposal, SOP, Bug Report, API Docs, Status Update, OKRs,
  Retro, RFC, Press Release, Case Study, NDA, Onboarding, Recipe, Mermaid diagrams).
- Keep `npx tsc -b --force && npm run build` green. No `any`, no `console.log`.

## The 10 templates (id · emoji · front-matter look · what's inside)

1. **`pitch-one-pager` 🚀 Startup One-Pager** — `skin: modern, cover: true, accent: '#6366f1'`.
   Problem → Solution → Market → Traction (metrics table) → Team → Ask. Punchy, lots of bold.

2. **`portfolio` 🧑‍🎨 Personal Portfolio / Bio** — `skin: editorial, accent: '#db2777'` (drop cap).
   Headline intro, "Selected work" with links, skills, contact. Magazine feel.

3. **`datasheet` 📃 Product Datasheet** — `skin: technical, tableStyle boxed, accent: '#0f766e'`.
   Overview, key specs (boxed table), features bullet grid, dimensions, compliance.

4. **`syllabus` 🎓 Course Syllabus** — `skin: handout/editorial, toc: true, numbered: true`.
   Course info, learning outcomes, weekly schedule table, grading breakdown, policies.

5. **`pricing` 💲 Pricing / Quote Sheet** — `skin: corporate, accent: '#2563eb'` (filled headers).
   Plans comparison table, line-item quote with totals, terms. No page numbers.

6. **`cheatsheet` ⚡ Cheat Sheet / Quick Reference** — `skin: compact, fontSize ~9.5`.
   Dense two-section reference: commands/shortcuts tables + tips callouts. One page.

7. **`certificate` 🏅 Certificate of Achievement** — `skin: classic, cover: true, pageNumbers: false`,
   centered. "This certifies that {Name}…", date, signature lines (use `---` rules), ornament.

8. **`menu` 🍽️ Café / Restaurant Menu** — `skin: editorial, cover: true, accent: '#9333ea'`.
   Sections (Starters/Mains/Drinks) with dotted price leaders, elegant headings.

9. **`brand-guide` 🎨 Brand Guidelines (one-pager)** — `skin: modern, accent: '#ea580c'`.
   Logo usage do/don't, color palette table (hex swatches in a table), type scale, voice.

10. **`event-invite` 🎉 Event Invitation** — `skin: classic, cover: true`, centered, manuscript-ish.
    Title, "You're invited", date/time/venue block, RSVP, agenda. Formal + elegant.

For each `content`: a complete fill-in-the-blanks Markdown doc with the front-matter block above, a
clear H1, well-structured sections, at least one **table or callout** where it elevates the design,
and placeholders like `{Your Company}`, `{Name}`, `{Date}`.

## Acceptance (templates)
- 10 new templates appear in the Templates picker (Documents section), names + descriptions translated
  (en + ar), correct in LTR/RTL + light/dark.
- Each opens with its intended skin/accent and looks polished immediately; renders + exports to PDF.

---

# Part 2 — Add 10 new document SKINS

A "skin" restyles headings, tables, blockquotes, dividers, code blocks via a `data-skin` CSS block.

## Where things live
- `src/types/index.ts` — add each new value to the `DocumentSkin` union.
- `src/data/skins.ts` — add to `SKIN_OPTIONS` (each has `value` + a `labelKey: TranslationKey`) and
  the `SKIN_VALUES` array; add the `labelKey` strings to `EN_STRINGS` + `STRINGS.ar` in `src/lib/i18n.ts`.
- `src/styles/document.css` — add a `.scripto-doc[data-skin='x'] { … }` block (override headings,
  `table`/`th`/`td`, `blockquote`, `hr`, `.code-block`). **Use logical props** (`border-inline-start`,
  `text-align: start`) so RTL keeps working; add a `[dir='rtl']` tweak if a skin uses a side accent.
  Keep code blocks/math LTR (already handled globally).

## The 10 skins (id · vibe · key CSS moves)
1. **`swiss`** — International Typographic: bold left H1/H2, thick accent rule under H2, tight tracking,
   sans; tables with strong top/bottom rules only.
2. **`terminal`** — Mono everything, dark `--doc-surface`, green accent, H2 prefixed `> `, square corners.
3. **`newsprint`** — Newspaper: serif, condensed bold heads, an all-caps muted "kicker" before H1
   (`h1::before`), thin column-rule blockquotes.
4. **`elegant`** — High-contrast serif, letter-spaced uppercase H1, hairline rules, generous leading.
5. **`playful`** — Rounded; H2 in an accent **pill** (inline-block bg, rounded, padding), friendly.
6. **`dark`** — Dark document surface (force `--doc-fg`/`--doc-surface` dark even in light UI), great
   for on-screen/dark PDFs; ensure print still legible.
7. **`ledger`** — Financial: `font-variant-numeric: tabular-nums`, fully ruled tables, mono numerals,
   right-aligned numeric cells.
8. **`zen`** — Ultra-minimal: no heading rules, centered H1, lots of whitespace, no table borders.
9. **`memo`** — Corporate memo: ruled header band under H1, Helvetica/sans, compact, uppercase H3.
10. **`poster`** — Oversized display H1 (≈3em), bold H2, big accent rule — for one-page hero docs.

## Acceptance (skins)
- All 10 selectable in Settings → Style → Document skin (translated labels), visibly distinct in
  preview + PDF, working in LTR/RTL + light/dark.

---

# Part 3 — Add 10 new document THEMES (presets)

A preset is a `Partial<PdfConfig>` bundle in `src/data/presets.ts` with an i18n `nameKey`/`descKey`.

## Where things live
- `src/data/presets.ts` — add 10 `DocumentPreset` entries (id, nameKey, descKey, config). Apply via
  the existing `onApplyPreset` flow (it already maps `marginPreset` → `margins`).
- Add `nameKey`/`descKey` to `EN_STRINGS` + `STRINGS.ar`.
- Don't duplicate existing presets (Technical, Academic, Book, Résumé, Report, Minimal, Whitepaper,
  Newsletter, Invoice, Legal, Handout). Pair them with skins (new or existing).

## The 10 presets (name · config intent)
1. **Thesis** — serif, 11pt, leading 1.8, `skin: classic`, wide margins, `cover + toc + numbered`.
2. **Startup Deck** — sans, 12pt, `skin: modern`, indigo accent, `cover`, no page numbers.
3. **Magazine** — lora, 11.5pt, `skin: editorial`, bold accent, drop-cap feel.
4. **Engineering RFC** — sans, 10.5pt, `skin: technical`, `github-dark` code, `toc + numbered`.
5. **Cookbook** — lora, 12pt, `skin: classic`, warm accent (#ea580c), `cover`.
6. **Legal Brief** — serif, 11pt, leading 1.9, `skin: classic`, wide margins, `numbered + page numbers`.
7. **Executive Memo** — sans, 10.5pt, `skin: memo` (new), narrow margins, no cover.
8. **Portfolio** — sans/lora, `skin: editorial`, pink accent (#db2777).
9. **Dark Document** — `skin: dark`, `github-dark` code, sans.
10. **Swiss Grid** — sans, `skin: swiss` (new), red accent (#dc2626), striped tables.

## Acceptance (themes)
- 10 new presets show in Settings → Document Theme + the Theme Gallery, translated (en + ar);
  clicking one applies its skin/typography/structure and looks polished.
- `npx tsc -b --force && npm run build` pass for all of Parts 1–3.
