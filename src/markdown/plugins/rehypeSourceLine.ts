import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

/**
 * Block-level tags worth anchoring for scroll sync. Inline tags are skipped so
 * the preview only carries a manageable set of `data-source-line` anchors.
 */
const BLOCK_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'table',
  'tr',
  'hr',
  'img',
  'figure',
  'dl',
  'dt',
  'dd',
  'section',
  'div',
])

/**
 * Stamps each block element with `data-source-line` (the 1-based Markdown
 * source line it originated from). The scroll-sync hook maps between editor
 * lines and these anchors so the same paragraph stays aligned across panes,
 * regardless of how tall each side renders it.
 *
 * Runs first in the rehype pipeline so positions are still intact (before
 * rehype-raw reserializes raw HTML). The attribute is invisible, has no layout
 * effect, and is dropped from the PDF export clone.
 */
export function rehypeSourceLine() {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element) => {
      const line = node.position?.start?.line
      if (line == null || !BLOCK_TAGS.has(node.tagName)) return
      node.properties = node.properties ?? {}
      if (node.properties['dataSourceLine'] == null) {
        node.properties['dataSourceLine'] = String(line)
      }
    })
  }
}
