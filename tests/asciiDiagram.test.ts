import { describe, expect, it } from 'vitest'
import {
  ASCII_DIAGRAM_LANGUAGES,
  codePointWidth,
  diagramRowCount,
  isAsciiDiagram,
  maxVisualColumns,
  parseFenceTitle,
  shouldRenderAsDiagram,
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

describe('shouldRenderAsDiagram (language routing)', () => {
  it('explicit aliases always render as diagrams, whatever the content', () => {
    for (const lang of ['ascii', 'diagram', 'ascii-art', 'asciiart', 'ascii-diagram']) {
      expect(ASCII_DIAGRAM_LANGUAGES.has(lang)).toBe(true)
      expect(shouldRenderAsDiagram(lang, 'just prose')).toBe(true)
    }
  })

  it('untagged fences are heuristic-gated', () => {
    expect(shouldRenderAsDiagram('', FIXTURE_B)).toBe(true)
    expect(shouldRenderAsDiagram('', NEGATIVE_JS)).toBe(false)
  })

  it('AI-style text/txt/plaintext fences are heuristic-gated too', () => {
    for (const lang of ['text', 'txt', 'plaintext', 'TEXT']) {
      expect(shouldRenderAsDiagram(lang, FIXTURE_A)).toBe(true)
      expect(shouldRenderAsDiagram(lang, NEGATIVE_YAML)).toBe(false)
    }
  })

  it('```plain is the hard opt-out, even for box art', () => {
    expect(shouldRenderAsDiagram('plain', FIXTURE_A)).toBe(false)
  })

  it('real languages are never hijacked (fixture B inside ```js)', () => {
    expect(shouldRenderAsDiagram('js', FIXTURE_B)).toBe(false)
    expect(shouldRenderAsDiagram('python', FIXTURE_A)).toBe(false)
    expect(shouldRenderAsDiagram('mermaid', FIXTURE_A)).toBe(false)
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
