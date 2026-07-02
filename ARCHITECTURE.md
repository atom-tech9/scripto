# Scripto — Architecture

This document explains **how Scripto is built** and **why** the key decisions were made. It's aimed
at developers who want to understand, extend, or contribute to the codebase. For the feature list and
usage, see [README.md](README.md). For the roadmap brief, see [docs/P1_FEATURES.md](docs/P1_FEATURES.md).

---

## 1. Philosophy & guiding principles

1. **Local-first, zero backend.** Everything runs in the browser. Documents live in `localStorage`;
   nothing is uploaded. This gives privacy, free hosting (static files), and offline capability.
2. **The preview *is* the PDF.** The single most important design constraint: the on-screen preview
   and the exported PDF are produced by the **same stylesheet** and the **same rendered DOM**. There
   is no second renderer to drift out of sync.
3. **Config-driven rendering.** All document styling is parameterized through CSS custom properties
   and `data-*` attributes derived from one immutable `PdfConfig` object — so the same render path
   serves the live preview, the print preview, and HTML/Word export.
4. **Fidelity over reinvention.** For hard problems we lean on best-in-class libraries
   (Paged.js for pagination, CodeMirror for editing) rather than building
   lower-quality versions.
5. **Performance is a feature.** Typing must be instant; heavy work is debounced, memoized, and
   lazy-loaded.

---

## 2. Tech stack (and why)

| Concern | Choice | Why |
| --- | --- | --- |
| Build/dev | **Vite 5** | Fast HMR, ESM, simple config. Pinned to 5.x for Node 20 compat. |
| UI | **React 18 + TypeScript (strict)** | Mature ecosystem; strict typing for safety. |
| Styling | **Tailwind CSS 3** + CSS variables | Utility speed for app chrome; CSS vars for theming + the document stylesheet. |
| Editor | **CodeMirror 6** (`@uiw/react-codemirror`) | Best-in-class code editor: extensions, decorations, search. |
| Markdown | **react-markdown** + remark/rehype | Plugin-based AST pipeline; full control over rendering. |
| Math | **KaTeX** (`rehype-katex`) | Fast, print-friendly math. |
| Code highlight | **Prism** via `rehype-prism-plus` | AST-level highlighting + line numbers. |
| Diagrams | **Mermaid** (lazy) | Text-to-diagram, renders to inline SVG. |
| Pagination | **Paged.js** | Polyfills CSS Paged Media: real page boxes, running headers/footers, page numbers, repeating table headers. |
| Animation | **Motion** | Dialog/menu transitions. |
| Toasts | **Sonner** | Notifications. |
| Import | **mammoth** (DOCX→HTML) + **turndown** (HTML→MD) | Reliable DOCX/HTML import. |
| Front-matter | **js-yaml** | Parse YAML metadata blocks. |
| Offline | **vite-plugin-pwa** (Workbox) | Service worker + precache + runtime caching. |
| Crypto | **Web Crypto API** | Native AES-GCM / PBKDF2 — no crypto dependency. |

No global state library (Redux/Zustand) is used — React hooks + a small set of custom hooks are
sufficient for a local-first app.

---

## 3. High-level architecture

```mermaid
flowchart TD
  subgraph Browser
    Editor[CodeMirror Editor] -->|onChange| State[App state / useDocumentLibrary]
    State -->|debounced| LS[(localStorage)]
    State -->|debounced value| Pipeline[Markdown pipeline<br/>remark / rehype]
    Pipeline --> Preview[Live Preview DOM<br/>.scripto-doc]
    Config[PdfConfig] -->|CSS vars + data-attrs| Preview
    Preview -->|clone rendered DOM| Paged[Paged.js engine]
    Config -->|@page CSS| Paged
    Paged --> Print[Browser print → PDF]
    Preview -->|serialize| ExportHTMLWord[HTML / Word export]
    Lock[AppRoot gate + AES vault] --- State
  end
```

The **same rendered `.scripto-doc` DOM** feeds the preview, the PDF engine, and HTML/Word export.
That is the core of "preview === PDF".

