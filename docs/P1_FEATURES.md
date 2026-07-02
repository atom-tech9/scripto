# Scripto — P1 Feature Implementation Brief

> Hand this file to a fresh Claude Code session. It is self-contained: it explains the
> codebase, the conventions, and gives a step-by-step spec for four features:
> **(4) Live Theme Gallery**, **(5) GitHub README mode**, **(6) Résumé/CV builder + ATS templates**,
> **(7) AI assist (bring-your-own-key)**.
>
> Build after every feature with `npx tsc -b && npm run build` — both must pass. Keep the dev
> server snappy.

---

## 0. Project orientation (read first)

**What it is:** Scripto is a 100% client-side Markdown → PDF studio (no backend). Vite + React 18
+ TypeScript (strict) + Tailwind 3. Markdown is rendered with `react-markdown` (remark/rehype) and
exported via **Paged.js** + the browser's native print-to-PDF. There's a multi-document library,
passphrase encryption, PWA offline, document "skins", and presets.

**Run/verify:**
```bash
npm install
npm run dev          # http://localhost:5173
npx tsc -b && npm run build   # MUST stay green
```

### Conventions (follow these exactly)
- **TypeScript strict, no `any`.** Use `unknown` + narrowing. Explicit types on exported APIs.
- **Immutable updates** (spread, never mutate).
- **No `console.log`** — use `logger` from `src/lib/logger.ts` (`logger.warn/error/debug`) and
  `getErrorMessage(err)` for messages.
- **Lazy-load heavy deps** with `React.lazy` + `<Suspense>` (see how `PrintPreview` and
  `DrawingBoard` are loaded in `src/App.tsx`).
- **UI primitives already exist** — reuse them, don't reinvent:
  - `src/components/ui/Button.tsx` — `<Button variant size>`
  - `src/components/ui/Dialog.tsx` — `<Dialog open onClose title description footer size>`
  - `src/components/ui/Field.tsx` — `Field`, `TextInput`, `TextArea`, `Select`, `Switch`, `Slider`, `Segmented`
  - `src/components/ui/Menu.tsx` — dropdown `Menu` + `MenuItem`
  - `src/components/ui/Tooltip.tsx`
  - `src/components/ui/Confirm.tsx` — `useConfirm()` returns `confirm({title, description, confirmLabel, destructive}) => Promise<boolean>`
  - Toasts: `import { toast } from 'sonner'` → `toast.success/error(msg)`
- **Path alias:** `@/` → `src/`.
- **Design tokens:** Tailwind colors map to CSS vars (`bg-surface`, `text-foreground`, `border-border`,
  `bg-primary`, `text-muted-foreground`, `bg-muted`, `bg-accent`, `text-destructive`). Dark mode via
  `.dark` class on `<html>`.

### Key files you'll touch
| File | Purpose |
| --- | --- |
| `src/App.tsx` | Orchestrator: state, dialogs, the `commands` array (⌘K palette), lazy loads, keyboard shortcuts. **This is where you register new dialogs/commands.** |
| `src/types/index.ts` | `PdfConfig`, `DocumentSkin`, `DocumentRecord`, etc. |
| `src/lib/constants.ts` | `DEFAULT_CONFIG`, `MARGIN_PRESETS`, `FONT_STACKS`. |
| `src/lib/frontmatter.ts` | Parses YAML front-matter and maps keys → `PdfConfig` (`applyFrontmatter`). |
| `src/data/templates.ts` | `TEMPLATES: DocumentTemplate[]` (id, name, description, emoji, content). |
| `src/data/presets.ts` | `DOCUMENT_PRESETS` (partial `PdfConfig`). |
| `src/components/config/ConfigPanel.tsx` | Settings UI; `SKIN_OPTIONS`, `ACCENT_SWATCHES`. |
| `src/styles/document.css` | The shared preview+PDF stylesheet; **skins live here** under `.scripto-doc[data-skin='x']`. |
| `src/pdf/documentStyle.ts` | `documentStyleVars`, `documentDataAttrs` (sets `data-skin`, `data-code-theme`, etc.), `documentClassName`. |
| `src/markdown/MarkdownRenderer.tsx` | The unified pipeline + component overrides + `urlTransform` (allows `data:image/`). |
| `src/hooks/useDocumentLibrary.ts` | `library.createDoc(content, title)`, `updateContent`, `updateConfig`, `selectDoc`, `importDocs`, `docs`, `activeDoc`, `activeId`. |
| `src/components/layout/Header.tsx` | Top bar; `HeaderProps` + `IconAction`. Add buttons here. |
| `src/components/layout/CommandPalette.tsx` | `Command` type: `{id,label,group,icon:LucideIcon,hint?,keywords?,run}`. |

