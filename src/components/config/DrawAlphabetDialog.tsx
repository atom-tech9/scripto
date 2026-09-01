import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import getStroke from 'perfect-freehand'
import { ChevronLeft, ChevronRight, Eraser, Undo2 } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { useLanguage } from '@/i18n'
import { readRecord, writeRecord } from '@/lib/docStore'
import { ALPHABET, buildFont, drawnCount, type Point, type Stroke } from '@/lib/handwriting/buildFont'
import { addDrawnHand } from '@/lib/handwriting/customHands'

/** Capture square, in CSS pixels. Font units are derived from this, not from it. */
const SIZE = 260
/** Where the writing line sits, matching BASELINE in buildFont. */
const BASELINE_Y = SIZE * 0.75
const X_HEIGHT_Y = SIZE * 0.45
const DRAFT_RECORD = 'handDraft'

interface DrawAlphabetDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

type Drawn = Record<string, Point[][]>

/**
 * Draw an alphabet with a finger, stylus or trackpad; get back a real `.otf`.
 *
 * Strokes are captured as vectors from the first pointer event and outlined by
 * `perfect-freehand`, so there is no raster-tracing step anywhere — the drawn
 * path *is* the glyph contour. Nothing is uploaded and no account is needed.
 */
export function DrawAlphabetDialog({ open, onClose, onCreated }: DrawAlphabetDialogProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [index, setIndex] = useState(0)
  const [drawn, setDrawn] = useState<Drawn>({})
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stroke = useRef<Point[] | null>(null)

  const char = ALPHABET[index]
  const strokes = useMemo(() => drawn[char] ?? [], [drawn, char])

  // A half-finished alphabet is a lot of work to lose to an accidental reload.
  useEffect(() => {
    if (!open) return
    void readRecord<Drawn>(DRAFT_RECORD).then((saved) => {
      if (saved && typeof saved === 'object') setDrawn(saved)
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => void writeRecord(DRAFT_RECORD, drawn), 400)
    return () => window.clearTimeout(timer)
  }, [drawn, open])

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, SIZE, SIZE)

    // Ruled guides, so people write at a consistent size and on the baseline.
    context.strokeStyle = 'rgba(120,130,150,0.35)'
    context.lineWidth = 1
    for (const y of [X_HEIGHT_Y, BASELINE_Y]) {
      context.beginPath()
      context.moveTo(8, y)
      context.lineTo(SIZE - 8, y)
      context.stroke()
    }

    context.fillStyle = '#1f2532'
    const live = stroke.current ? [...strokes, stroke.current] : strokes
    for (const path of live) {
      const outline = getStroke(path.map(([x, y, pressure]) => [x, y, pressure]), {
        size: 16,
        thinning: 0.55,
        smoothing: 0.6,
        streamline: 0.5,
        simulatePressure: true,
      }) as [number, number][]
      if (outline.length < 3) continue
      context.beginPath()
      context.moveTo(outline[0][0], outline[0][1])
      for (const [x, y] of outline.slice(1)) context.lineTo(x, y)
      context.closePath()
      context.fill()
    }
  }, [strokes])

  useEffect(() => {
    if (open) paint()
  }, [open, paint, index])

  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const box = event.currentTarget.getBoundingClientRect()
    return [
      ((event.clientX - box.left) / box.width) * SIZE,
      ((event.clientY - box.top) / box.height) * SIZE,
      event.pressure || 0.5,
    ]
  }

  const commit = useCallback(() => {
    const path = stroke.current
    stroke.current = null
    if (!path || path.length < 2) return
    setDrawn((previous) => ({ ...previous, [char]: [...(previous[char] ?? []), path] }))
  }, [char])

  const done = drawnCount(new Map(Object.entries(drawn) as [string, Stroke[]][]))

  const save = useCallback(async () => {
    if (done === 0) {
      setError(t('hand.draw.empty'))
      return
    }
    setBusy(true)
    setError(null)
    const label = name.trim() || t('hand.draw.namePlaceholder')
    const bytes = buildFont(label, new Map(Object.entries(drawn) as [string, Stroke[]][]), SIZE)
    const result = await addDrawnHand(label, bytes)
    setBusy(false)
    if ('error' in result) {
      setError(t('hand.custom.error.rejected'))
      return
    }
    await writeRecord(DRAFT_RECORD, {})
    setDrawn({})
    onCreated(result.hand.id)
  }, [done, drawn, name, onCreated, t])

  if (!open) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('hand.draw.title')}
      description={t('hand.draw.description')}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('hand.draw.prev')}
            onClick={() => setIndex((i) => (i - 1 + ALPHABET.length) % ALPHABET.length)}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="text-center">
            <div className="text-3xl font-semibold leading-none text-foreground">{char}</div>
            <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
              {done} / {ALPHABET.length} {t('hand.draw.progress')}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('hand.draw.next')}
            onClick={() => setIndex((i) => (i + 1) % ALPHABET.length)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          aria-label={`${t('hand.draw.title')} — ${char}`}
          className="mx-auto block w-full max-w-[260px] touch-none rounded-lg border border-border bg-white"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            stroke.current = [pointAt(event)]
            paint()
          }}
          onPointerMove={(event) => {
            if (!stroke.current) return
            stroke.current = [...stroke.current, pointAt(event)]
            paint()
          }}
          onPointerUp={commit}
          onPointerLeave={commit}
        />

        <p className="text-center text-[11px] text-muted-foreground">{t('hand.draw.guide')}</p>

        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDrawn((p) => ({ ...p, [char]: (p[char] ?? []).slice(0, -1) }))}
          >
            <Undo2 size={14} />
            {t('hand.draw.undo')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setDrawn((p) => ({ ...p, [char]: [] }))}>
            <Eraser size={14} />
            {t('hand.draw.clear')}
          </Button>
        </div>

        <TextInput
          value={name}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          placeholder={t('hand.draw.namePlaceholder')}
          aria-label={t('hand.draw.name')}
        />

        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {t('hand.draw.latinOnly')}
        </p>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <Button onClick={() => void save()} disabled={busy} className="w-full">
          {busy ? t('hand.draw.saving') : t('hand.draw.save')}
        </Button>
      </div>
    </Dialog>
  )
}
