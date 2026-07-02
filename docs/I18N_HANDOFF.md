# Prompt — Finish full UI translation (English ↔ Arabic) & RTL polish

Paste everything below into a fresh Claude Code session.

---

You are continuing the Arabic / RTL work on **Scripto** (a client-side Markdown→PDF studio: React 18 +
TypeScript strict + Vite + Tailwind). The **layout RTL** and a **centralized i18n system** are already
in place. Your job: **migrate every remaining hardcoded UI string into the i18n dictionary and add the
Arabic translations**, and fix any per-component RTL gaps. Keep `npx tsc -b && npm run build` green.
Follow existing conventions: no `any`, no `console.log` (use `@/lib/logger`), immutable updates, reuse
the `components/ui/*` primitives, minimal comments.

## What already exists (don't rebuild)
- **Centralized dictionary:** `src/lib/i18n.ts` — `LANGUAGES` (en/ar with brand + tagline), `EN_STRINGS`
  (the key set), `STRINGS` (per-language maps), `translate(lang, key)`. Missing keys fall back to English.
- **Context + hook:** `src/i18n.tsx` — `<LanguageProvider>` (already wraps the app in `main.tsx`,
  owns the `scripto:ui-lang` state, sets `<html dir/lang>`), and `useLanguage()` → `{ lang, dir, setLang, toggle, t }`.
- **Already translated (use as the pattern):** `Header`, `StatusBar`, `EmptyState`. Document direction
  (`config.direction`), Arabic fonts (Cairo default), and editor RTL are done.

## How to translate a component
1. `import { useLanguage } from '@/i18n'` and `const { t } = useLanguage()`.
2. Replace each hardcoded English string with `t('some.key')`.
3. Add the key to `EN_STRINGS` in `src/lib/i18n.ts` (English value) **and** the Arabic value to
   `STRINGS.ar`. Use clear dot-namespaced keys (`dialog.documents.title`, `toast.exported`, …).
4. For interpolation, keep it simple: compose with template strings around `t()` results, or add a
   tiny `format(t('key'), {n})` helper if needed (prefer not to over-engineer).

## Files still containing hardcoded English (migrate all)
- **Dialogs:** `components/layout/TemplatesDialog.tsx`, `DocumentsDialog.tsx`, `StatsDialog.tsx`,
  `ThemeGalleryDialog.tsx`, `ShortcutsDialog.tsx`, `GithubDialog.tsx`, `ResumeDetailsDialog.tsx`,
  `AiSettingsDialog.tsx`, `AiDashboardDialog.tsx`, `AiInputDialog.tsx`,
  `components/security/SecurityDialog.tsx`, `components/security/LockScreen.tsx`,
  `components/ui/Confirm.tsx` (default Cancel/Confirm labels).
- **Config:** `components/config/ConfigPanel.tsx` — section titles + field labels + option labels
  (paper sizes, fonts, skins, table styles, directions, margins). Consider a `skin.*` / `preset.*`
  key namespace; presets/skin descriptions live in `data/presets.ts` and `data/skins.ts` (either move
  their display strings to i18n or add a parallel translated map).
- **Editor:** `components/editor/EditorToolbar.tsx` (button tooltips), `SelectionToolbar.tsx`,
  `AiSuggestionCard.tsx`, `slashCommands.ts` (menu labels).
- **App-level:** `src/App.tsx` — the **command palette** `commands` array `label`s + `group`s, and
  **every `toast.success/error(...)`** message; plus `CommandPalette.tsx` placeholder/empty text.
- **Templates/data:** `data/templates.ts` names/descriptions (consider Arabic template variants — optional).

## Per-component RTL gaps to verify/fix (logical utilities only)
Most layout already mirrors. Double-check and fix with logical classes (`ms-/me-`, `ps-/pe-`,
`start-/end-`, `text-start/end`, `rtl:` variants) — never physical `ml/mr/left/right` for new code:
- `components/ui/Tooltip.tsx` — `left`/`right` side variants should swap under RTL.
- **AI overlays:** `components/editor/SelectionToolbar.tsx`, `AiSuggestionCard.tsx`, and
  `components/editor/overlayGeometry.ts` — these position floating UI from caret/selection coords;
  verify they compute correctly under `dir=rtl` (mirror x-offsets).
- Any dialog/menu with absolute offsets; the `Menu` already uses `start-0/end-0`.

## Add a language picker beyond the toggle (optional, nice)
The header has an EN/ع toggle (`onToggleLang`). For 3+ languages later, a small dropdown built from
`LANGUAGES` is ideal — but the current two-language toggle is fine for now.

## Acceptance
- Switching to العربية translates **all** visible chrome (headers, dialogs, menus, tooltips, command
  palette, toasts, settings, AI panels, lock screen) with correct RTL layout.
- English is unchanged. Missing Arabic keys fall back to English (no crashes).
- Document direction/fonts and PDF export (already done) still work.
- `npx tsc -b && npm run build` pass. Test in light + dark, LTR + RTL.

## Stretch
- Arabic template variants in `data/templates.ts`.
- `LANGUAGES`-driven `<select>` language picker for future locales.
