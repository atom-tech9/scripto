import { useEffect } from 'react'
import type { EditorView } from '@codemirror/view'

interface ScrollSyncOptions {
  /** The CodeMirror editor, once ready. */
  view: EditorView | null
  /** The preview's scrolling element. */
  previewScroll: HTMLElement | null
  /** Returns the rendered document root (holds the `data-source-line` anchors). */
  getPreviewDoc: () => HTMLElement | null
  /** Editor lines before the body starts (front-matter height). */
  bodyLineOffset: number
  /** Master switch — sync only runs in split view when the user enables it. */
  enabled: boolean
}

interface Anchor {
  line: number
  top: number
}

/** Idle window after the last user scroll input before the driver is released. */
const DRIVER_IDLE_MS = 260

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/** Fractional source line at the editor's viewport top (full-document lines). */
function editorTopLine(view: EditorView): number {
  const localY = view.scrollDOM.getBoundingClientRect().top - view.documentTop
  const block = view.lineBlockAtHeight(localY)
  const line = view.state.doc.lineAt(block.from).number
  const frac = block.height > 0 ? (localY - block.top) / block.height : 0
  return line + clamp(frac, 0, 1)
}

/** Scroll the editor so full-document line `target` sits at its viewport top. */
function scrollEditorToLine(view: EditorView, target: number): void {
  const lineNo = clamp(Math.floor(target), 1, view.state.doc.lines)
  const frac = target - lineNo
  const block = view.lineBlockAt(view.state.doc.line(lineNo).from)
  const localY = block.top + frac * block.height
  const screenTop = localY + view.documentTop
  view.scrollDOM.scrollTop += screenTop - view.scrollDOM.getBoundingClientRect().top
}

/** Read the preview's `data-source-line` anchors as screen-space tops, sorted. */
function readAnchors(doc: HTMLElement): Anchor[] {
  const nodes = doc.querySelectorAll<HTMLElement>('[data-source-line]')
  const anchors: Anchor[] = []
  for (const node of nodes) {
    const line = Number(node.getAttribute('data-source-line'))
    if (!Number.isFinite(line)) continue
    anchors.push({ line, top: node.getBoundingClientRect().top })
  }
  anchors.sort((a, b) => a.top - b.top)
  return anchors
}

/** Find the two anchors bracketing a screen Y (or a value between their lines). */
function bracketByTop(anchors: Anchor[], y: number): [Anchor, Anchor] | null {
  if (anchors.length === 0) return null
  if (y <= anchors[0].top) return [anchors[0], anchors[0]]
  const last = anchors[anchors.length - 1]
  if (y >= last.top) return [last, last]
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y >= anchors[i].top && y < anchors[i + 1].top) return [anchors[i], anchors[i + 1]]
  }
  return [last, last]
}

function bracketByLine(anchors: Anchor[], line: number): [Anchor, Anchor] | null {
  if (anchors.length === 0) return null
  if (line <= anchors[0].line) return [anchors[0], anchors[0]]
  const last = anchors[anchors.length - 1]
  if (line >= last.line) return [last, last]
  for (let i = 0; i < anchors.length - 1; i++) {
    if (line >= anchors[i].line && line < anchors[i + 1].line) return [anchors[i], anchors[i + 1]]
  }
  return [last, last]
}

/** Fractional body source line at the preview's viewport top. */
function previewTopLine(scroll: HTMLElement, anchors: Anchor[]): number | null {
  const bracket = bracketByTop(anchors, scroll.getBoundingClientRect().top)
  if (!bracket) return null
  const [a, b] = bracket
  if (a === b || b.top === a.top) return a.line
  const t = (scroll.getBoundingClientRect().top - a.top) / (b.top - a.top)
  return a.line + t * (b.line - a.line)
}

/** Scroll the preview so body source line `target` sits at its viewport top. */
function scrollPreviewToLine(scroll: HTMLElement, anchors: Anchor[], target: number): void {
  const bracket = bracketByLine(anchors, target)
  if (!bracket) return
  const [a, b] = bracket
  const targetTop =
    a === b || b.line === a.line
      ? a.top
      : a.top + ((target - a.line) / (b.line - a.line)) * (b.top - a.top)
  scroll.scrollTop += targetTop - scroll.getBoundingClientRect().top
}

/**
 * Bidirectional scroll sync between the CodeMirror editor and the rendered
 * preview, keyed on Markdown source lines (see rehypeSourceLine). The pane the
 * user is physically scrolling is the "driver"; the other follows. Programmatic
 * follower scrolls never bounce back because only real input (wheel/touch/
 * pointer/keys) claims the driver role.
 */
export function useScrollSync({
  view,
  previewScroll,
  getPreviewDoc,
  bodyLineOffset,
  enabled,
}: ScrollSyncOptions): void {
  useEffect(() => {
    if (!enabled || !view || !previewScroll) return
    const editorScroll = view.scrollDOM

    let driver: 'editor' | 'preview' | null = null
    let idleTimer = 0
    let frame = 0

    const releaseSoon = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        driver = null
      }, DRIVER_IDLE_MS)
    }
    const claim = (who: 'editor' | 'preview') => {
      driver = who
      releaseSoon()
    }

    const syncFromEditor = () => {
      const doc = getPreviewDoc()
      if (!doc) return
      const editorLine = editorTopLine(view)
      const bodyLine = editorLine - bodyLineOffset
      scrollPreviewToLine(previewScroll, readAnchors(doc), bodyLine)
    }
    const syncFromPreview = () => {
      const doc = getPreviewDoc()
      if (!doc) return
      const bodyLine = previewTopLine(previewScroll, readAnchors(doc))
      if (bodyLine == null) return
      scrollEditorToLine(view, bodyLine + bodyLineOffset)
    }

    const onEditorScroll = () => {
      if (driver !== 'editor') return
      releaseSoon()
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        syncFromEditor()
      })
    }
    const onPreviewScroll = () => {
      if (driver !== 'preview') return
      releaseSoon()
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        syncFromPreview()
      })
    }

    const editorInput = () => claim('editor')
    const previewInput = () => claim('preview')
    const inputEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

    for (const type of inputEvents) {
      editorScroll.addEventListener(type, editorInput, { passive: true })
      previewScroll.addEventListener(type, previewInput, { passive: true })
    }
    editorScroll.addEventListener('scroll', onEditorScroll, { passive: true })
    previewScroll.addEventListener('scroll', onPreviewScroll, { passive: true })

    return () => {
      window.clearTimeout(idleTimer)
      if (frame) window.cancelAnimationFrame(frame)
      for (const type of inputEvents) {
        editorScroll.removeEventListener(type, editorInput)
        previewScroll.removeEventListener(type, previewInput)
      }
      editorScroll.removeEventListener('scroll', onEditorScroll)
      previewScroll.removeEventListener('scroll', onPreviewScroll)
    }
  }, [enabled, view, previewScroll, getPreviewDoc, bodyLineOffset])
}
