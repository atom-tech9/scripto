import type { EditorView } from '@codemirror/view'

export interface OverlayPoint {
  top: number
  left: number
}

export interface SelectionBox {
  /** Top of the selection, relative to the wrapper. */
  top: number
  /** Bottom of the selection, relative to the wrapper. */
  bottom: number
  /** Left edge of the selection start, relative to the wrapper. */
  left: number
  /** Horizontal centre of the selection's start/end, relative to the wrapper. */
  centerX: number
}

type Direction = 'ltr' | 'rtl'

/** Resolve the active writing direction, defaulting to the document root. */
function resolveDir(dir?: Direction): Direction {
  if (dir) return dir
  return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
}

/**
 * Mirror a wrapper-relative x coordinate under RTL so overlays anchor to the
 * logical position. Browser rects are always physical (left-origin), so we flip
 * around the wrapper width when the writing direction is right-to-left.
 */
function mirrorX(x: number, wrapper: HTMLElement, dir: Direction): number {
  return dir === 'rtl' ? wrapper.clientWidth - x : x
}

/** Convert a document position to coordinates relative to `wrapper`. */
export function pointAt(
  view: EditorView,
  pos: number,
  wrapper: HTMLElement,
  dir?: Direction,
): OverlayPoint | null {
  const coords = view.coordsAtPos(pos)
  if (!coords) return null
  const rect = wrapper.getBoundingClientRect()
  return {
    top: coords.bottom - rect.top,
    left: mirrorX(coords.left - rect.left, wrapper, resolveDir(dir)),
  }
}

/** Bounding box (wrapper-relative) of the current main selection, or null when empty. */
export function selectionBox(
  view: EditorView,
  wrapper: HTMLElement,
  dir?: Direction,
): SelectionBox | null {
  const sel = view.state.selection.main
  if (sel.empty) return null
  const start = view.coordsAtPos(sel.from)
  const end = view.coordsAtPos(sel.to)
  if (!start || !end) return null
  const rect = wrapper.getBoundingClientRect()
  const resolved = resolveDir(dir)
  return {
    top: Math.min(start.top, end.top) - rect.top,
    bottom: Math.max(start.bottom, end.bottom) - rect.top,
    left: mirrorX(start.left - rect.left, wrapper, resolved),
    centerX: mirrorX((start.left + end.left) / 2 - rect.left, wrapper, resolved),
  }
}
