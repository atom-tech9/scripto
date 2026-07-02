import { useEffect, useState } from 'react'
import { ListTree } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'
import type { TocEntry } from '@/types'

interface OutlineNavigatorProps {
  /** Re-read the outline whenever this changes (debounced content). */
  content: string
  getDocElement: () => HTMLElement | null
}

/** A live, clickable outline of the document built from rendered headings. */
export function OutlineNavigator({ content, getDocElement }: OutlineNavigatorProps) {
  const [entries, setEntries] = useState<TocEntry[]>([])
  const { t } = useLanguage()

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const doc = getDocElement()
      if (!doc) return
      const headings = Array.from(doc.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'))
      setEntries(
        headings
          .filter((h) => h.id && h.textContent?.trim())
          .map((h) => ({
            id: h.id,
            text: h.textContent?.trim() ?? '',
            depth: Number(h.tagName.substring(1)),
          })),
      )
    })
    return () => window.cancelAnimationFrame(id)
  }, [content, getDocElement])

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <ListTree size={22} className="opacity-50" />
        <p>{t('outline.empty')}</p>
      </div>
    )
  }

  return (
    <nav aria-label={t('outline.aria')} className="scrollbar-thin h-full overflow-y-auto p-2">
      {entries.map((entry, i) => (
        <button
          key={`${entry.id}-${i}`}
          type="button"
          onClick={() => {
            const doc = getDocElement()
            doc
              ?.querySelector(`#${CSS.escape(entry.id)}`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          className={cn(
            'block w-full truncate rounded-md px-2 py-1.5 text-start text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            entry.depth === 1 && 'font-semibold text-foreground',
          )}
          style={{ paddingInlineStart: `${0.5 + (entry.depth - 1) * 0.75}rem` }}
          title={entry.text}
        >
          {entry.text}
        </button>
      ))}
    </nav>
  )
}
