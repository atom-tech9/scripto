# Scripto SEO Playbook

How the marketing/SEO layer works, what to do at launch, and how to track rankings.
The architecture ships **static HTML for every marketing route** (view-source shows full content)
with **zero framework JavaScript** — only a ~1 KB inline enhancement script per page.

## Architecture recap

- `vite-react-ssg` prerenders every route in [src/routes.tsx](../src/routes.tsx) at build time
  (`npm run build`). The editor lives at **/app** (client-only chunk, `noindex`).
- `onPageRendered` (see [vite.config.ts](../vite.config.ts)) strips hydration scripts from
  marketing pages and injects Plausible; `onFinished` writes `sitemap.xml`, `robots.txt`,
  `404.html`, injects `/app` asset prefetch hints into the landing pages, and regenerates the
  service worker. Build logs report exact page counts — nothing is silently capped.
- Per-page meta lives beside the content in `src/marketing/content/*`; the shared head manager is
  [Seo.tsx](../src/marketing/components/Seo.tsx) (title, description, canonical, OG/Twitter,
  hreflang, JSON-LD `@graph`).
- OG images are generated on demand by the Vercel Edge function [api/og.tsx](../api/og.tsx)
  (`/api/og?title=…&tag=…&lang=ar`).

## Launch checklist (one-time)

1. **Deploy to Vercel** — project root, build command `npm run build`, output `dist`.
   `vercel.json` already sets cache + security headers and the `/app/*` rewrite.
2. **Set the real GitHub URL** — update `GITHUB_URL` in
   [src/marketing/content/site.ts](../src/marketing/content/site.ts) (currently a placeholder).
3. **Analytics** — Vercel Web Analytics, integrated per Vercel's docs for each surface: the raw
   first-party tag (`/_vercel/insights/script.js`) on the static marketing pages, and the official
   `<Analytics/>` component (`@vercel/analytics/react`) inside the `/app` SPA (AppShell). Enable it
   in the Vercel project's **Analytics tab** after deploy — it no-ops until then; verify via a
   `/_vercel/insights/view` request in the Network tab. Custom events later: `track()` from
   `@vercel/analytics`. Plausible is architected but dormant — to activate, inject
   `PLAUSIBLE_SNIPPET` ([src/seo/postbuild.ts](../src/seo/postbuild.ts)) in `vite.config.ts` and
   create the site at plausible.io.
4. **Google Search Console** — add property `md.atom.sa` (Domain property via DNS TXT record on
   `atom.sa`, or URL-prefix via HTML meta). For the meta route: add the verification tag to
   `index.html` `<head>`, rebuild, deploy. Then **submit `https://md.atom.sa/sitemap.xml`**.
5. **Bing Webmaster Tools** — import the verified GSC property (one click), or verify by meta tag.
   Submit the sitemap there too.
6. **Rich results** — test `https://md.atom.sa/` and one use-case page in the
   [Rich Results Test](https://search.google.com/test/rich-results): expect SoftwareApplication,
   FAQPage, HowTo, BreadcrumbList.
7. **Lighthouse** — run against the deployed landing + `/markdown-to-pdf`; both should be ≥95
   SEO/Perf (marketing pages ship no framework JS).

## Keyword map (page → target queries)

| Page | Primary keyword | Secondary |
| --- | --- | --- |
| `/` | markdown to pdf | markdown to pdf converter, free |
| `/markdown-to-pdf` | convert markdown to pdf | markdown pdf page numbers/headers |
| `/readme-to-pdf` | readme to pdf | github readme to pdf, export readme |
| `/resume-to-pdf` | markdown resume to pdf | ats resume markdown, resume builder free |
| `/markdown-to-pdf-arabic` (+`/ar/…`) | arabic markdown to pdf | rtl markdown pdf, تحويل ماركداون إلى PDF |
| `/markdown-to-pdf-with-mermaid` | mermaid to pdf | export mermaid diagram pdf |
| `/markdown-to-pdf-with-math` | markdown math to pdf | katex pdf, latex markdown pdf |
| `/html-to-markdown` | html to markdown | convert html to md online |
| `/word-to-markdown` | word to markdown | docx to markdown converter |
| `/markdown-cheat-sheet` | markdown cheat sheet | markdown syntax pdf |
| `/vs/notion-pdf-export` | notion pdf export | notion export alternative |
| `/vs/pandoc` | pandoc alternative | pandoc gui, pandoc vs |
| `/vs/typora` | typora alternative | typora free alternative |
| `/templates/*` (53) | \<template name\> markdown template | e.g. "invoice markdown template" |
| `/skins/*` (21) | \<skin\> pdf style/theme | markdown pdf themes |
| `/blog/*` | long-tail how-to queries | see frontmatter `keyword` |

## Content operations

- **New blog post**: drop `src/marketing/content/blog/<slug>.md` with
  `title/description/date/keyword` frontmatter → route, sitemap entry, JSON-LD and OG image are
  automatic on the next build.
- **New use-case page**: add a file under `src/marketing/content/use-cases/` and register it in
  `index.ts` — everything else (route, sitemap, hreflang when an `ar` variant exists) follows.
- **New template/skin in the product** → its marketing page appears automatically (pages are
  generated from `src/data/templates.ts` / `src/data/skins.ts`).
- Arabic variants: add the content object to `USE_CASES_AR` — hreflang clusters and the `/ar/…`
  route are emitted automatically.

## Ranking tracking (weekly, 10 minutes)

1. GSC → Performance → filter query contains "markdown" — watch impressions/position for the
   keyword map above; expect movement in weeks 2–8 after indexing.
2. GSC → Indexing → Pages — all ~100 URLs should be "Indexed"; investigate any "Crawled — not
   indexed" beyond `/app` (which is intentionally noindexed).
3. Spot-check `site:md.atom.sa` result count and the landing snippet.
4. Track 5 head terms manually or in your rank tracker: *markdown to pdf, readme to pdf, markdown
   resume pdf, arabic markdown pdf, mermaid to pdf*.

## What moves the needle next

- Real screenshots/recordings on landing + use-case pages (assets pending).
- Backlinks: launch posts (HN/Reddit r/webdev/r/markdown), the GitHub repo README link, and the
  "Made with Scripto" PDF footer (on by default, opt-out in settings) as an organic loop.
- More Arabic content: the `/ar/` cluster is wired for expansion — each translated use-case is one
  content object away.
