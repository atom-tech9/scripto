import { useMemo, type CSSProperties } from 'react'
import { diagramRowCount, maxVisualColumns } from '../asciiDiagram'
import { useLanguage } from '@/i18n'

interface AsciiDiagramProps {
  code: string
  /** Optional caption from the fence meta: ```ascii title="…" */
  title?: string
}

/**
 * Renders an ASCII / box-drawing diagram as a chrome-free figure. The measured
 * column/row counts are emitted as CSS custom properties; document.css (and the
 * PDF page styles) turn them into an auto-fit font-size via container-query
 * units, so the same markup is correct in the preview card and the page box.
 */
export function AsciiDiagram({ code, title }: AsciiDiagramProps) {
  const { t } = useLanguage()
  const text = useMemo(() => code.replace(/\n+$/, ''), [code])
  const style = useMemo(
    () =>
      ({
        '--diagram-cols': String(Math.max(1, maxVisualColumns(text))),
        '--diagram-rows': String(diagramRowCount(text)),
      }) as CSSProperties,
    [text],
  )

  return (
    <figure
      className="ascii-diagram"
      role="img"
      aria-label={title || t('markdown.asciiDiagram')}
      style={style}
    >
      {/* aria-hidden: 500 box-drawing characters are noise to a screen reader;
          the figure's aria-label carries the meaning. Text stays selectable. */}
      <pre aria-hidden="true">{text}</pre>
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  )
}
