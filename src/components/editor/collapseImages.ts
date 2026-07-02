import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'

/**
 * Collapses long base64 image data URLs in the editor into a compact, atomic
 * "🖼 image" chip. The underlying Markdown text is untouched (so it still
 * renders and exports) — only the on-screen display is shortened, keeping the
 * source readable and easy to edit around.
 */

class ImageChipWidget extends WidgetType {
  eq(): boolean {
    return true
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-data-image'
    span.textContent = '🖼 image'
    span.title = 'Embedded image (collapsed) — press Backspace to remove'
    return span
  }

  ignoreEvent(): boolean {
    return false
  }
}

const matcher = new MatchDecorator({
  // Match a data: image URL up to the closing paren / whitespace.
  regexp: /data:image\/[^\s)]+/g,
  decoration: () => Decoration.replace({ widget: new ImageChipWidget() }),
})

export const collapseImages = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = matcher.createDeco(view)
    }

    update(update: ViewUpdate) {
      this.decorations = matcher.updateDeco(update, this.decorations)
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
    // Treat each collapsed URL as a single atomic unit for cursor/selection.
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
  },
)