---

## 4. Directory layout

```
src/
├── main.tsx                  # Entry: SW registration, ErrorBoundary, Confirm/Language/Mode providers, AppRoot
├── AppRoot.tsx               # Lock gate — mounts App only when unlocked/open
├── App.tsx                   # Orchestrator: state, commands, dialogs, shortcuts, layout
├── i18n.tsx                  # LanguageProvider + useLanguage() — UI language, dir, t()
├── mode.tsx                  # standard/simple UI mode provider
│
├── markdown/                 # The rendering pipeline (single source of truth)
│   ├── MarkdownRenderer.tsx  # unified plugins + component overrides + urlTransform
│   ├── plugins/
│   │   ├── remarkCallouts.ts # :::tip ::: → callout blocks
│   │   └── remarkMarks.ts    # ==highlight==, ^sup^, ~sub~
│   └── components/
│       ├── CodeBlock.tsx     # header + copy button (wraps highlighted code)
│       └── Mermaid.tsx       # lazy diagram rendering
│
├── pdf/                      # Export engine
│   ├── documentStyle.ts      # PdfConfig → CSS vars / data-attrs / class name
│   ├── pageStyles.ts         # generates @page CSS (margins, headers, page numbers, TOC, cover, watermark)
│   ├── buildExportContent.ts # clones live DOM, namespaces ids, prepends cover + TOC
│   └── renderPaged.ts        # runs Paged.js, preloads images, reports progress
│
├── io/                       # Import / export
│   ├── importers.ts          # .md/.txt/.tex passthrough, .docx (mammoth→turndown), .html
│   ├── github.ts             # import a repo README by URL (rewrites relative links to absolute)
│   └── exporters.ts          # Markdown, self-contained HTML, Word (.doc)
│
├── components/
│   ├── editor/               # MarkdownEditor (CM6), toolbar, commands, image-collapse decoration
│   ├── preview/              # Preview, PrintPreview (Paged.js modal), EmptyState
│   ├── config/               # ConfigPanel (settings)
│   ├── layout/               # Header, StatusBar, CommandPalette, Outline, dialogs
│   │                         #   (Templates, ThemeGallery, Documents, GitHub, AI settings/dashboard/input, FormattingHelp)
│   ├── security/             # LockScreen, SecurityDialog
│   ├── ui/                   # Primitives: Button, Dialog, Field, Menu, Tooltip, Confirm
│   └── ErrorBoundary.tsx
│
├── hooks/                    # useDocumentLibrary, useLocalStorage, useTheme, useAppLock, useDebouncedValue, useMediaQuery
├── lib/                      # constants, utils, logger, frontmatter, crypto, vault, image, stats, i18n (dictionary), ai (BYO-key client)
├── data/                     # sampleDocument, templates, presets, skins
├── styles/
│   ├── document.css          # THE shared preview+PDF stylesheet (skins, tables, callouts, code, math)
│   └── print.css             # @media print isolation + on-screen page chrome
└── types/                    # PdfConfig, DocumentSkin, DocumentRecord, pagedjs.d.ts
```

---

## 5. Rendering pipeline ("preview === PDF")

### 5.1 The unified pipeline
`MarkdownRenderer.tsx` configures `react-markdown` with a fixed plugin order:

**remark (Markdown AST):** `remark-gfm` (with `singleTilde: false` so `~` is free for subscripts) →
`remark-math` → `remark-directive` → `remarkCallouts` (custom) → `remark-definition-list` →
`remarkMarks` (custom `==`/`^`/`~`) → `remark-gemoji`.

**rehype (HTML AST):** `rehype-raw` (HTML passthrough) → `rehype-katex` → `rehype-slug` (heading ids
for TOC/outline) → `rehype-prism-plus` (highlight + line numbers).

**Component overrides:** `pre` detects `language-mermaid` → renders `<Mermaid>`, otherwise wraps the
highlighted code in `<CodeBlock>` (adds language label + copy button); `table` is wrapped in a
scrollable `.table-wrap`; `a` gets `target=_blank` for external links; `img` is lazy. A custom
`urlTransform` allows `data:image/` URLs (so embedded drawings/pasted images render) while still
sanitizing everything else.

