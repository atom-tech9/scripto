# Prompt — Flag known-dead / unreachable image hosts in the editor

Paste into a fresh Claude Code session. Small, self-contained.

---

In **Scripto**, documents can reference remote images. Some hosts are effectively dead (e.g.
`via.placeholder.com`) — the image silently fails and, in the PDF, shows as a broken/empty box. Give
users a gentle heads-up in the editor so they aren't surprised.

## Scope (keep it lean)
- Maintain a small list of known-unreachable/placeholder hosts (start with `via.placeholder.com`;
  make it easy to extend, e.g. `placeholder.com`, `placehold.it`).
- Detect image URLs in the document (Markdown `![](url)` and raw `<img src>`) whose host is on that
  list, and surface a **non-blocking warning** — e.g. a subtle inline notice/toast ("Some image links
  use a host that may not load: via.placeholder.com") or a small status-bar hint. Do **not** block
  editing or export.
- Prefer suggesting a working alternative in the message (e.g. `https://placehold.co`).

## Constraints
- Non-intrusive: no modal, no auto-editing the user's content.
- i18n: add any strings to `src/lib/i18n.ts` (`EN_STRINGS` + `STRINGS.ar`) and use `useLanguage().t`;
  RTL-correct placement (logical CSS).
- No `any`, no `console.log` (use `@/lib/logger`). Keep `npx tsc -b --force && npm run build` green.

## Acceptance
- A doc containing a `via.placeholder.com` image shows a quiet, dismissible warning; everything else
  (editing, preview, export) works unchanged. Docs with only reachable images show nothing.

> Note: the PDF export already has an image-load timeout + render watchdog, so a dead host can't hang
> the export. This guard is purely a UX heads-up.
