import { visit } from 'unist-util-visit'

// Layout control the author can reach for when the automatic rules aren't
// enough:
//
//   ::page-break            start the next block on a fresh page
//   :::keep-together … :::  never split this run across a page boundary
//   :::landscape … :::      put this run on its own rotated page
//
// The CSS lives in document.css (`.page-break`, `.keep-together`) and
// pageStyles.ts (the named `landscape` page).

interface DirectiveNode {
  type: 'containerDirective' | 'leafDirective' | 'textDirective'
  name: string
  children: unknown[]
  data?: Record<string, unknown>
}

const CONTAINERS: Record<string, string> = {
  'keep-together': 'keep-together',
  landscape: 'page-landscape',
}

export function remarkPageDirectives() {
  return (tree: unknown): void => {
    visit(tree as never, (node: DirectiveNode) => {
      if (node.type === 'leafDirective' && node.name === 'page-break') {
        node.data = {
          hName: 'div',
          hProperties: { className: ['page-break'], 'aria-hidden': 'true' },
          hChildren: [],
        }
        return
      }

      if (node.type !== 'containerDirective') return
      const className = CONTAINERS[node.name]
      if (!className) return

      node.data = { hName: 'section', hProperties: { className: [className] } }
    })
  }
}