### How to add a dialog + command (the standard wiring)
1. Build the component under `src/components/...` using `Dialog`.
2. In `App.tsx`: add `const [xOpen, setXOpen] = useState(false)`, render `<XDialog open={xOpen} onClose={()=>setXOpen(false)} ... />` near the other overlays.
3. Add a command to the `commands` useMemo array: `{ id, label, group, icon, run: () => setXOpen(true) }` and add any new handler to its dependency array.
4. (Optional) Add a header button via `HeaderProps` + an `<IconAction>` and pass the handler from `App.tsx`.

### How `config` flows (important)
`activeDoc.config` is normalized against `DEFAULT_CONFIG` in `App.tsx` (`const config = useMemo(...)`).
`effectiveConfig = applyFrontmatter(config, frontmatter)` is what the preview/PDF use. To add a new
config field: add it to `PdfConfig` (types), `DEFAULT_CONFIG` (constants), a control in `ConfigPanel`,
and consume it in `documentStyle.ts`/`document.css`/`pageStyles.ts` as needed.

---

## Feature 4 — Live Theme Gallery (visual skin/preset picker)

**Why:** The skin engine exists (10 skins via `data-skin`), but users can't *see* them. A visual
gallery with live mini-previews is the "what did you use?!" moment.

**User story:** Click "Themes" (header + ⌘K) → a dialog shows a grid of cards, each rendering a tiny
live preview of a sample document in that skin + accent → click a card to apply it → dialog closes,
toast confirms.

### Steps
1. **Create `src/components/layout/ThemeGalleryDialog.tsx`.**
   - Props: `{ open, onClose, config: PdfConfig, onApply: (patch: Partial<PdfConfig>) => void }`.
   - A small constant sample string, e.g.:
     ```md
     # Heading One
     A short paragraph with **bold** and a [link](#).
     > A blockquote line.

     | A | B |
     | - | - |
     | 1 | 2 |
     ```
   - Render a responsive grid (`grid-cols-2 sm:grid-cols-3`). For each skin in `SKIN_OPTIONS`
     (export that list from `ConfigPanel` or move it to `src/data/skins.ts` — preferred: create
     `src/data/skins.ts` exporting `SKIN_OPTIONS` and import it in both places):
     - A card containing a **scaled-down live preview**: a `<div className={documentClassName(...)}
       style={documentStyleVars(cfg)} {...documentDataAttrs(cfg)}>` wrapping
       `<MarkdownRenderer content={SAMPLE} resolvedTheme="light" />`, where
       `cfg = { ...config, skin }`. Wrap it in a fixed-size box with
       `transform: scale(0.4); transform-origin: top left; pointer-events: none;` and
       `overflow: hidden`. Use a white background so it reads like paper.
     - A label with the skin name; highlight the active skin (`config.skin === skin`).
     - `onClick={() => { onApply({ skin }); onClose() }}`.
   - **Performance:** only mount the previews when `open` is true. Memoize the sample render.
     10 mini renders is fine; if sluggish, lazy-mount cards with `IntersectionObserver` or render
     static representative cards instead.
