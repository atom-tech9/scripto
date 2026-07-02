# Prompt — Best-in-class SEO: marketing pages, onboarding, structured data (rank #1 for "markdown to pdf")

Paste into a fresh Claude Code session. Big task — split into phases; keep the app working and the
build green throughout (`npx tsc -b --force && npm run build`). No `any`, no `console.log`.

---

## Context & the core problem
**Scripto** is a **client-rendered Vite + React SPA** (deployed to Vercel at **md.atom.sa**). Search
engines currently get an almost-empty HTML shell — there is nothing substantial to index or rank.
It's a free, open-source, 100% client-side **Markdown → pixel-perfect PDF** studio (paginated PDF with
running headers/footers, page numbers, cover, TOC; 20+ skins/themes; KaTeX + Mermaid; offline PWA;
zero-knowledge privacy; full Arabic/RTL + i18n; optional BYO-key AI).

**Goal:** rank at the top for "markdown to pdf" and dozens of long-tail queries by adding a **fast,
prerendered (static HTML) marketing + content layer** in front of the app, with complete on-page,
technical, and structured-data SEO — without breaking the editor.

## Architecture decision (pick one; recommendation given)
The editor must stay a SPA, but landing/marketing/blog pages must be **static HTML** (real content in
the initial response). Two viable single-repo, single-Vercel-deploy paths:

- **A (recommended): `vite-react-ssg`** — prerender chosen routes to static HTML at build time while
  keeping the SPA for the app. One Vite build, one deploy, reuse existing React components + i18n +
  Tailwind + tokens. Routes: `/` and content pages are prerendered; `/app` stays the interactive SPA.
- **B: A dedicated Astro content site** at `/` + the existing Vite SPA mounted at `/app` (copy the SPA
  build into Astro, or Vercel rewrites). Best pure-SEO ergonomics, but two build systems.

Go with **A** unless there's a strong reason for Astro. Either way: **root `/` = indexable landing
page; the editor moves to `/app`** (add a client route; keep deep-links/hash working; add a redirect
so existing `/` app users land on `/app`). Marketing pages ship **zero/minimal JS**.

## Phase 1 — Static marketing + content pages
Create prerendered pages, each with a unique H1, semantic sections, internal links, and a clear CTA to
`/app`. Reuse the design system (tokens, Button, etc.) so they look on-brand.
- `/` **Landing**: hero (headline + subhead + "Open Scripto" CTA + hero screenshot/GIF), the moat
  ("preview === PDF"), feature grid, skins showcase, use-cases, social proof/stars, FAQ, footer.
- **Use-case / keyword pages** (one H1 each, ~600–1000 words, screenshots, FAQ, CTA):
  `/markdown-to-pdf`, `/readme-to-pdf`, `/resume-to-pdf` (huge intent), `/markdown-to-pdf-arabic`,
  `/markdown-to-pdf-with-mermaid`, `/markdown-to-pdf-with-math`, `/html-to-markdown`,
  `/word-to-markdown`, `/markdown-cheat-sheet`.
- **Comparison pages**: `/vs/notion-pdf-export`, `/vs/pandoc`, `/vs/typora` (honest, factual).
- `/features`, `/getting-started`, `/privacy`, `/about`.
- **/blog** + an MDX/Markdown-driven post system (dogfood!): seed 3–5 tutorials targeting long-tail
  ("How to convert a Markdown README to PDF", "Best way to make an Arabic PDF from Markdown",
  "Markdown resume to PDF in 2 minutes").