### 5.2 Config → styling
The rendered Markdown is dropped into a single root element:

```html
<div class="scripto-doc hyphenate" data-skin="modern" data-code-theme="github-dark"
     data-table-style="striped" data-numbered="true"
     style="--doc-font: …; --doc-size: …; --doc-leading: …; --doc-accent: …;">
```

`src/pdf/documentStyle.ts` is the only place that maps `PdfConfig` → these CSS variables, `data-*`
attributes, and class names. `src/styles/document.css` reads those variables. Because both the live
`Preview` and the cloned export DOM use this exact element + stylesheet, **the preview and the PDF are
visually identical by construction**, not by manual syncing.

### 5.3 Skins
A "skin" is a `data-skin` value with a block of overrides in `document.css`
(`.scripto-doc[data-skin='editorial'] h2 { … }`). Skins restyle headings, tables, blockquotes, and
rules so genres look different. Adding a skin = extend the `DocumentSkin` union, add to
`SKIN_OPTIONS`, and add a CSS block. Presets (`data/presets.ts`) are `Partial<PdfConfig>` bundles
that, among other things, pick a skin.

---

## 6. The PDF export engine

Client-side PDF with **selectable text, embedded fonts, live links, and real pagination** is achieved
with **Paged.js + the browser's native print-to-PDF** — not a canvas rasterizer and not a from-scratch
PDF library (which would lose fidelity for Mermaid/KaTeX/HTML).

**Flow (`PrintPreview.tsx` → `renderPaged.ts`):**
1. Wait for `document.fonts.ready`.
2. `buildExportContent.ts` **clones** the live `.scripto-doc` DOM, **namespaces all ids** (`pdf-…`) so
   anchors don't collide with the still-mounted preview, and prepends the optional **cover page** and
   **table of contents**.
3. `pageStyles.ts` generates the **`@page` CSS**: physical size/orientation, margins, running header
   (via CSS `string-set` from the H1) or static header text, footer text, page numbers
   (`counter(page) / counter(pages)`), watermark (`.pagedjs_page::after`), named `cover`/`toc` pages,
   break rules (tables flow with repeating `<thead>`; code/figures/callouts `break-inside: avoid`),
   and TOC page numbers via `target-counter`.
4. Images are **preloaded** so Paged.js measures heights correctly (otherwise pagination drifts).
5. `new Previewer().preview(content, [{ pageStyle }], container)` paginates into real `.pagedjs_page`
   boxes inside the Print Preview modal — this is the exact, on-screen WYSIWYG of the PDF.
6. **Save as PDF** swaps `document.title` to the document's title (so the browser pre-fills the
   filename), adds a `scripto-printing` body class (so `print.css` hides everything except the
   paginated pages), resets the on-screen zoom transform, and calls `window.print()`. Everything is
   restored on `afterprint`.

**Known limitation:** a true PDF *bookmark outline* can't be produced by browser print (that needs a
server-side renderer like Puppeteer). The generated TOC is preserved as clickable in-PDF navigation —
the best the client-only path allows.

---

## 7. State & persistence

### 7.1 Document library
`useDocumentLibrary.ts` owns an array of `DocumentRecord` (`{ id, content, config, createdAt,
updatedAt }`) plus the active id. Each document carries **its own content and export config**. It
exposes `createDoc`, `duplicateDoc`, `deleteDoc`, `selectDoc`, `updateContent`, `updateConfig`,
`importDocs`. On first run it **migrates** any pre-existing single-document state into the library.

### 7.2 Why persistence is debounced
The critical perf decision: **React state is authoritative and updates on every keystroke, but the
`JSON.stringify` + `localStorage.setItem` is debounced (~300 ms)** and flushed on `pagehide`/
`visibilitychange`. Serializing the whole library (which can include base64 images) on every keypress
was the original source of input lag. The preview is additionally fed a **debounced copy** of the
markdown (`useDebouncedValue`, ~120 ms) so re-parsing doesn't run on every keystroke.

