# Prompt — Add a "Diagrams" section with 10 modern Mermaid templates

Paste into the session that owns the editor/AI/templates work.

---

Add a dedicated **Diagrams** section to the Templates picker with **10 polished, real-world Mermaid
templates**, so users who don't know Mermaid syntax can start from a great example. Scripto already
renders Mermaid (```mermaid fences → live SVG, flows into the PDF) and is fully **i18n + RTL** — follow
those conventions. Keep `npx tsc -b && npm run build` green; no `any`; no `console.log`.

## Where things live
- `src/data/templates.ts` — `DocumentTemplate` (now uses `nameKey`/`descKey` i18n keys, `emoji`,
  `content`). `TEMPLATES` array.
- `src/components/layout/TemplatesDialog.tsx` — renders the grid; uses `useLanguage().t`.
- `src/lib/i18n.ts` — add every `nameKey`/`descKey` to `EN_STRINGS` **and** `STRINGS.ar`.
- Mermaid renders via `src/markdown/components/Mermaid.tsx` (already wired).

## Implementation
1. **Add a category** to `DocumentTemplate`: `category: 'document' | 'diagram'` (default existing ones
   to `'document'`). 
2. **Group in `TemplatesDialog`**: render two labelled sections — "Documents" and "Diagrams"
   (`t('templates.section.documents')`, `t('templates.section.diagrams')`) — each a grid of its
   category. Keep it tidy in both LTR and RTL (logical classes only).
3. **Add the 10 diagram templates** below. Each `content` should be a complete mini-doc: a short H1
   title, one sentence of plain-English context, then the ```mermaid block. Add `nameKey`/`descKey`
   to i18n (en + ar). Use distinct emojis.
4. Verify each diagram renders (Mermaid v11 syntax) in preview and exports to PDF.

## The 10 templates (valid Mermaid v11 — use as the content bodies)

1. **Flowchart — Process / decision** 🔀
\`\`\`mermaid
flowchart TD
  A[Start] --> B{Approved?}
  B -- Yes --> C[Ship it]
  B -- No --> D[Request changes] --> A
\`\`\`

2. **Sequence — API / auth flow** 🔁
\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant A as App
  participant S as Auth Server
  U->>A: Login (email, password)
  A->>S: POST /token
  S-->>A: JWT
  A-->>U: Logged in
\`\`\`

3. **Gantt — Project timeline** 📅
\`\`\`mermaid
gantt
  title Project Plan
  dateFormat YYYY-MM-DD
  section Build
  Design      :a1, 2026-01-01, 7d
  Development  :a2, after a1, 14d
  section Launch
  QA          :a3, after a2, 5d
  Release     :milestone, after a3, 0d
\`\`\`

4. **Class — Domain model** 🧱
\`\`\`mermaid
classDiagram
  class User { +id: string +email: string +login() }
  class Order { +id: string +total: number }
  User "1" --> "*" Order : places
\`\`\`

5. **ER — Database schema** 🗄️
\`\`\`mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "ordered in"
\`\`\`

6. **State — Lifecycle / state machine** 🔄
\`\`\`mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review : submit
  Review --> Published : approve
  Review --> Draft : reject
  Published --> [*]
\`\`\`

7. **User journey — Experience map** 🧭
\`\`\`mermaid
journey
  title Checkout experience
  section Browse
    Find product: 4: User
    Add to cart: 5: User
  section Pay
    Enter details: 3: User
    Confirm: 5: User
\`\`\`

8. **Git graph — Branching / releases** 🌿
\`\`\`mermaid
gitGraph
  commit
  branch develop
  commit
  checkout main
  merge develop
  commit tag: "v1.0"
\`\`\`

9. **Pie — Distribution / share** 🥧
\`\`\`mermaid
pie title Budget allocation
  "Engineering" : 45
  "Design" : 25
  "Marketing" : 30
\`\`\`

10. **Mindmap — Brainstorm / structure** 🧠
\`\`\`mermaid
mindmap
  root((Product))
    Growth
      SEO
      Referrals
    Retention
      Onboarding
      Notifications
\`\`\`

(Bonus if easy: a **timeline** example.)

## Acceptance
- Templates picker shows a separate "Diagrams" section with the 10 entries, names/descriptions
  translated (en + ar), correct in LTR + RTL + light/dark.
- Selecting one loads a doc whose Mermaid renders live and exports cleanly to PDF.
- `npx tsc -b && npm run build` pass.
