# Prompt — Preview control to show/hide the cover + Contents pages (default off, RTL-aware)

Paste into a fresh Claude Code session.

---

In **Scripto**, the live preview (`src/components/preview/Preview.tsx`) now renders the **cover page**
and **Table of Contents** as page-cards whenever `config.coverPage` / `config.tableOfContents` are on
(the TOC is auto-hidden when there are fewer than `MIN_TOC_HEADINGS` headings — imported from
`@/pdf/buildExportContent`). Some users find these preview pages distracting.

**Add a small control at the top of the preview pane** to show/hide those cover/Contents **preview
cards**, **defaulting to OFF**. This only affects the on-screen preview — **export/PDF still always
follows the document config** (don't change export behavior).

## Requirements
- A compact, unobtrusive toggle pinned at the top of the preview pane (e.g., a segmented/switch or a
  small "Show cover & contents" chip), only shown when `config.coverPage || (config.tableOfContents
  && toc.length >= MIN_TOC_HEADINGS)` — i.e., don't show the control if there's nothing to toggle.
- **Persist** the choice (e.g., `useLocalStorage('scripto:preview-front-matter', false)`), default
  `false` (cover/Contents hidden in preview by default).
- Follow **i18n**: add keys to `src/lib/i18n.ts` (`EN_STRINGS` + `STRINGS.ar`), use `useLanguage().t`.
- **RTL**: use logical utilities only (`ms/me`, `ps/pe`, `start/end`, `text-start`); the control must
  sit correctly in Arabic (RTL) view. Respect the existing reading-progress bar at the top (don't
  overlap it — place the control below it or align cleanly).
- Keep it visually consistent with the app (reuse `components/ui` primitives + tokens).
- Don't regress the existing behavior: when enabled, the cover/Contents cards render exactly as they do
  now.

## Acceptance
- By default the preview shows only the document (no cover/Contents cards); a top control lets the user
  reveal them; the choice persists; export is unchanged.
- Correct in LTR + RTL, light + dark. `npx tsc -b --force && npm run build` pass. No `any`/`console.log`.
