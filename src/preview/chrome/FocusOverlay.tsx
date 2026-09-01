import { useEffect, useRef, useState } from 'react'

interface FocusOverlayProps {
  /** The rendered document. Only read from — never styled or mutated. */
  docEl: HTMLElement | null
  /** The element the overlay measures against (the page card). */
  frameEl: HTMLElement | null
  enabled: boolean
}

interface Box {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 8

/**
 * Dims everything except the block under the pointer.
 *
 * The dimming is one screen-only element with a huge shadow spread, so nothing
 * inside `.scripto-doc` is restyled — the exported document is untouched. Blocks
 * are located through the `data-source-line` anchors `rehypeSourceLine` already
 * stamps for scroll sync.
 */
export function FocusOverlay({ docEl, frameEl, enabled }: FocusOverlayProps) {
  const [box, setBox] = useState<Box | null>(null)
  const frame = useRef(0)

  useEffect(() => {
    if (!enabled || !docEl || !frameEl) {
      setBox(null)
      return
    }

    const locate = (event: PointerEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      const block = target instanceof Element ? target.closest('[data-source-line]') : null
      if (!block || !docEl.contains(block)) return

      const rect = block.getBoundingClientRect()
      const origin = frameEl.getBoundingClientRect()
      // Divide out any CSS zoom on the ancestor so the box lands in layout px.
      const scale = origin.width / frameEl.offsetWidth || 1
      setBox({
        top: (rect.top - origin.top) / scale - PAD,
        left: (rect.left - origin.left) / scale - PAD,
        width: rect.width / scale + PAD * 2,
        height: rect.height / scale + PAD * 2,
      })
    }

    const onMove = (event: PointerEvent) => {
      if (frame.current) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0
        locate(event)
      })
    }

    docEl.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      docEl.removeEventListener('pointermove', onMove)
      if (frame.current) window.cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [enabled, docEl, frameEl])

  if (!enabled) return null

  return (
    <div className="stage-focus" data-active={box !== null} style={box ?? undefined} aria-hidden />
  )
}