`useLocalStorage.ts` is the generic typed wrapper (with cross-tab sync and quota-exceeded detection).
It dispatches a `scripto:quota-exceeded` event that `App.tsx` turns into a toast.

### 7.3 Front-matter
`lib/frontmatter.ts` splits a leading `--- … ---` YAML block from the body. The body is what gets
rendered; recognized keys (`title`, `author`, `toc`, `cover`, `paper`, `font`, `numbered`,
`watermark`, …) are merged onto the config via `applyFrontmatter` to produce `effectiveConfig`.

---

## 8. Security — zero-knowledge encryption

Because data is local, the threat model is a **shared browser profile**. The optional passphrase lock
encrypts everything at rest:

- `lib/crypto.ts` — Web Crypto: PBKDF2 (150k iterations, SHA-256) derives an AES-GCM 256 key from the
  passphrase + salt. The passphrase is never stored; a small encrypted "verifier" blob checks
  correctness. Forgotten passphrase ⇒ unrecoverable (by design).
- `lib/vault.ts` — snapshots all `scripto:*` localStorage entries, encrypts them into a single vault
  blob, and can restore them. `clearPlaintext()` wipes the plaintext copies.
- `hooks/useAppLock.ts` — state machine `open | locked | unlocked`. The derived key lives **only in a
  ref (memory)** — closing the tab always re-locks. Auto-lock on inactivity; vault is mirrored on
  changes (debounced) and on tab hide.
- `AppRoot.tsx` — the **gate**: when status is `locked`, it renders `LockScreen` and **never mounts
  `App`**, so the localStorage-backed state never reads plaintext until the vault is decrypted.

---

## 9. Theming

Two independent layers:
- **App theme** (`useTheme.ts`): light / dark / system, applied as a `.dark` class on `<html>`; all
  app chrome uses HSL CSS variables defined in `index.css`.
- **Document skin + tokens**: independent of app theme (the printed page is always light), driven by
  `data-skin` + the `--doc-*` variables described in §5.

---

## 10. Embedded images

Pasted/dropped images are compressed (`lib/image.ts`: downscale to ≤1600px, re-encode) and embedded
as `data:image/` URLs, which flow through the normal pipeline into the preview and PDF. To keep the
editor source readable, a CodeMirror decoration (`editor/collapseImages.ts`) collapses long image
data URLs into an atomic `🖼 image` chip — display-only; the underlying text is untouched.

---

## 11. Import / export

- **Import** (`io/importers.ts`): text formats pass through; `.docx` → mammoth (HTML) → turndown
  (Markdown); `.html` → turndown. Imports open as a **new document**.
- **GitHub import** (`io/github.ts`): paste a repo URL (or `owner/repo`) to fetch its README via the
  public API; relative image/link paths are rewritten to absolute so it renders like on GitHub.
- **Paste-to-Markdown**: pasting rich HTML (Word/Docs/web) auto-converts via the shared turndown
  config; plain text and images are left untouched.
- **Export** (`io/exporters.ts`): Markdown (raw), **self-contained HTML** (inlines `document.css?inline`
  + CDN fonts/KaTeX), and **Word `.doc`** (HTML with the Office namespace). PDF goes through the
  Paged.js path in §6.
- **Pasted/dropped images** are auto-compressed (`lib/image.ts`: downscale to ≤1600px, re-encode)
  before embedding, to protect the storage quota.

---

## 12. PWA / offline

`vite-plugin-pwa` (Workbox, `registerType: 'autoUpdate'`) precaches the app shell and runtime-caches
Google Fonts and the KaTeX CDN. After first load the app works offline. `index.css` includes an
`@media print` block that restores normal document flow for printing.

---

## 13. Performance summary

- Debounced localStorage writes (state stays authoritative).
- Debounced preview re-render (`useDebouncedValue`).
- **Lazy-loaded heavy chunks:** Paged.js/PrintPreview, Mermaid — none are in
  the initial bundle.
