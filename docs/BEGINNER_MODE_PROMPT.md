# Prompt — Beginner-friendly mode + paste-to-Markdown (lower the barrier, keep the moat)

Paste into a fresh Claude Code session.

---

Make **Scripto** approachable for people who don't know Markdown, **without hiding Markdown** (it's the
moat: portability, import/paste/export, git-friendly). Add a **"Simple mode"** the user can opt into,
and beginner unlocks that help everyone. Follow conventions: React 18 + TS strict, Tailwind, **i18n +
RTL** (keys in `src/lib/i18n.ts`, logical CSS), no `any`/`console.log`, keep
`npx tsc -b --force && npm run build` green.

## 1. Paste-to-Markdown (highest value, do first)
When a user pastes **rich content** (Word, Google Docs, web pages, Notion) into the editor, convert the
HTML clipboard to Markdown automatically so bold/lists/tables/links just appear — no syntax typed.
- The editor already handles **image paste** in `src/components/editor/MarkdownEditor.tsx`
  (`domEventHandlers.paste`). Extend it: if `clipboardData` has `text/html`, convert with **turndown**
  (already a dependency; use `turndown` + `turndown-plugin-gfm`, mirror `src/io/importers.ts`) and
  insert the Markdown at the cursor; otherwise fall back to default paste.
- Keep it robust: strip junk, keep code blocks, don't touch plain-text pastes. Show a subtle toast
  ("Pasted as Markdown") the first time. This should work in both modes.

## 2. "Simple mode" toggle (opt-in, persisted)
Add an app-level **editing mode**: `mode: 'standard' | 'simple'`, persisted (e.g. `scripto:mode`), with
a clean toggle in the header (near the language/theme controls) and a command-palette entry. Default
`standard`. Translate all new strings (en + ar).

In **Simple mode** (assistive, beginner-first — no functionality removed, just guided):
- Formatting **toolbar always visible** and slightly larger, with text labels on hover; the live
  preview stays prominent so users learn by clicking and watching.
- The **slash `/` menu** presents plain-English labels ("Big heading", "Bulleted list", "Quote",
  "Insert table"…), each with a one-line **"what is this?"** explainer, grouped into friendly sections,
  plus a **"Formatting help"** entry that opens a short guide (a dialog: common formatting with
  live examples). (Coordinate with the session that owns `slashCommands.ts`.)
- A first-run **hint bar / empty-state coach**: "Type normally, or press **/** for building blocks —
  or just paste from Word/Docs." Dismissible, remembered.
- Optionally de-emphasize advanced Settings sections (collapse Watermark/Custom CSS/Metadata by
  default) — collapse only, never remove.

In **Standard mode**: current behavior unchanged.

## 3. Formatting help guide (both modes)
A small `FormattingHelpDialog` (i18n) showing the essentials with side-by-side *type this → get this*:
headings, bold/italic, lists, checkboxes, links, images, quote, code, table, callout, math. Reachable
from the slash menu, the `?`/help, and command palette.

## 4. Keep the moat obvious
Don't dilute the export story. Surface the beginner win in the empty state/onboarding: "Paste anything →
export a beautiful PDF." Import (.md/.docx/.html) and export (.md/PDF/HTML/Word) stay first-class.

## Out of scope (document as future, do NOT build now)
- A full **WYSIWYG "Rich mode"** (a true rich-text surface that round-trips to Markdown). Big lift and
  risk to the core; only pursue if analytics later show beginners still bounce. Note it in the roadmap.

## Acceptance
- Pasting rich content inserts clean Markdown; plain/image paste unaffected.
- A persisted Simple/Standard toggle changes only the assistive layer (toolbar visibility, slash
  explainers, hints, help) — no feature is removed; Markdown remains the source of truth.
- Everything translated (en + ar), correct in LTR/RTL + light/dark; `tsc` + build green.
