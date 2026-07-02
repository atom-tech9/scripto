import { visit } from 'unist-util-visit'

// Turns container directives (`:::tip … :::`) into callout blocks, on top of
// remark-directive. Kinds: note, info, tip, success, warning, danger (+ aliases).

interface DirectiveNode {
  type: 'containerDirective' | 'leafDirective' | 'textDirective'
  name: string
  attributes?: Record<string, string | null | undefined>
  children: unknown[]
  data?: Record<string, unknown>
}

const ALIASES: Record<string, string> = {
  note: 'note',
  abstract: 'note',
  info: 'info',
  important: 'info',
  tip: 'tip',
  hint: 'tip',
  success: 'success',
  check: 'success',
  done: 'success',
  warning: 'warning',
  caution: 'warning',
  attention: 'warning',
  danger: 'danger',
  error: 'danger',
  bug: 'danger',
}

const ICONS: Record<string, string> = {
  note: '📝',
  info: 'ℹ️',
  tip: '💡',
  success: '✅',
  warning: '⚠️',
  danger: '🛑',
}

const LABELS: Record<string, string> = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
}

function hastDiv(className: string[], children: unknown[], hChildren?: unknown[]) {
  const data: Record<string, unknown> = {
    hName: 'div',
    hProperties: { className },
  }
  if (hChildren) data.hChildren = hChildren
  return { type: 'calloutPart', data, children }
}

export function remarkCallouts() {
  return (tree: unknown): void => {
    visit(tree as never, (node: DirectiveNode) => {
      if (node.type !== 'containerDirective') return

      const kind = ALIASES[node.name]
      if (!kind) return

      const title = node.attributes?.title?.trim() || LABELS[kind]
      const icon = ICONS[kind]
      const originalChildren = node.children

      const iconNode = hastDiv(['callout__icon'], [], [{ type: 'text', value: icon }])
      const titleNode = hastDiv(['callout__title'], [], [{ type: 'text', value: title }])
      const bodyNode = hastDiv(['callout__body'], originalChildren)

      node.data = {
        hName: 'div',
        hProperties: { className: ['callout', `callout--${kind}`] },
      }
      node.children = [iconNode, titleNode, bodyNode] as unknown[]
    })
  }
}
