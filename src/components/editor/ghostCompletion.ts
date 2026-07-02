import { Prec, StateEffect, StateField } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'

/**
 * Inline "ghost text" autocomplete: after a short typing pause, fetches a brief
 * AI continuation and shows it dimmed after the cursor. Tab accepts it, Escape or
 * any edit/cursor move dismisses it. Gated by the caller (only added when the
 * user has enabled it) since it issues a request per pause.
 */

export type GhostComplete = (prefix: string, signal: AbortSignal) => Promise<string>

interface Ghost {
  text: string
  pos: number
}

const setGhost = StateEffect.define<Ghost | null>()

class GhostWidget extends WidgetType {
  constructor(readonly text: string) {
    super()
  }
  eq(other: GhostWidget): boolean {
    return other.text === this.text
  }
  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-ghost-text'
    span.textContent = this.text
    return span
  }
}

const ghostField = StateField.define<Ghost | null>({
  create: () => null,
  update(value, tr) {
    let next = value
    for (const effect of tr.effects) if (effect.is(setGhost)) next = effect.value
    // Any document edit invalidates a shown ghost (the accept path clears it in
    // the same transaction, so it never lingers after being applied).
    if (next && tr.docChanged) return null
    // A cursor move away from the ghost anchor also invalidates it.
    if (next && tr.selection && tr.state.selection.main.head !== next.pos) return null
    return next
  },
  provide: (field) =>
    EditorView.decorations.from(field, (ghost): DecorationSet => {
      if (!ghost || !ghost.text) return Decoration.none
      return Decoration.set([
        Decoration.widget({ widget: new GhostWidget(ghost.text), side: 1 }).range(ghost.pos),
      ])
    }),
})

const ghostKeymap = Prec.highest(
  keymap.of([
    {
      key: 'Tab',
      run: (view) => {
        const ghost = view.state.field(ghostField, false)
        if (!ghost || !ghost.text) return false
        view.dispatch({
          changes: { from: ghost.pos, insert: ghost.text },
          selection: { anchor: ghost.pos + ghost.text.length },
          effects: setGhost.of(null),
        })
        return true
      },
    },
    {
      key: 'Escape',
      run: (view) => {
        if (!view.state.field(ghostField, false)) return false
        view.dispatch({ effects: setGhost.of(null) })
        return true
      },
    },
  ]),
)

const ghostTheme = EditorView.baseTheme({
  '.cm-ghost-text': {
    opacity: '0.42',
    fontStyle: 'italic',
  },
})

function driver(complete: GhostComplete, delay: number) {
  return ViewPlugin.fromClass(
    class {
      timer: number | undefined
      controller: AbortController | undefined

      update(update: ViewUpdate) {
        // Re-arm only on user edits; ignore our own ghost effect transactions.
        if (update.docChanged) this.schedule(update.view)
      }

      schedule(view: EditorView) {
        this.cancel()
        this.timer = window.setTimeout(() => void this.fetch(view), delay)
      }

      cancel() {
        if (this.timer !== undefined) window.clearTimeout(this.timer)
        this.timer = undefined
        this.controller?.abort()
        this.controller = undefined
      }

      async fetch(view: EditorView) {
        const sel = view.state.selection.main
        if (!sel.empty) return
        const pos = sel.head
        const line = view.state.doc.lineAt(pos)
        if (pos !== line.to) return // only complete at end of a line
        const prefix = view.state.sliceDoc(Math.max(0, pos - 2000), pos)
        if (prefix.trim().length < 3) return

        this.controller = new AbortController()
        try {
          const text = (await complete(prefix, this.controller.signal)).trim()
          if (!text) return
          // Bail if the cursor moved while we waited.
          if (view.state.selection.main.head !== pos) return
          view.dispatch({ effects: setGhost.of({ text, pos }) })
        } catch {
          /* aborted or failed — silently skip */
        }
      }

      destroy() {
        this.cancel()
      }
    },
  )
}

/** Build the ghost-completion extension wired to a completion function. */
export function ghostCompletion(complete: GhostComplete, delay = 650) {
  return [ghostField, ghostTheme, ghostKeymap, driver(complete, delay)]
}
