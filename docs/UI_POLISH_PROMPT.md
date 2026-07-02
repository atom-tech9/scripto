# Prompt — Premium UI polish pass (visual only, zero functionality change)

Paste into a fresh Claude Code session.

---

You are doing a **visual polish pass** on **Scripto** (client-side Markdown→PDF studio: React 18 +
TypeScript strict + Vite + Tailwind 3 + Motion + lucide-react). Goal: make the whole UI feel
**premium, modern, cohesive, and uniquely branded** — the quality bar of Linear / Vercel / Raycast.

## Hard rules
- **Do NOT change any functionality, behavior, props, state, routing, or logic.** Only touch
  `className`s, design tokens, CSS, motion, spacing, typography, icons, and purely-visual markup.
- Preserve **i18n + RTL**: use logical utilities only (`ms/me`, `ps/pe`, `start/end`, `text-start`,
  `rtl:`), never physical `ml/mr/left/right`.
- Preserve **light + dark** themes and accessibility (focus-visible rings, contrast ≥ WCAG AA, hit
  areas ≥ 32px).
- Keep `npx tsc -b --force && npm run build` green. No `any`, no `console.log`.
- Respect `prefers-reduced-motion` (gate non-essential animation).

## Establish one design language (do this first)
Refine the **design tokens** so everything derives from them (single source of truth):
- Colors: tune the HSL CSS variables in `src/index.css` (`--background/foreground/surface/muted/
  border/primary/accent/...`) for a distinctive, calm, high-contrast identity (indigo→violet brand).
  Ensure dark mode is rich (not pure black) and light mode is soft (not pure white).
- Elevation: define a **layered soft shadow** scale (e.g. `--shadow-sm/md/lg` as multi-stop shadows)
  and use consistently on cards, menus, dialogs, header.
- Radius & spacing: consistent radius rhythm (`--radius`), consistent gaps/padding scale.
- Typography: confirm Inter (UI) + Source Serif/Lora (doc) pairing; set tasteful tracking on headings,
  tabular-nums where numeric, balanced line-heights. Add `text-wrap: balance` to headings/titles.

## Component-by-component polish (visual only)
- **Header** (`components/layout/Header.tsx`): refined glassy bar (subtle backdrop-blur + translucent
  surface + hairline bottom border + faint shadow on scroll), crisp brand lockup, consistent icon
  button states (rest/hover/active/focus), a beautiful split Export control, cohesive segmented control.
- **Buttons/Field/Menu/Tooltip/Dialog/Confirm** (`components/ui/*`): unify hover/active/press
  (subtle scale/opacity), focus rings, disabled states, border+shadow consistency; nicer Select chevron,
  Switch, Slider (accent fill, thumb shadow); dialogs with refined header/footer + backdrop blur.
- **Command palette**: premium spotlight feel — grouped sections, subtle item hover, keycap `kbd`
  styling, smooth open/close (Motion), active-row accent.
- **Editor toolbar + status bar**: tighten spacing, dividers, icon stroke consistency; status bar as a
  quiet, refined footer.
- **Config panel / Theme gallery / Templates / Documents dialogs**: elegant cards, hover lift, clear
  section headers, consistent empty states.
- **Preview**: make the "paper" sheet feel tactile — refined shadow, rounded corners, comfortable
  gutter; polish the reading-progress bar.
- **Print preview / Lock screen / Empty state**: cohesive spacing, iconography, and copy hierarchy.

## Motion system (Motion / framer-motion)
- Centralize easing + durations (e.g. a small `src/lib/motion.ts` of variants/transitions) and reuse:
  quick (120–180ms) for hovers, spring for dialogs/menus, gentle fade/slide for panels.
- Add tasteful micro-interactions: button press, menu/dialog enter/exit, toast, tab/segment switch,
  list item stagger where cheap. Never janky; all reduced-motion-aware.

## Details that signal quality
- Consistent icon sizing/stroke; optical alignment.
- Custom scrollbars already exist — refine to match tokens.
- Selection color, caret color, focus ring color tuned to brand.
- Loading/skeleton states for async (PDF render, AI) that feel intentional.
- Empty states with a friendly icon + one line + one CTA.

## Deliverable & acceptance
- A cohesive, distinctly-branded UI that looks premium in light + dark, LTR + RTL, desktop + mobile.
- Zero behavioral changes; `tsc` + build green; reduced-motion respected.
- Briefly summarize the token changes + per-area tweaks in the final message (before/after notes).
