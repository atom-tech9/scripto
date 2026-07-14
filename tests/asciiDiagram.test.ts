import { describe, expect, it } from 'vitest'
import {
  ASCII_DIAGRAM_LANGUAGES,
  PLAIN_TEXT_LANGUAGES,
  codePointWidth,
  diagramRowCount,
  isAsciiDiagram,
  maxVisualColumns,
  parseFenceTitle,
} from '../src/markdown/asciiDiagram'

// —— Fixtures (verbatim from the feature spec) ——————————————————————————

const FIXTURE_A = `                 Internet (your users & clients)
                          │
                          ▼
                 ┌──────────────────┐
                 │    Cloudflare     │  DNS + proxy/CDN in front of the domain
                 └────────┬─────────┘
                          │
        ══════════════════▼══════════════════════════════════
        ONE ECS SERVER (ARM64) — everything below is this box
        ══════════════════════════════════════════════════════
                 ┌──────────────────┐
                 │      Nginx        │  Terminates HTTPS, forwards to:
                 │   (ports 80/443)  │
                 └────────┬─────────┘
                          │
          ┌───────────────┼───────────────────────┐
          ▼               ▼                       ▼
   :3000 sqcm-prod   :3003 marketing        :3002 hr-backend
                       │
              ┌────────┴─────────────────────────────┐
              │ PM2 (process manager)                 │
              │  ├─ marketing         (Next.js web)   │
              │  └─ marketing-worker  (BullMQ jobs)   │
              └────────┬──────────────┬──────────────┘
                       ▼              ▼
              MongoDB (Docker)   Redis (queues)
`

const FIXTURE_B = `            +-------------+        +--------------+
   users -->|  Cloudflare | -----> |    Nginx     |
            +-------------+        +------+-------+
                                          |
                              +-----------+-----------+
                              v                       v
                        +-----------+           +-----------+
                        |  Next.js  |           |  Worker   |
                        +-----------+           +-----------+
`

const FIXTURE_C = `src/
├── markdown/
│   ├── MarkdownRenderer.tsx
│   └── components/
│       ├── Mermaid.tsx
│       └── AsciiDiagram.tsx
└── styles/
    └── document.css
`

const FIXTURE_D = `┌────────────────────┐      ┌────────────────────┐
│  ✅ النشر التلقائي │ ───► │  📦 Object Storage │
└────────────────────┘      └────────────────────┘
`

// —— Negative fixtures ————————————————————————————————————————————————

const NEGATIVE_JS = `const add = (a, b) => a + b
const ids = items.map((item) => item.id)
const bigger = list.filter((x) => x > 2)
bigger.forEach((x) => log(x))
const gte = (a, b) => a >= b
const pipe = (f, g) => (x) => g(f(x))
`

const NEGATIVE_YAML = `services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
  worker:
    image: app-worker
    depends_on:
      - redis
`

const NEGATIVE_DIFF = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,6 +1,7 @@
-const port = 3000
+const port = Number(process.env.PORT)
+const host = '0.0.0.0'
 const app = express()
-app.listen(port)
+app.listen(port, host)
`

const NEGATIVE_TABLE = `| Feature   | Status | Owner   |
| --------- | ------ | ------- |
| Login     | Done   | Aya     |
| Billing   | WIP    | Omar    |
| Exports   | Todo   | Lina    |
`

describe('isAsciiDiagram', () => {
  it('detects Unicode box-drawing diagrams (fixture A)', () => {
    expect(isAsciiDiagram(FIXTURE_A)).toBe(true)
  })

  it('detects classic ASCII diagrams (fixture B)', () => {
    expect(isAsciiDiagram(FIXTURE_B)).toBe(true)
  })

  it('detects tree listings (fixture C)', () => {
    expect(isAsciiDiagram(FIXTURE_C)).toBe(true)
  })

  it('detects diagrams with wide characters (fixture D)', () => {
    expect(isAsciiDiagram(FIXTURE_D)).toBe(true)
  })

  it('ignores code with fat arrows', () => {
    expect(isAsciiDiagram(NEGATIVE_JS)).toBe(false)
  })

  it('ignores YAML', () => {
    expect(isAsciiDiagram(NEGATIVE_YAML)).toBe(false)
  })

  it('ignores diffs', () => {
    expect(isAsciiDiagram(NEGATIVE_DIFF)).toBe(false)
  })

  it('ignores GFM tables', () => {
    expect(isAsciiDiagram(NEGATIVE_TABLE)).toBe(false)
  })

  it('ignores single lines and empty blocks', () => {
    expect(isAsciiDiagram('')).toBe(false)
    expect(isAsciiDiagram('┌──────────────────────────────┐')).toBe(false)
  })

  it('needs the signals spread across at least two lines', () => {
    expect(isAsciiDiagram('┌┬┬┬┬┬┬┬┬┐\nplain prose here')).toBe(false)
  })
})

describe('language routing sets', () => {
  it('recognises all three explicit aliases', () => {
    expect(ASCII_DIAGRAM_LANGUAGES.has('ascii')).toBe(true)
    expect(ASCII_DIAGRAM_LANGUAGES.has('diagram')).toBe(true)
    expect(ASCII_DIAGRAM_LANGUAGES.has('ascii-art')).toBe(true)
    expect(ASCII_DIAGRAM_LANGUAGES.has('js')).toBe(false)
  })

  it('recognises the plain-text escape hatch', () => {
    expect(PLAIN_TEXT_LANGUAGES.has('text')).toBe(true)
    expect(PLAIN_TEXT_LANGUAGES.has('txt')).toBe(true)
    expect(PLAIN_TEXT_LANGUAGES.has('plain')).toBe(true)
  })

  it('escape hatch beats the heuristic (fixture A under ```text)', () => {
    // The renderer never calls the heuristic for tagged blocks; assert the
    // routing contract: 'text' is plain, not a diagram alias.
    expect(PLAIN_TEXT_LANGUAGES.has('text')).toBe(true)
    expect(ASCII_DIAGRAM_LANGUAGES.has('text')).toBe(false)
  })
})

