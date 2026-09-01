import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, PenLine, Trash2, Upload } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n'
import type { TranslationKey } from '@/lib/i18n'
import {
  addCustomHand,
  deleteCustomHand,
  listCustomHands,
  MAX_FONT_BYTES,
  type CustomHand,
  type ImportFailure,
} from '@/lib/handwriting/customHands'

interface CustomHandsDialogProps {
  open: boolean
  onClose: () => void
  /** The hand currently in use, so the list can mark it. */
  selected?: string
  onSelect: (id: string) => void
  onDraw: () => void
}

const FAILURE_KEY = {
  'too-large': 'hand.custom.error.tooLarge',
  'not-a-font': 'hand.custom.error.notAFont',
  rejected: 'hand.custom.error.rejected',
  'no-storage': 'hand.custom.error.noStorage',
} as const satisfies Record<ImportFailure, TranslationKey>

/**
 * Manage hands made from the user's own writing — imported from a font file, or
 * drawn in the browser. Nothing here is uploaded; the dialog says so, because
 * "upload your handwriting" is exactly the phrase that makes people hesitate.
 */
export function CustomHandsDialog({
  open,
  onClose,
  selected,
  onSelect,
  onDraw,
}: CustomHandsDialogProps) {
  const { t, lang } = useLanguage()
  const [hands, setHands] = useState<CustomHand[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    void listCustomHands().then(setHands)
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      setBusy(true)
      setError(null)
      const result = await addCustomHand(file.name.replace(/\.[^.]+$/, ''), file)
      setBusy(false)
      if ('error' in result) {
        setError(t(FAILURE_KEY[result.error]))
        return
      }
      refresh()
      onSelect(result.hand.id)
    },
    [refresh, onSelect, t],
  )

  if (!open) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('hand.custom.title')}
      description={t('hand.custom.description')}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload size={14} />
            {t('hand.custom.import')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onDraw}>
            <PenLine size={14} />
            {t('hand.custom.draw')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            className="hidden"
            onChange={(event) => {
              void onFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>

        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {t('hand.custom.privacy')} · {t('hand.custom.limit')} {Math.round(MAX_FONT_BYTES / 1024 / 1024)} MB
        </p>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {hands.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface px-3 py-8 text-center text-sm text-muted-foreground">
            {t('hand.custom.empty')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {hands.map((hand) => (
              <li
                key={hand.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-sm text-foreground"
                    style={{ fontFamily: `'Scripto Hand ${hand.id}', cursive` }}
                  >
                    {hand.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(hand.addedAt).toLocaleDateString(lang)}
                  </div>
                </div>
                {selected === hand.id ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    <Check size={13} />
                    {t('hand.custom.inUse')}
                  </span>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => onSelect(hand.id)}>
                    {t('hand.custom.use')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('hand.custom.delete')}
                  onClick={() => void deleteCustomHand(hand.id).then(refresh)}
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
