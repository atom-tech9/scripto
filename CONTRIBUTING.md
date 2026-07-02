# Contributing to Scripto

Thanks for your interest in improving **Scripto** — a fully client-side
Markdown → PDF studio built with React 18, TypeScript (strict), Vite, and
Tailwind. This guide explains how to set up your environment, follow our
conventions, and extend the app.

By participating, you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js 20+**
- **npm** (the project's package manager)

## Setup

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite dev server. Everything runs in the browser — there
is no backend to configure.

## Scripts

| Script              | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with hot reload.              |
| `npm run build`     | Type-check and produce a production build.              |
| `npm run preview`   | Serve the production build locally.                     |
| `npm run typecheck` | Run the TypeScript compiler in no-emit / project mode.  |
| `npm run lint`      | Run ESLint across the project.                          |
| `npm run format`    | Format the codebase with Prettier.                      |

## Branch & PR Flow

1. **Fork** the repository and create a focused branch off `main`
   (e.g. `feat/skin-newsprint`, `fix/rtl-toolbar`).
2. Make your change. **Keep PRs focused** — one logical change per PR is far
   easier to review and merge.
3. Ensure the **CI gate passes locally** before pushing:

   ```bash
   npm run typecheck && npm run lint && npm run build
   ```

4. Open a pull request and **fill out the
   [PR template](./.github/PULL_REQUEST_TEMPLATE.md)** completely.

### Conventional Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`, `ci`.

Examples:

```
feat: add newsprint document skin
fix: correct RTL alignment in the export toolbar
docs: document how to add a template
```

## Code Style

- **TypeScript strict, no `any`.** Prefer `unknown` and narrow it; never reach
  for `any`.
- **Immutable updates.** Never mutate existing objects or arrays — return new
  copies.
- **Logical CSS only** for anything directional. The app supports RTL, so use
  logical properties (`ms-/me-`, `ps-/pe-`, `start-/end-`, `text-start/end`,
  and the `rtl:` variant) — **never** physical ones (`ml/mr`, `left/right`,
  `text-left/right`).
- **All user-facing strings go through i18n.** Use `t('key')` and add the key to
  **both** `EN_STRINGS` and `STRINGS.ar` in
  [`src/lib/i18n.ts`](./src/lib/i18n.ts).
- **No `console.log`.** Use the logger at `@/lib/logger` instead.
- **Minimal, self-documenting comments.** Prefer clear names and small functions
  over explanatory comments.

Before marking work complete, verify: typecheck + lint + build pass, i18n keys
added for any new strings, and RTL still looks correct.

## Folder Map

```
src/
├── components/
│   ├── ui/          # Reusable primitives
│   ├── layout/      # App shell, dialogs, panels
│   ├── editor/      # Markdown editor
│   ├── preview/     # Live preview
│   ├── config/      # PDF / document configuration UI
│   └── security/    # Passphrase & encryption UI
├── markdown/
│   ├── components/  # Custom markdown renderers
│   └── plugins/     # remark / rehype plugins
├── pdf/             # PDF rendering / pagination
├── io/              # Import / export formats
├── hooks/           # React hooks
├── lib/             # Core utilities (i18n, logger, crypto, ...)
├── data/            # Skins, presets, templates
├── styles/          # Global & document CSS
└── types/           # Shared TypeScript types
```

## How to Extend

These recipes point you at the exact files to touch. Remember to run the CI gate
and add i18n keys where noted.

### Add a document skin

1. Add the new value to the `DocumentSkin` type in
   [`src/types/index.ts`](./src/types/index.ts).
2. Add an entry (including a `labelKey`) to `SKIN_OPTIONS` in
   [`src/data/skins.ts`](./src/data/skins.ts).
3. Add the `skin.<value>.label` key to i18n (en **and** ar) in
   [`src/lib/i18n.ts`](./src/lib/i18n.ts).
4. Add a `.scripto-doc[data-skin='<value>']` block in
   [`src/styles/document.css`](./src/styles/document.css) using logical
   properties for RTL safety.

### Add a theme preset

1. Add a `DocumentPreset` (`id`, `nameKey`, `descKey`, `config: Partial<PdfConfig>`)
   to [`src/data/presets.ts`](./src/data/presets.ts).
2. Add the `preset.<id>.name` and `preset.<id>.desc` i18n keys (en + ar).

### Add a template

1. Add a `DocumentTemplate` to
   [`src/data/templates.ts`](./src/data/templates.ts) — include `nameKey`,
   `descKey`, an `emoji`, and `content` with YAML front-matter.
2. Add the `template.<id>.name` and `template.<id>.desc` i18n keys (en + ar).

### Add an i18n locale

1. Add a `LANGUAGES` entry and a `STRINGS` map in
   [`src/lib/i18n.ts`](./src/lib/i18n.ts) (missing keys fall back to English).
2. Add the locale code to the `UiLanguage` union in
   [`src/types`](./src/types).

### Add an export format

1. Implement the format under [`src/io/`](./src/io/).
2. Wire it to a command and/or toolbar action.

### Add a command / dialog

1. Register the command in the command palette in
   [`src/App.tsx`](./src/App.tsx).
2. Add the dialog component under
   [`src/components/layout/`](./src/components/layout/).

For deeper background on architecture, RTL, and i18n, see the handoff design
docs under [`docs/`](./docs/).

## Questions

Open a [discussion or issue](./.github/ISSUE_TEMPLATE/) — we're happy to help.
