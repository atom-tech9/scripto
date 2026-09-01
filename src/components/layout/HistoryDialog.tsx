import { History, RotateCcw } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n'
import type { DocumentSnapshot } from '@/hooks/useDocumentLibrary'

interface HistoryDialogProps {
  open: boolean
  onClose: () => void
  snapshots: DocumentSnapshot[]
  /** The content on screen now, so a version can show what it would change. */
  current: string
  onRestore: (takenAt: number) => void
}

function when(takenAt: number, locale: string): string {
  return new Date(takenAt).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Past versions of the current document, kept locally.
 *
 * Nothing here leaves the browser — this is a safety net for the one mistake
 * local-first software otherwise cannot undo, not a sync feature.
 */
export function HistoryDialog({
  open,
  onClose,
  snapshots,
  current,
  onRestore,
}: HistoryDialogProps) {
  const { t, lang } = useLanguage()
  if (!open) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('history.title')}
      description={t('history.description')}
      size="md"
    >
      {snapshots.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-3 py-8 text-center text-sm text-muted-foreground">
          {t('history.empty')}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {snapshots.map((snapshot) => {
            const delta = snapshot.content.length - current.length
            return (
              <li
                key={snapshot.takenAt}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <History size={15} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {when(snapshot.takenAt, lang)}
                  </div>
                  <div className="text-[11px] tabular-nums text-muted-foreground">
                    {snapshot.content.length.toLocaleString(lang)} {t('history.chars')}
                    {delta !== 0 && (
                      <>
                        {' · '}
                        {delta > 0 ? '+' : ''}
                        {delta.toLocaleString(lang)}
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onRestore(snapshot.takenAt)
                    onClose()
                  }}
                >
                  <RotateCcw size={14} />
                  {t('history.restore')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Dialog>
  )
}
