import { visit } from 'unist-util-visit'

// Adds inline `==highlight==`, `~subscript~`, and `^superscript^`.
// Needs remark-gfm's `singleTilde: false` so `~` is free for subscripts (`~~` stays strikethrough).

interface TextNode {
  type: 'text'
  value: string
}

interface ElementNode {
  type: 'element'
  data: {
    hName: string
    hChildren: TextNode[]
  }
}

type InlineNode = TextNode | ElementNode

interface Parent {
  type: string
  children: InlineNode[]
}

interface Rule {
  readonly pattern: RegExp
  readonly tag: 'mark' | 'sub' | 'sup'
}

const RULES: readonly Rule[] = [
  { pattern: /==(\S(?:.*?\S)?)==/, tag: 'mark' },
  { pattern: /\^(\S(?:.*?\S)?)\^/, tag: 'sup' },
  { pattern: /~(\S(?:.*?\S)?)~/, tag: 'sub' },
]

function makeElement(tag: string, value: string): ElementNode {
  return {
    type: 'element',
    data: { hName: tag, hChildren: [{ type: 'text', value }] },
  }
}

function splitNode(value: string): InlineNode[] | null {
  for (const rule of RULES) {
    const match = rule.pattern.exec(value)
    if (!match || match.index === undefined) continue

    const before = value.slice(0, match.index)
    const after = value.slice(match.index + match[0].length)
    const nodes: InlineNode[] = []

    if (before) nodes.push({ type: 'text', value: before })
    nodes.push(makeElement(rule.tag, match[1]))
    if (after) {
      const rest = splitNode(after)
      if (rest) nodes.push(...rest)
      else nodes.push({ type: 'text', value: after })
    }
    return nodes
  }
  return null
}

export function remarkMarks() {
  return (tree: unknown): void => {
    visit(
      tree as never,
      'text',
      (node: TextNode, index: number | undefined, parent: Parent | undefined) => {
        if (!parent || index === undefined) return
        // Don't process text inside code/math handled elsewhere.
        if (parent.type === 'inlineCode' || parent.type === 'code') return

        const replacement = splitNode(node.value)
        if (replacement) {
          parent.children.splice(index, 1, ...replacement)
          return index + replacement.length
        }
        return undefined
      },
    )
  }
}
