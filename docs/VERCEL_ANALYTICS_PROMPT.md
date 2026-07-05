# Prompt — Add Vercel Web Analytics (privacy-friendly, no cookie banner)

Paste into the session that knows this codebase. Small task. Keep the build green
(`npx tsc -b --force && npm run build && npm run lint`). No `any`, no `console.log`.

---

Add **Vercel Web Analytics** to Scripto so it tracks pageviews across **both** surfaces:
the interactive SPA at `/app` **and** the prerendered marketing pages at `/`, `/ar`,
`/templates/*`, `/skins/*`, `/blog/*`.

## Critical architecture constraint (don't miss this)
This app is **vite-react-ssg** with a custom postbuild step in `vite.config.ts`
(`onPageRendered` → `stripHydrationArtifacts`) that **removes all hydration JS from
marketing pages**. Therefore:
- A React `<Analytics />` component **only runs on `/app`** (the one page that keeps its
  scripts). It will silently NOT track any marketing page.
- The existing **`PLAUSIBLE_SNIPPET`** is injected as a raw `<script>` via
  `injectBeforeHeadEnd(...)` precisely because of this. **Follow the same pattern** for
  Vercel Analytics so marketing pages are covered.

## Preferred approach — one first-party script tag on every page
Vercel Web Analytics serves its script first-party from `/_vercel/insights/script.js`
and beacons to `/_vercel/insights/*`, so it needs **no CSP change** (`script-src 'self'`
and `connect-src *` in `vercel.json` already allow it) and no external domain.

1. Install: `npm i @vercel/analytics` (enables the Vercel project's analytics + gives the
   canonical script URL; even though we inject the tag manually, keep the dep for the
   version-pinned script path and for `track()` custom events later).
2. In `src/seo/postbuild.ts`, add and export a constant next to `PLAUSIBLE_SNIPPET`:
   ```ts
   export const VERCEL_ANALYTICS_SNIPPET =
     '<script defer src="/_vercel/insights/script.js"></script>'
   ```
3. In `vite.config.ts`, inject it into **every** prerendered page via the same
   `injectBeforeHeadEnd(...)` calls that already handle Plausible — i.e. marketing pages
   in `onPageRendered`, and make sure the **`/app` shell also gets it** (the app currently
   returns `renderedHTML` unchanged for `/app` — inject the analytics tag there too so the
   SPA is tracked). Keep it to a single tag per page (no duplicates).
4. **Do not remove Plausible yet** — the user wants both for now. Just ensure both snippets
   are present and neither is double-injected.

## Alternative (if you prefer the official component for /app only)
Only if step 3's app-shell injection is awkward: mount `<Analytics />` from
`@vercel/analytics/react` once at the SPA root (e.g. in `AppRoot`/`main.tsx`), AND still
inject the raw script tag on marketing pages. But the single-snippet-everywhere approach
above is simpler and consistent with Plausible — prefer it.

## Verify
- `npx tsc -b --force && npm run build && npm run lint` green.
- In `dist`, confirm `/_vercel/insights/script.js` tag appears in `index.html`,
  `ar/index.html`, `app/index.html`, and a sample `templates/*` + `blog/*` page — exactly once each.
- Note in the report that Vercel Analytics must also be **enabled in the Vercel project
  dashboard** (Analytics tab) after deploy — the script no-ops until then.
- Confirm no CSP violation in the browser console on the deployed preview.

## Constraints
- Don't regress SSG output, PWA/offline, i18n/RTL, or bundle size for the app.
- Privacy-friendly: no cookies, no PII, no consent banner needed. Keep it that way.
