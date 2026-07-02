import { Lightbulb, X } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useLanguage } from '@/i18n'

interface SimpleHintBarProps {
  /** Opens the formatting help guide from the inline link. */
  onOpenFormattingHelp: () => void
}

/** Dismissible first-run coach shown in Simple mode. */
export function SimpleHintBar({ onOpenFormattingHelp }: SimpleHintBarProps) {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useLocalStorage('scripto:hint-dismissed', false)

  if (dismissed) return null

  return (
    <div className="flex items-center gap-2.5 border-b border-border bg-primary/5 px-3 py-2 text-sm text-foreground">
      <Lightbulb size={16} className="shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 leading-snug text-muted-foreground">{t('hint.simpleCoach')}</p>
      <button
        type="button"
        onClick={onOpenFormattingHelp}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
      >
        {t('hint.formattingHelp')}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('hint.dismiss')}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={15} />
      </button>
    </div>
  )
}
