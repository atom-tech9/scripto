import { useEffect, useRef, useState } from 'react'
import { getErrorMessage, logger } from '@/lib/logger'
import { useLanguage } from '@/i18n'

interface MermaidProps {
  code: string
  resolvedTheme: 'light' | 'dark'
  /** Draw the diagram in a sketchy hand to match a handwritten document. */
  handDrawn?: boolean
  /** Keeps the sketch stable across re-renders and re-paginations. */
  handDrawnSeed?: number
}

let mermaidInitialized = false
let idCounter = 0

/**
 * Renders a Mermaid diagram to inline SVG. The diagram library is loaded lazily
 * so it never bloats the initial bundle. Rendered SVG lives in the DOM and is
 * therefore captured verbatim by the PDF export pipeline.
 */
export function Mermaid({
  code,
  resolvedTheme,
  handDrawn = false,
  handDrawnSeed = 1,
}: MermaidProps) {
  const { t } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const id = `mermaid-${(idCounter += 1)}`

    async function render() {
      try {
        setIsLoading(true)
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'Inter, sans-serif',
          flowchart: { curve: 'basis', useMaxWidth: true },
          // Mermaid draws its own sketchy variant via the rough.js it already
          // bundles. Seeded, so the diagram is identical on every re-render and
          // every re-pagination — the same determinism rule the rest of the
          // handwriting engine follows.
          ...(handDrawn ? { look: 'handDrawn' as const, handDrawnSeed } : {}),
        })
        mermaidInitialized = true

        const { svg } = await mermaid.render(id, code.trim())
        if (cancelled) return
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
        setError(null)
      } catch (err) {
        if (cancelled) return
        logger.warn('Mermaid render failed', err)
        setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [code, resolvedTheme, handDrawn, handDrawnSeed])

  useEffect(() => {
    if (!mermaidInitialized) return
  }, [])

  if (error) {
    return (
      <div className="mermaid-error" role="alert">
        <strong>{t('markdown.diagramError')}</strong> {error}
      </div>
    )
  }

  return (
    <figure className="mermaid-figure" aria-busy={isLoading}>
      <div ref={containerRef} />
    </figure>
  )
}
