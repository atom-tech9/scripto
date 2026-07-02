# Prompt — Full audit & hardening: bugs, best practices, performance, "make it perfect"

Paste into the session that knows this codebase. Do this **last**, once features + SEO/SSG are in.

---

You are doing a **staff-level audit** of **Scripto** (Vite + React 18 + TypeScript strict; client-side
Markdown→PDF studio; now with a **vite-react-ssg** prerendered marketing layer at `/`, the SPA editor
at `/app`, Paged.js export, PWA, i18n + Arabic/RTL, localStorage persistence, optional AES vault, BYO-key
AI). Find real bugs, missing best practices, and performance wins, then **fix the important ones with
minimal, verified diffs**. Don't change behavior except to fix a defect. Keep
`npx tsc -b --force && npm run build && npm run lint` green.

## Method (evidence-based, no guessing)
1. **Map risk areas first**, then investigate each with the code open — cite `file:line` for every
   finding. Prefer verifying a bug (repro/trace) over speculating.
2. Report findings **ranked by severity** (Critical / High / Medium / Low), each with: file:line,
   one-line defect, concrete failure scenario, and the fix.
3. **Fix Critical + High** with the smallest safe diff; re-verify build/lint/typecheck. List Medium/Low
   for follow-up.
4. If available, lean on the local skills: `/health` (quality dashboard), `/cso` (security),
   `/qa` or `/browse` (live testing), `/benchmark` (web vitals), `/codex challenge` (adversarial
   second opinion). Use them to corroborate, not replace, your own reading.

## 1. Correctness & bugs (hunt hard)
- **SSR/SSG safety (new, high-risk):** vite-react-ssg prerenders in Node. Any module-top or render-time
  access to `window`/`document`/`localStorage`/`navigator`/`matchMedia`/`crypto` will crash or mis-render
  prerender. Audit `useLocalStorage`, `useTheme`, `i18n`/`LanguageProvider`, `useAppLock`/vault,
  `useMediaQuery`, and providers for `typeof window === 'undefined'` guards + hydration-safe initial
  state. Check for **hydration mismatches** (server vs first client render — theme/lang/dir differing).
- **Effect hygiene:** missing cleanup, stale closures, wrong deps, listeners/RAF/timeouts not cleared
  (scroll sync, autolock timer, mirror/vault sync, activity RAF, Paged.js render, image preload).
- **Race conditions:** concurrent PDF renders (StrictMode double-invoke guard), autosave vs vault
  mirror, doc-switch while a debounced write is pending, AI streaming abort on unmount.
- **Persistence edges:** localStorage quota exceeded (base64 images), corrupt JSON, cross-tab writes,
  migration of old configs missing new fields (verify `config` normalization covers every field).
- **Known issue:** Paged.js **RTL pagination hang** — watchdog exists; see
  `docs/PAGEDJS_RTL_DEBUG_PROMPT.md` for the root-cause task. Confirm the watchdog + image timeout work.
- **i18n:** every `t()` key resolves (a green tsc proves it if keys are typed); no untranslated hardcoded
  strings; RTL uses logical CSS only (`ms/me`, `start/end`) — grep for stray `ml-/mr-/left-/right-/text-left`.

## 2. Security
- **`dangerouslySetInnerHTML` / raw HTML:** audit every use (custom CSS injection, cover HTML, TOC HTML,
  Plausible/prefetch snippets, `rehype-raw` passthrough). Ensure user-derived values are escaped
  (`escapeHtml`) and that exported HTML/Word can't carry an XSS payload to a recipient. Confirm
  `urlTransform` only allows `data:image/` + safe schemes (no `javascript:`).
- **Crypto:** review `lib/crypto.ts`/`vault.ts` (PBKDF2 iterations, IV uniqueness, no key persisted,
  clearPlaintext correctness, verifier). Confirm the lock gate never mounts the app with plaintext.
- **AI (BYO key):** key stored locally only; never logged; requests go browser→provider; abis aborted.
- No secrets in the repo; deps have no known criticals (`npm audit` — triage, don't blindly `--force`).

## 3. Best practices & code quality
- Strict TS, **no `any`** (grep), explicit types on public APIs, immutable updates.
- **Accessibility:** dialogs trap focus + restore + `aria-modal` + Escape; all icon buttons have
  `aria-label`; menus/command palette are keyboard-navigable; color contrast ≥ AA in light+dark;
  visible focus rings; `prefers-reduced-motion` respected; landmarks/headings sane for screen readers.
- **No `console.log`** (use `@/lib/logger`); no dead code / unused deps (run `knip`, `ts-prune`,
  `depcheck` and remove safely); file sizes reasonable; consistent naming.
- Error handling at boundaries; user-facing errors via toast; ErrorBoundary coverage.

## 4. Performance (make it fast)
- **Bundle:** analyze with `rollup-plugin-visualizer`; confirm heavy chunks (Paged.js/PrintPreview,
  Mermaid, Excalidraw-if-any, CodeMirror) are lazy and not in the initial/marketing payload; the
  **marketing pages must ship ~zero app JS** (verify the SSG strip actually removed hydration scripts).
- **Re-renders:** profile typing — confirm a keystroke doesn't re-render the heavy preview (debounce +
  memo). Check `useMemo`/`useCallback` correctness (esp. things feeding CodeMirror `extensions`, which
  reconfigure if identities change). Look for context providers causing app-wide re-renders.
- **Large documents:** test a 100-page / thousands-of-rows / many-images doc — editor latency,
  preview reparse, pagination time. Consider a **web worker** for markdown parsing and/or an idle-time
  strategy; virtualization if needed. The base64-image-in-localStorage path is the main memory risk.
- **Core Web Vitals** on the landing + a use-case page: LCP (hero image eager+sized), CLS (image
  dims, font-display swap + preload), INP. Target Lighthouse Perf/SEO/Best-Practices/A11y ≥ 95.
- **Fonts:** preconnect (present) + consider `preload` for the primary UI font; avoid loading Arabic
  faces when not needed; `font-display: swap`.
- **Startup:** measure app TTI; ensure the SW precache size is sane (don't precache the whole marketing
  site); route-level code-splitting.

## 5. Robustness & UX states
- Loading / empty / error states everywhere async happens (PDF render, AI, import, GitHub fetch).
- Offline works (PWA) end-to-end; export never hangs (watchdog); broken images degrade gracefully.
- Import handles bad/huge files; paste handles weird clipboard HTML.

## 6. Tests (raise the floor)
- Add **unit tests** (Vitest) for pure logic: `lib/frontmatter`, `lib/stats`, `lib/crypto` round-trip,
  `lib/i18n` fallback, `io/importers`/`exporters`, `pdf/*` builders.
- Add **Playwright e2e** for critical flows: type → export PDF, import .docx, switch EN↔AR (RTL),
  enable passphrase → lock → unlock, apply a template. Wire into the CI workflow.

## Deliverable
1. A ranked findings report (Critical→Low) with `file:line` + failure scenario + fix.
2. Applied fixes for Critical + High (minimal diffs), with build/lint/typecheck green and a short
   before/after note (esp. any perf numbers: bundle sizes, Lighthouse, render timings).
3. A prioritized backlog of the remaining Medium/Low items.

## Constraints
- Don't break existing functionality, "preview === PDF" fidelity, i18n/RTL, PWA/offline, or SSG output.
- No `any`, no `console.log`. `npx tsc -b --force && npm run build && npm run lint` stay green.
