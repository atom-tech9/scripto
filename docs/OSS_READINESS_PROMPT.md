# Prompt — Open-source readiness: cleanup, docs, contributor guidelines, comment hygiene

Paste into a fresh Claude Code session.

---

Prepare **Scripto** (client-side Markdown→PDF studio: React 18 + TS strict + Vite + Tailwind) to be a
**polished, welcoming open-source project** — first public release. Make it feel hand-crafted by a
careful engineer, not machine-generated. **Do not change app behavior**; this is docs, structure, and
comment hygiene. Keep `npx tsc -b --force && npm run build` green throughout.

## 1. Comment hygiene (whole `src/` tree)
Sweep every file and normalize comments so a newcomer can navigate quickly:
- **Remove** verbose, obvious, or "AI-sounding" comments (e.g. narrating what the next line literally
  does, restating the function name, tutorial-style paragraphs, redundant JSDoc that repeats types).
- **Keep / add** a single concise one-line comment where it adds real value:
  - a short "what this file/module is" line at the top of non-trivial files,
  - a brief "why" on non-obvious logic, workarounds, gotchas, or tricky RTL/PDF/crypto bits.
- Prefer self-documenting names over comments. No commented-out code. No `console.log`
  (use `@/lib/logger`). Tone: calm, factual, one line, sentence case.
- Result: comment density feels like a thoughtful human's — sparse but helpful.

## 2. Codebase organization & dead code
- Run/inspect with `knip`, `ts-prune`, `depcheck` (add as devDeps or `npx`) and **remove unused
  exports, files, and dependencies** (verify each before deleting; don't break lazy imports).
- Confirm the folder structure is consistent and documented (`markdown/`, `pdf/`, `io/`, `components/
  {ui,layout,editor,preview,config,security}`, `hooks/`, `lib/`, `data/`, `styles/`, `types/`). Move
  any stragglers to where they belong. Keep files focused (<~400 lines where reasonable).
- Add tooling config for contributors: `.editorconfig`, Prettier config, an ESLint flat config
  (typescript-eslint + react-hooks + jsx-a11y), and npm scripts: `lint`, `format`, `typecheck`,
  `build`. Ensure the repo passes `lint` clean.
- Ensure `.gitignore` is complete (node_modules, dist, .env, editor cruft).

## 3. Documentation (make it excellent, end-to-end)
- **README.md** — rewrite to a top-tier OSS README:
  1. Hero: name + one-line pitch + centered logo (`/public/logo.webp`) + badges (license, build,
     PRs welcome, made-with).
  2. A screenshot/GIF placeholder (`docs/assets/…`) with a caption; a **"Live demo"** link
     placeholder and a **one-click Deploy** button (Vercel/Netlify).
  3. Why Scripto (the moat: Markdown → pixel-perfect paginated PDF; skins; offline; privacy; Arabic/RTL;
     AI-optional). Feature list grouped with emojis.
  4. Quick start (`npm install`, `npm run dev`, `npm run build`), requirements (Node 20+).
  5. Tech stack table; link to `ARCHITECTURE.md`.
  6. i18n/RTL note (how to add a language → `src/lib/i18n.ts`).
  7. Contributing section → link `CONTRIBUTING.md`; Roadmap; License; Acknowledgements; Star CTA.
  Keep it skimmable, accurate to the current code, no overclaiming.
- **ARCHITECTURE.md** — verify it matches the current tree (it exists); fix any drift (e.g. removed
  drawing board, added i18n/AI/GitHub-import/theme-gallery). Keep the diagrams.
- **CONTRIBUTING.md** (new) — setup, scripts, branch/PR flow, commit style (Conventional Commits),
  code style (strict TS, no `any`, immutable, logical CSS, i18n keys, minimal comments), the
  build/lint gate, and **"How to extend"** recipes: add a skin, a preset, a template, an i18n locale,
  an export format, a command/dialog (point to the existing handoff docs).
- **CODE_OF_CONDUCT.md** (Contributor Covenant), **SECURITY.md** (how to report; note the
  zero-knowledge model), **LICENSE** (MIT), and **CHANGELOG.md** (Keep a Changelog format, seed with
  the current feature set as the first release).
- `.github/`: issue templates (bug/feature), a PR template, and optionally a CI workflow that runs
  `typecheck + lint + build` on PRs.

## 4. Final pass
- Ensure every doc link resolves, versions/commands are correct, and the app still builds & runs.
- Summarize what was removed (dead code/deps), the new docs added, and the comment-cleanup approach.

## Acceptance
- A newcomer can clone, read the README, run it in <2 minutes, and know exactly how to contribute.
- Comments are sparse, human, and helpful; no dead code/unused deps; lint + typecheck + build green.