describe('codePointWidth', () => {
  it('treats box drawing and arrows as single width', () => {
    expect(codePointWidth('│'.codePointAt(0) ?? 0)).toBe(1)
    expect(codePointWidth('→'.codePointAt(0) ?? 0)).toBe(1)
    expect(codePointWidth('A'.codePointAt(0) ?? 0)).toBe(1)
    expect(codePointWidth('ب'.codePointAt(0) ?? 0)).toBe(1)
  })

  it('treats CJK, Hangul, and fullwidth as double width', () => {
    expect(codePointWidth('漢'.codePointAt(0) ?? 0)).toBe(2)
    expect(codePointWidth('한'.codePointAt(0) ?? 0)).toBe(2)
    expect(codePointWidth('Ａ'.codePointAt(0) ?? 0)).toBe(2)
  })

  it('treats emoji as double width', () => {
    expect(codePointWidth('✅'.codePointAt(0) ?? 0)).toBe(2)
    expect(codePointWidth('📦'.codePointAt(0) ?? 0)).toBe(2)
  })

  it('treats joiners and variation selectors as zero width', () => {
    expect(codePointWidth(0xfe0f)).toBe(0)
    expect(codePointWidth(0x200d)).toBe(0)
  })
})

describe('maxVisualColumns', () => {
  it('counts plain monospace columns', () => {
    expect(maxVisualColumns('abc\nabcdef\nab')).toBe(6)
  })

  it('expands tabs to the next tab stop', () => {
    expect(maxVisualColumns('\tx')).toBe(5)
    expect(maxVisualColumns('ab\tx', 4)).toBe(5)
  })

  it('counts wide characters as two columns', () => {
    expect(maxVisualColumns('✅ok')).toBe(4)
    expect(maxVisualColumns('漢字')).toBe(4)
  })

  it('is stable for fixture D box alignment math', () => {
    const lines = FIXTURE_D.replace(/\n+$/, '').split('\n')
    expect(maxVisualColumns(lines[0])).toBeGreaterThan(40)
  })
})

describe('diagramRowCount', () => {
  it('counts rendered rows without trailing newlines', () => {
    expect(diagramRowCount('a\nb\nc\n')).toBe(3)
    expect(diagramRowCount('a')).toBe(1)
    expect(diagramRowCount('')).toBe(1)
  })
})

describe('parseFenceTitle', () => {
  it('parses double-quoted titles', () => {
    expect(parseFenceTitle('title="Server layers"')).toBe('Server layers')
  })

  it('parses single-quoted titles', () => {
    expect(parseFenceTitle("title='Project layout'")).toBe('Project layout')
  })

  it('ignores other meta and surrounding noise', () => {
    expect(parseFenceTitle('foo=1 title="Caption" bar')).toBe('Caption')
    expect(parseFenceTitle('subtitle="nope"')).toBeUndefined()
    expect(parseFenceTitle('title=""')).toBeUndefined()
    expect(parseFenceTitle(undefined)).toBeUndefined()
    expect(parseFenceTitle('')).toBeUndefined()
  })
})
