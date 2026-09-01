import type { Element, ElementContent, Root } from 'hast'
import { bucketFor } from '@/lib/handwriting/random'

export interface HandwritingOptions {
  /** Stable per-document seed. */
  seed: number
  /** Bucket count: 16 for `word`, 32 for `expressive`. */
  buckets: number
}

/**
 * Elements whose internals must never be touched.
 *
 * Prism has already produced an exact span tree, KaTeX's layout is positionally
 * precise, and Mermaid output is SVG. Wrapping words inside any of them
 * corrupts the rendering.
 */
const SKIP_TAGS = new Set(['pre', 'code', 'svg', 'math', 'style', 'script', 'textarea'])
const SKIP_CLASSES = new Set([
  'katex',
  'katex-display',
  'mermaid-figure',
  'ascii-diagram',
  'hljs',
  'hw',
  'code-block',
])

function classList(node: Element): string[] {
  const value = node.properties?.className
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') return value.split(/\s+/)
  return []
}

function isSkipped(node: Element): boolean {
  if (SKIP_TAGS.has(node.tagName)) return true
  if (node.properties?.['dataCodeChunk'] != null) return true
  return classList(node).some((name) => SKIP_CLASSES.has(name))
}

/**
 * Wrap each word in a `.hw` span carrying a jitter bucket class.
 *
 * Words only — never characters. For Latin, per-character spans destroy kerning
 * and ligatures; for Arabic they are catastrophic, because it is a connected
 * script and splitting a word breaks glyph shaping, leaving disconnected
 * isolated forms that cannot be read.
 *
 * The bucket is a class, not an inline style: sixteen CSS rules defeat the eye
 * just as well as fifty thousand style attributes would, and cost the DOM, the
 * export clone and the paginator nothing.
 *
 * Walks the tree by hand rather than with `unist-util-visit` because skipping
 * has to prune whole subtrees, not just the node it was asked about.
 */
export function rehypeHandwriting(options: HandwritingOptions) {
  const { seed, buckets } = options

  return (tree: Root): void => {
    let wordIndex = 0

    const wrap = (value: string): ElementContent[] => {
      // Split on whitespace, keeping the separators so spacing survives intact.
      const out: ElementContent[] = []
      for (const part of value.split(/(\s+)/)) {
        if (part === '') continue
        if (!part.trim()) {
          out.push({ type: 'text', value: part })
          continue
        }
        out.push({
          type: 'element',
          tagName: 'span',
          properties: { className: ['hw', `hw-${bucketFor(seed, wordIndex++, buckets)}`] },
          children: [{ type: 'text', value: part }],
        })
      }
      return out
    }

    const walk = (parent: Root | Element): void => {
      const next: ElementContent[] = []
      let changed = false

      for (const child of parent.children as ElementContent[]) {
        if (child.type === 'text' && child.value.trim()) {
          next.push(...wrap(child.value))
          changed = true
          continue
        }
        if (child.type === 'element' && !isSkipped(child)) walk(child)
        next.push(child)
      }

      if (changed) parent.children = next
    }

    walk(tree)
  }
}