- **Programmatic SEO**: generate a page per template and per skin from `src/data/templates.ts` /
  `src/data/skins.ts` (e.g. `/templates/ats-resume`, `/skins/editorial`) — dozens of long-tail pages.
  Log (don't silently cap) how many were generated.

## Phase 2 — On-page SEO (every page)
- Unique `<title>` (~55–60 chars) + meta description (~150 chars); one `<h1>`; logical h2/h3.
- **Canonical** URL; clean lowercase URLs; descriptive internal links + breadcrumbs.
- **Open Graph + Twitter cards** with a per-page **OG image** (static, or dynamic via `@vercel/og`).
- Descriptive `alt` on all images; `width/height` to protect CLS; lazy-load below the fold.
- A shared `<Seo>` component / head manager (e.g. a small helper or `react-helmet-async` for SSG) so
  every route sets its own meta.

## Phase 3 — Technical SEO
- **`sitemap.xml`** generated at build from the route list (incl. programmatic pages) + **`robots.txt`**
  (allow all, point to sitemap; `noindex` the raw `/app` shell if it adds no unique content, but keep
  the landing indexable).
- **hreflang**: emit `en`, `ar`, and `x-default` alternates for pages that have both languages (ties
  into the existing i18n); Arabic pages render RTL with translated meta.
- **Core Web Vitals**: preconnect/preload fonts, keep marketing JS ~zero, ensure LCP image is eager +
  sized, no layout shift; the app's heavy chunks stay lazy. Target 95+ Lighthouse SEO/Perf.
- Ensure HTTPS + non-www canonical (Vercel handles TLS via md.atom.sa).
- `vercel.json`: serve static pages directly; rewrite `/app/*` → the SPA `index.html`; cache headers
  for hashed assets; `sw.js` no-cache.

## Phase 4 — Structured data (JSON-LD)
- Global: `WebSite` (+ `SearchAction` sitelinks searchbox) and `Organization` (Atom, logo).
- Landing/app: **`SoftwareApplication`** (name, description, `applicationCategory: "Productivity"`,
  `offers` free, screenshots; add `aggregateRating` once you have reviews).
- Use-case pages: **`HowTo`** ("How to convert Markdown to PDF") + **`FAQPage`** for the FAQ blocks.
- Blog posts: **`Article`** / `BlogPosting`. All pages: `BreadcrumbList`.

## Phase 5 — Onboarding (conversion, not just SEO)
- A first-run **in-app onboarding**: a short, dismissible product tour / 3-step checklist ("try a
  template → edit → export PDF"), persisted so it shows once. Reuse existing UI primitives; i18n + RTL.
- A `/getting-started` static page (indexable) that mirrors it for search traffic.
- Make the landing → `/app` CTA instant (no signup) — the demo *is* the onboarding.

## Phase 6 — Measurement & submission
- Add **privacy-friendly analytics** (Plausible or PostHog EU) — respects the no-server ethos; keep the
  editor itself telemetry-light.
- Wire **Google Search Console** + **Bing Webmaster**; submit `sitemap.xml`. Add a `<meta>` or DNS
  verification step (documented).
- Document a keyword map (page → primary/secondary keywords) and a simple ranking-tracking checklist.

## Constraints & acceptance
- The editor keeps working (deep links, PWA, offline, i18n/RTL, export). Don't regress bundle size for
  the app; marketing pages must be static HTML with content visible in "View Source".
- `npx tsc -b --force && npm run build` green; Lighthouse SEO ≥ 95 on the landing + a use-case page;
  `sitemap.xml`/`robots.txt` valid; OG images render; JSON-LD passes Google Rich Results Test.
- Deliver a short report: routes added, keywords targeted, and the Lighthouse/Rich-Results results.

## Phase 7 — "Built by Atom" branding (tasteful, everywhere it belongs)
Add subtle, consistent **"Built by Atom"** attribution that builds trust without cluttering the editor.
Use the Atom logo/wordmark, link to **https://atom.sa** (`target="_blank" rel="noopener"`), i18n +
RTL-aware, and keep it out of the editing surface.
- **App**: a quiet "Built by Atom" in the **status-bar footer** (or the settings/about area) — small,
  muted, never overlapping the editor/preview. Not a floating badge over content.
- **Marketing landing + all content pages**: a "Built by Atom" line with logo in the **site footer**,
  linking to atom.sa (alongside the GitHub/star links).
- **README**: a one-line "Built by [Atom](https://atom.sa)" near the top badges or in the footer.
- **Metadata**: set `author`/`publisher` to Atom in the `Organization` JSON-LD and `<meta name="author">`.
- Optional (default on, removable in settings): a small "Made with Scripto · by Atom" line in the
  **exported PDF footer** — this doubles as the viral attribution loop. Keep it toggleable.

## Suggested order
Phase 1 (architecture + landing + 3 key use-case pages) → Phase 2/3/4 on those → then expand content
(blog + programmatic) → Phase 5 onboarding → Phase 6 analytics/submission → Phase 7 Atom branding.