- Stable callbacks (`useCallback`) so CodeMirror doesn't reconfigure its extensions each render.
- `manualChunks` in `vite.config.ts` splits react / codemirror / markdown vendors.
- Image compression + the editor data-URL collapse decoration keep large docs manageable.

---

## 14. Extending Scripto

| To add… | Do this |
| --- | --- |
| A **document skin** | Extend `DocumentSkin` (types), add to `SKIN_OPTIONS`, add a `.scripto-doc[data-skin='x']{…}` block in `document.css`. |
| A **preset** | Add a `Partial<PdfConfig>` to `data/presets.ts`. |
| A **template** | Add a `DocumentTemplate` to `data/templates.ts`. |
| A **config option** | Add to `PdfConfig` (types) + `DEFAULT_CONFIG` + a control in `ConfigPanel` + consume in `documentStyle.ts`/`document.css`/`pageStyles.ts`. |
| A **Markdown feature** | Add a remark/rehype plugin (or a custom one under `markdown/plugins/`) in `MarkdownRenderer.tsx`. |
| An **export format** | Add to `io/exporters.ts` + a `MenuItem`/command. |
| A **command / dialog** | See the wiring recipe in [docs/P1_FEATURES.md](docs/P1_FEATURES.md) §0. |

---

## 15. Build & deploy

```bash
npm run build     # tsc -b (type-check) + vite build → dist/ (+ service worker)
npm run preview   # serve the production build
```

`dist/` is fully static — deploy to any static host (Vercel, Netlify, GitHub Pages, S3). No
environment variables or server required.

---

## 16. Conventions for contributors

- TypeScript strict; **no `any`** (use `unknown` + narrowing). Explicit types on exported APIs.
- **Immutable** updates everywhere.
- **No `console.log`** — use `lib/logger.ts` and `getErrorMessage`.
- Reuse the `components/ui/*` primitives; don't hand-roll buttons/dialogs.
- Handle errors with `toast.error`; show loading states; keep things keyboard-accessible and
  light/dark safe.
- Keep `npx tsc -b && npm run build` green.

---

## 17. Internationalization & RTL

- **Dictionary** (`lib/i18n.ts`): `LANGUAGES` (en/ar), `EN_STRINGS` (the key set / source of truth),
  `STRINGS` (per-language maps), and `translate(lang, key)`. Missing keys fall back to English.
- **Context** (`i18n.tsx`): `<LanguageProvider>` owns the `scripto:ui-lang` state, sets
  `<html dir/lang>`, and exposes `useLanguage()` → `{ lang, dir, setLang, toggle, t }`.
- **Add a language:** add its code to `UiLanguage` (`types`), a `LANGUAGES` entry, and a `STRINGS`
  map; translate incrementally (missing keys fall back).
- **RTL:** UI chrome uses logical CSS (`ms-/me-`, `ps-/pe-`, `start-/end-`, `rtl:`). Document
  direction is `config.direction` (`auto`/`ltr`/`rtl`); Arabic uses the Cairo font. Code blocks and
  math stay LTR inside RTL documents.
- **PDF + RTL gotcha:** Paged.js mis-measures inside an RTL context, so `renderPaged.ts` forces its
  render container to `dir="ltr"` (documents keep their own direction via `.scripto-doc[dir]`), and
  heading numbers are baked as literal text (Paged.js doesn't carry CSS counters across page breaks).

---

## 18. AI assist (bring-your-own-key)

Optional. The user supplies their own provider API key; requests go **straight from the browser to
the provider** — there is no Scripto server.

- `lib/ai.ts` — the provider client (streaming, provider/model/reasoning/temperature config).
- Editor integration: slash commands, selection actions, and inline ghost autocomplete
  (`components/editor/ghostCompletion.ts`).
- Dialogs (`components/layout/`): `AiSettingsDialog`, `AiDashboardDialog`, `AiInputDialog`.
- The key lives only in this browser's `localStorage` and is encrypted at rest when the passphrase
  lock is on (see §8). It is never logged or sent anywhere except the chosen provider.