2. **Move `SKIN_OPTIONS`** to `src/data/skins.ts` (so both ConfigPanel and the gallery import it).
3. **Wire into `App.tsx`:** state `galleryOpen`, render the dialog with
   `onApply={updateConfig}` (already exists), add a command `{ id:'themes', label:'Theme gallery',
   group:'View', icon: Palette, run: () => setGalleryOpen(true) }`, and a header `IconAction`
   (icon: `Palette` or `Swatches` from lucide).
4. (Stretch) Add a second tab/section in the gallery for **presets** (`DOCUMENT_PRESETS`) using
   `onApplyPreset` (already in `App.tsx`).

### Acceptance
- Gallery shows all 10 skins as recognizably different mini-previews.
- Clicking a card changes the live document skin and persists (it goes through `updateConfig`).
- Active skin is visually marked. ⌘K → "Theme gallery" works. `tsc` + build green.

---

## Feature 5 — GitHub README mode

**Why:** Devs constantly want a polished PDF of a repo's README. Paste a URL → instant beautiful doc.

**User story:** Click "Import from GitHub" → paste `https://github.com/owner/repo` (or `owner/repo`)
→ Scripto fetches the README, rewrites relative image/links to absolute, and opens it as a **new
document**.

### Steps
1. **Create `src/io/github.ts`:**
   - `export function parseRepo(input: string): { owner: string; repo: string } | null` — accept
     full URLs (`https://github.com/owner/repo`, with optional `/tree/branch`, `.git`, trailing
     slashes) and bare `owner/repo`. Return null on invalid.
   - `export async function fetchReadme(owner: string, repo: string): Promise<{ markdown: string; name: string }>`:
     - GET `https://api.github.com/repos/${owner}/${repo}/readme` (no auth; CORS is allowed).
       Parse JSON → `{ content (base64), path, download_url }`. Decode base64 → markdown
       (use `atob` + `decodeURIComponent(escape(...))` or `TextDecoder` on the bytes for UTF-8).
     - Derive the **raw base** from `download_url` (e.g.
       `https://raw.githubusercontent.com/owner/repo/<branch>/<dir>/`). Strip the filename to get
       the directory base for relative asset resolution.
     - **Rewrite relative URLs** in the markdown so images/links resolve:
       - Markdown images/links: `]( ./x )`, `]( x/y.png )` (not starting with `http`, `#`, `/`, `mailto:`)
         → prefix with the raw base. Absolute-from-root (`/x`) → repo raw root.
       - HTML `<img src="relative">` and `<a href="relative">` similarly.
     - Return `{ markdown, name: repo }`.
   - Errors: 404 → "Repo or README not found." 403 → "GitHub rate limit reached (60/hour for
     anonymous). Try again later." Network → generic. Throw `Error(getErrorMessage)`.
2. **Create `src/components/layout/GithubDialog.tsx`** using `Dialog`:
   - A `TextInput` for the URL, an "Import" `Button` (loading state with `Loader2`), inline error text.
   - On success: `library.createDoc(markdown, name)` then `toast.success` and `onClose()`.
3. **Wire into `App.tsx`:** pass a callback that calls `library.createDoc`. Add a command
   `{ id:'github', label:'Import from GitHub README', group:'File', icon: Github, run: () => setGithubOpen(true) }`
   and (optional) a `MenuItem` in the Header's import area.

### Gotchas
- `api.github.com` and `raw.githubusercontent.com` both return permissive CORS for GET — no proxy needed.
- Anonymous rate limit is 60 req/hour — surface 403 nicely.
- README images are very often relative — the URL rewriting is the part that makes it look perfect.
- Mermaid code fences in GitHub READMEs will render (we support Mermaid).

### Acceptance
- Pasting a real public repo URL imports a correctly rendered README **with images showing**.
- Invalid input and rate-limit errors show friendly messages. `tsc` + build green.

---

## Feature 6 — Résumé/CV builder + ATS templates

**Why:** "resume to PDF" is one of the highest-intent searches on the web. Great ATS templates +
a résumé-tuned skin make Scripto a destination.

