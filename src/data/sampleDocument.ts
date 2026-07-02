export const SAMPLE_DOCUMENT = `# Scripto — The Markdown Studio

> A polished writing environment with **pixel-perfect, paginated PDF export**. Everything you see in the preview is exactly what lands in your PDF.

Welcome! This document is a living showcase of every supported feature. Edit anything on the left and watch the preview update instantly. When you're happy, hit **Export PDF**.

## Typography & Inline Formatting

You get **bold**, *italic*, ***bold italic***, ~~strikethrough~~, ==highlighted text==, \`inline code\`, H~2~O subscripts, and E = mc^2^ superscripts. Links are preserved as live hyperlinks in the PDF — visit [the Markdown spec](https://commonmark.org).

Type emoji with shortcodes :rocket: :sparkles: :coffee: — they render as real glyphs.

---

## Callouts & Admonitions

:::note
This is a **note** callout. Use it for neutral, supporting information.
:::

:::tip
**Pro tip:** callouts are written with \`:::tip\` … \`:::\` fenced directives.
:::

:::warning
**Heads up** — warnings draw attention to something the reader should not miss.
:::

:::danger
**Danger** callouts signal critical, irreversible actions.
:::

## Lists

### Task list
- [x] Render GitHub-flavored Markdown
- [x] Paginate with Paged.js
- [ ] Win a design award

### Nested ordered & unordered
1. Prepare the manuscript
   - Draft in Markdown
   - Add diagrams and math
2. Configure the export
   1. Choose paper size
   2. Set margins and fonts
3. Export to PDF

## Tables

| Feature            | Preview | PDF | Notes                          |
| :----------------- | :-----: | :-: | :----------------------------- |
| Repeating headers  |   ✅    | ✅  | Headers repeat across pages    |
| No row splitting   |   ✅    | ✅  | Rows never break mid-cell      |
| Striped rows       |   ✅    | ✅  | Configurable table style       |
| Long content       |   ✅    | ✅  | Cells wrap gracefully          |

## Code Blocks

\`\`\`typescript
import { renderToPdf } from '@/pdf/export'

async function main(): Promise<void> {
  const config = { paperSize: 'a4', margins: 'normal' } as const
  // Syntax highlighting + line numbers are preserved in the PDF.
  await renderToPdf(document.querySelector('#doc')!, config)
}

main().catch(console.error)
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]
\`\`\`

## Math (KaTeX)

Inline math like $e^{i\\pi} + 1 = 0$ flows with the text. Display math is centered:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
$$

$$
f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x - a)^n
$$

## Diagrams (Mermaid)

\`\`\`mermaid
flowchart LR
    A[Markdown] --> B{Parse}
    B --> C[Render Preview]
    B --> D[Paginate]
    D --> E[(PDF)]
    C --> E
\`\`\`

## Blockquotes & Footnotes

> "Typography is the craft of endowing human language with a durable visual form." [^1]

[^1]: Robert Bringhurst, *The Elements of Typographic Style*.

## Definition List

Markdown
: A lightweight markup language for creating formatted text.

Paged.js
: A library that paginates HTML into print-ready pages in the browser.

## Images

![A serene mountain landscape](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80)
*Figure 1 — Captions are rendered from italic text directly beneath an image.*

---

Ready to make it yours? Clear this text and start writing. Happy authoring! :tada:
`
