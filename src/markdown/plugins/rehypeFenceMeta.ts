import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

/**
 * Copies the fence meta string (```ascii title="…") from `code.data.meta` into
 * a real `data-meta` attribute. Must run BEFORE rehype-raw: hast-util-raw
 * reserializes the whole tree through parse5, which drops `data` fields —
 * attributes survive, so the `pre` component override can still read the meta.
 */
export function rehypeFenceMeta() {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'code') return
      const meta = (node.data as { meta?: unknown } | undefined)?.meta
      if (typeof meta !== 'string' || meta.length === 0) return
      node.properties = node.properties ?? {}
      node.properties['dataMeta'] = meta
    })
  }
}
