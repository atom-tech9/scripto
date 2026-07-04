import { useMemo } from 'react'
import { Clock, FileText, Hash, Type } from 'lucide-react'
import { AtomMark } from '@/components/ui/AtomMark'
import { PAPER_LABELS } from '@/lib/constants'
import { countWords, readingTime, stripDataUrls } from '@/lib/utils'
import { useLanguage } from '@/i18n'
import type { PdfConfig } from '@/types'

interface StatusBarProps {
  content: string
  config: PdfConfig
  headingCount: number
  onOpenStats: () => void
}

export function StatusBar({ content, config, headingCount, onOpenStats }: StatusBarProps) {
  const { t } = useLanguage()
  const clean = useMemo(() => stripDataUrls(content), [content])
  const words = countWords(clean)
  const chars = clean.length
  const minutes = readingTime(words)

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-4 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={onOpenStats}
        title={t('statusbar.statsTitle')}
        className="flex items-center gap-4 rounded transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <Type size={12} /> {words.toLocaleString()} {t('status.words')}
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <FileText size={12} /> {chars.toLocaleString()} {t('status.chars')}
        </span>
        <span className="hidden items-center gap-1.5 md:flex">
          <Hash size={12} /> {headingCount} {t('status.headings')}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} /> {minutes} {t('status.readTime')}
        </span>
      </button>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">
          {PAPER_LABELS[config.paperSize]} · {config.orientation}
        </span>
        <span className="tabular-nums">{config.fontSize}pt</span>
        <a
          href="https://atom.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 border-s border-border ps-3 opacity-80 transition-opacity hover:opacity-100 md:flex"
          aria-label={`${t('statusbar.builtBy')} Atom`}
        >
          <span>{t('statusbar.builtBy')}</span>
          <AtomMark className="h-3.5 w-auto" />
        </a>
      </div>
    </footer>
  )
}
