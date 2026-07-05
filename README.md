<div align="center">

<img src="public/logo.webp" width="120" alt="Scripto logo" />

# Scripto

**Write Markdown, export pixel-perfect paginated PDFs — entirely in your browser.**

What you see in the live preview is exactly what lands in the PDF: same stylesheet, same rendered DOM. No backend, no uploads.

Built by [Atom](https://atom.sa) · Live at [md.atom.sa](https://md.atom.sa)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made with React + TypeScript](https://img.shields.io/badge/React%20%2B%20TypeScript-strict-3178C6.svg)](#-tech-stack)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](#-quick-start)

</div>

<div align="center">

<!-- TODO: add a screenshot at docs/assets/screenshot.png (referenced below). -->
<img src="docs/assets/screenshot.png" width="820" alt="Scripto editor with live paginated PDF preview" />

<em>Scripto's editor beside its live, paginated print preview — the preview <strong>is</strong> the PDF.</em>

<br />

**[Live demo →](https://md.atom.sa)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/atom-tech9/scripto)

</div>

---

## Why Scripto

Most "Markdown to PDF" tools render your document twice — once for the screen, once for print — and the two drift apart. Scripto uses **one stylesheet and one rendered DOM** for both, then paginates with real [CSS Paged Media](https://www.w3.org/TR/css-page-3/) via [Paged.js](https://pagedjs.org/). The result is a PDF that matches the preview by construction, with selectable text, embedded fonts, and live links.

- **Markdown → pixel-perfect paginated PDF** — real page boxes, running headers/footers, page numbers, and a table of contents with true page numbers.
- **21 document skins** plus one-click presets and a visual theme gallery.
- **Fully offline** — installable PWA; works with no network after first load.
- **Zero-knowledge privacy** — optional passphrase lock encrypts documents at rest with AES-256 (Web Crypto). The passphrase is never stored or sent.
- **Arabic & RTL** — complete English + Arabic UI with correct right-to-left layout and Arabic fonts (Cairo).
- **AI-optional** — bring your own key; requests go straight from the browser to your provider. Never required.

### Features

#### ✍️ Editor
- CodeMirror 6: Markdown highlighting, line numbers, word-wrap, undo/redo
- Formatting toolbar + shortcuts (`⌘B` / `⌘I` / `⌘E` / `⌘K`, lists, quotes)
- Find & replace (`⌘F`), autosave to `localStorage`, cross-tab sync
- Command palette (`⌘K`), live outline navigator, slash commands
- Optional AI assist — bring-your-own-key, direct browser → provider

#### 📝 Rich Markdown
- GitHub-Flavored Markdown, tables, task lists, footnotes, definition lists
- Emoji (`:rocket:`), `==highlight==`, `~sub~`, `^super^`
- Callouts / admonitions (`:::tip … :::`)
- Syntax-highlighted code (Prism, 4 themes, copy button)
- Math (KaTeX), Mermaid diagrams, HTML passthrough

#### 📄 PDF export (Paged.js)
- A4 / Letter / Legal / A3 / A5 / custom sizes; portrait & landscape
- Margin presets + custom margins
- Running headers (from the H1) & footers, page numbers (`x / y`)
- Table of contents with real page numbers, cover page, watermark
- Repeating table headers; rows never split across pages

#### 🎨 Design
- 21 document skins, one-click theme presets, visual theme gallery
- Custom accent color + custom CSS injected into preview *and* output

#### 🔒 Privacy
- No server; everything stays in the browser (`localStorage`)
- Optional passphrase lock: AES-256 (Web Crypto) encryption at rest
- Zero-knowledge — passphrase never stored or sent; auto-lock on inactivity

#### 🌍 Internationalization
- Full English + Arabic UI with correct RTL layout and Arabic fonts (Cairo)
- Configurable document direction

#### 🔁 Import / export
- **Import:** Markdown, Word (`.docx`), HTML, and GitHub README (paste a repo URL)
- **Export:** PDF, Word (`.doc`), self-contained HTML, Markdown

---

## 🚀 Quick start

**Requirements:** Node 20+.

```bash
# install dependencies
npm install

# start the dev server (editor at /app, marketing site at /)
npm run dev

# type-check + prerender the full site → dist/ (~102 static pages + the app)
npm run build

# unit tests (SEO build transforms, blog loader)
npm run test
```

Other scripts: `npm run preview`, `npm run typecheck`, `npm run lint`, `npm run format`.

The `dist/` output is fully static — deploy it to any static host (Vercel, Netlify, GitHub Pages, S3). No environment variables or server required. `vercel.json` ships cache + security headers, and `api/og.tsx` (optional) generates social-card images on Vercel's edge.

**Deep links:** `/app?template=<id>` opens any of the 50+ templates as a new document; `/app?skin=<id>` applies a skin — handy for docs and integrations.

---

## 🧱 Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build / dev | **Vite 5** | Fast HMR, ESM, simple config; pinned to 5.x for Node 20 compat. |
| UI | **React 18 + TypeScript (strict)** | Mature ecosystem; strict typing for safety. |
| Styling | **Tailwind CSS 3** + CSS variables | Utility speed for app chrome; CSS vars for theming and the document stylesheet. |
| Editor | **CodeMirror 6** (`@uiw/react-codemirror`) | Best-in-class code editor: extensions, decorations, search. |
| Markdown | **react-markdown** + remark/rehype | Plugin-based AST pipeline; full control over rendering. |
| Math | **KaTeX** | Fast, print-friendly math. |
| Code highlight | **Prism** (`rehype-prism-plus`) | AST-level highlighting + line numbers. |
| Diagrams | **Mermaid** (lazy) | Text-to-diagram, renders to inline SVG. |
| Pagination | **Paged.js** | Real CSS Paged Media: page boxes, running headers/footers, page numbers, repeating table headers. |
| Import | **mammoth** (DOCX→HTML) + **turndown** (HTML→MD) | Reliable Word and HTML import. |
| Offline | **vite-plugin-pwa** (Workbox) | Service worker + precache + runtime caching. |
| Crypto | **Web Crypto API** | Native AES-GCM / PBKDF2 — no crypto dependency. |
| Marketing/SEO | **vite-react-ssg** + react-router | Prerenders ~100 content pages to static, zero-JS HTML (landing, guides, per-template/skin pages, blog) with sitemap, hreflang and JSON-LD. |
| Tests | **Vitest** | Unit coverage for the SEO build transforms and blog loader. |

For the full design rationale, the rendering pipeline, and the "preview === PDF" mechanism, see **[ARCHITECTURE.md](ARCHITECTURE.md)** — the static marketing/SEO layer is documented there (§19) and operationally in **[docs/SEO_PLAYBOOK.md](docs/SEO_PLAYBOOK.md)**.

---

## 🌍 Internationalization & RTL

Scripto's UI ships in **English and Arabic**, with correct right-to-left layout and Arabic fonts (Cairo). Document direction is configurable independently of the UI language.

To add a language:

1. Add an entry to `LANGUAGES` and a `STRINGS` map in `src/lib/i18n.ts`.
2. Provide translations for the string keys — any missing key falls back to English.

Layout stays correct across languages because the app uses **logical CSS** (e.g. `margin-inline-start` instead of `margin-left`), so RTL "just works" without mirrored stylesheets.

---

## 🤝 Contributing

Contributions are welcome. Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** and **[ARCHITECTURE.md](ARCHITECTURE.md)** to get oriented, then open an issue or a PR. TypeScript is strict (no `any`), updates are immutable, and `npm run typecheck && npm run build` should stay green.

---

## 🗺️ Roadmap

Ideas under consideration (not commitments):

- More document skins and community-contributed presets
- Additional UI languages beyond English + Arabic
- Richer front-matter driven export configuration
- Optional cloud sync as a strictly opt-in add-on (local-first stays the default)

---

## 📄 License

[MIT](LICENSE) — do what you like, no warranty.

---

## 🙏 Acknowledgements

Scripto stands on excellent open-source work:
[Paged.js](https://pagedjs.org/) ·
[CodeMirror](https://codemirror.net/) ·
[react-markdown](https://github.com/remarkjs/react-markdown) ·
[KaTeX](https://katex.org/) ·
[Mermaid](https://mermaid.js.org/) ·
[Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">

If Scripto is useful to you, please **⭐ star the repo** — it helps others find it.

</div>