### 6a. Front-matter: support `skin`, `accent`, and margins
Currently `src/lib/frontmatter.ts` (`applyFrontmatter`) maps `paper`, `font`, `toc`, `cover`,
`pageNumbers`, `numbered`, `watermark`. **Add:**
- `skin` → validate against the `DocumentSkin` union and set `config.skin`.
- `accent` / `accentColor` → set `config.accentColor` (validate it's a hex string).
- (optional) `margins: narrow|normal|wide` → set `marginPreset` + `margins` from `MARGIN_PRESETS`.
This lets templates declare their look. Keep the existing validation style (`asString`, arrays of
valid values).

### 6b. (Optional) A dedicated `resume` skin
You may add a `resume` skin to the `DocumentSkin` union (`src/types/index.ts`), `SKIN_OPTIONS`
(`src/data/skins.ts`), and `src/styles/document.css`. ATS-friendly resume styling:
- Single column, no layout tables, generous section spacing.
- Name (H1) large, no border; section headers (H2) uppercase with a thin accent underline and
  tight `margin-top`; compact lists. Avoid drop caps/columns.
- Example:
  ```css
  .scripto-doc[data-skin='resume'] h1 { border:none; font-size:2em; text-align:left; margin-bottom:0.1em; }
  .scripto-doc[data-skin='resume'] h2 { border:none; text-transform:uppercase; letter-spacing:0.06em;
    font-size:1em; color:var(--doc-accent); border-bottom:1.5px solid var(--doc-rule); padding-bottom:0.15em; margin:1.1em 0 0.4em; }
  .scripto-doc[data-skin='resume'] ul { margin:0.2em 0 0.6em; }
  .scripto-doc[data-skin='resume'] li { margin:0.12em 0; }
  ```
- If you add it, also add a preset in `src/data/presets.ts` ("ATS Résumé") and remember every preset
  object must include valid fields only (it's `Partial<PdfConfig>`).

### 6c. Add ATS résumé templates to `src/data/templates.ts`
Add **6–8** templates. **ATS rules to follow in the content** (this is the value):
- **Single column. No tables for layout** (ATS parsers mangle columns/tables). Plain headings.
- **Standard section names:** `Summary`, `Experience`, `Education`, `Skills`, `Projects`, `Certifications`.
- Real text, reverse-chronological, quantified bullets. No images/icons for critical info.
- Front-matter: `pageNumbers: false`, a suitable `skin` (`resume` or `compact`), `font: sans`,
  `accent` color, `margins: narrow|normal`.
Suggested template set (vary tone/industry):
1. **ATS Résumé — Classic** (most conservative, serif/sans, plain)
2. **ATS Résumé — Modern** (sans, accent section rules)
3. **ATS Résumé — Software Engineer** (Skills grouped, Projects with links)
4. **ATS Résumé — Product/Manager** (impact metrics, leadership)
5. **ATS Résumé — Student/New Grad** (Education first, coursework, internships)
6. **ATS Résumé — Executive** (summary-heavy, board/strategy)
7. **ATS Résumé — Career-change** (functional emphasis on transferable skills)
8. **Cover Letter** (already exists — leave it)

Each `content` should be a complete, realistic, fill-in-the-blanks résumé (use placeholders like
`{Your Name}`, `{Company}`, `{2022 – Present}`). Keep to ~1 page of content.

### Acceptance
- New résumé templates appear in the Templates dialog and produce clean, single-column, 1-page PDFs.
- Front-matter `skin`/`accent` take effect. PDF filename = document title (already implemented).
- `tsc` + build green.

---

## Feature 7 — AI assist (bring-your-own-key, no server)

**Why:** "Improve writing / summarize / generate" inside the editor, using the **user's own API key**
stored locally. Optional, zero backend.

### 7a. Settings & storage
- Store AI config in localStorage under key `scripto:ai`:
  `{ provider: 'openai'|'anthropic'|'openrouter'|'custom', apiKey: string, model: string, baseUrl?: string }`.
  Use the existing `useLocalStorage` hook.
- **Security note:** the key lives in `localStorage`. Because the encryption vault snapshots all
  `scripto:*` keys (`src/lib/vault.ts`), the key is **encrypted at rest when the passphrase lock is
  on**. Mention this in the UI. Never log the key (`logger`), never hardcode anything.
- Add an "AI (bring your own key)" section to `ConfigPanel.tsx` (or a dedicated `AiSettingsDialog`):
  provider `Select`, model `TextInput` (with sensible default per provider), key `TextInput
  type="password"`, optional `baseUrl`, and a privacy disclaimer.

### 7b. `src/lib/ai.ts`
- `export interface AiConfig { provider; apiKey; model; baseUrl? }`
- `export async function runAi(cfg: AiConfig, system: string, user: string, signal?: AbortSignal): Promise<string>`:
  - **OpenAI / OpenRouter / custom:** POST `${baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`
    with `Authorization: Bearer <key>`, body `{ model, messages:[{role:'system',content:system},{role:'user',content:user}] }`.
    OpenRouter base: `https://openrouter.ai/api/v1`. Parse `choices[0].message.content`.
  - **Anthropic:** POST `https://api.anthropic.com/v1/messages` with headers
    `x-api-key`, `anthropic-version: 2023-06-01`, and **`anthropic-dangerous-direct-browser-access: true`**
    (required for browser CORS). Body `{ model, max_tokens, system, messages:[{role:'user',content:user}] }`.
    Parse `content[0].text`.
  - Throw friendly errors on non-2xx (parse provider error JSON). Support `AbortSignal`.
- Keep prompts small and focused; default models e.g. OpenAI `gpt-4o-mini`, Anthropic
  `claude-3-5-haiku-latest`, OpenRouter a small model. (Don't hardcode keys.)

### 7c. Editor actions
- Use `editorView` (already available in `App.tsx`) and helpers in
  `src/components/editor/editorCommands.ts`. Add a helper to read the current selection and to
  replace it (there's `wrapSelection`/`insertText`; add `replaceSelection(view, text)` if needed).
- Add commands (palette group "AI") and a small toolbar dropdown or a floating menu on selection:
  - **Improve writing** / **Fix grammar** / **Make concise** / **Expand** / **Summarize** /
    **Change tone…** — operate on the selected text, replace it with the result.
  - **Generate from prompt** — a small dialog: textarea prompt → inserts result at cursor.
  - **Translate…** — pick a language → translate selection.
- UX: show `toast.loading` / a spinner while running; on error `toast.error`. Provide a Cancel
  (AbortController). If no key is configured, route the user to AI settings with a toast.

### Acceptance
- With a valid key, selecting text and running "Improve writing" replaces the selection with improved
  text; "Generate from prompt" inserts generated Markdown. Errors (bad key, rate limit, CORS) show
  friendly toasts. With the passphrase lock on, the stored key is encrypted at rest.
- No key is ever logged or hardcoded. `tsc` + build green.

---

## Suggested build order
1. **Feature 6a** (front-matter `skin`/`accent`) — tiny, unblocks résumé templates.
2. **Feature 6c** (résumé templates) + **6b** (resume skin) — pure content/CSS, high impact, low risk.
3. **Feature 4** (theme gallery) — reuses skins, very visual.
4. **Feature 5** (GitHub README) — self-contained `io/` + dialog.
5. **Feature 7** (AI assist) — biggest; do last.

## Definition of done (every feature)
- `npx tsc -b && npm run build` pass (build also regenerates the PWA service worker — that's expected).
- No `any`, no `console.log`, immutable updates, reuses existing UI primitives.
- Reachable from the ⌘K command palette (and a header/menu entry where it makes sense).
- Errors handled with `toast.error` + `getErrorMessage`; loading states shown.
- Works in light & dark themes; keyboard accessible.
