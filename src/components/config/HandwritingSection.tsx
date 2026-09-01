import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Field, Slider, Switch } from '@/components/ui/Field'
import { HANDS, handsForScript, type HandScript } from '@/lib/handwriting/hands'
import { loadHand } from '@/lib/handwriting/fonts'
import { isRuled } from '@/lib/handwriting/rules'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import type { HandConfig, HandStyle, InkStyle, PdfConfig, Stationery } from '@/types'

interface HandwritingSectionProps {
  config: PdfConfig
  onChange: (patch: Partial<PdfConfig>) => void
  /** Reports a font that could not be fetched, so the caller can say so. */
  onFontError: (family: string) => void
}

const INKS: readonly { value: InkStyle; swatch: string }[] = [
  { value: 'ballpoint-blue', swatch: '#1c3f94' },
  { value: 'ballpoint-black', swatch: '#1b1d22' },
  { value: 'fountain-blue', swatch: '#16307a' },
  { value: 'fountain-black', swatch: '#14161b' },
  { value: 'pencil', swatch: '#4a4f57' },
  { value: 'marker', swatch: '#0f2f5e' },
  { value: 'red-pen', swatch: '#a01b1b' },
  { value: 'gel', swatch: '#0b2e4f' },
  { value: 'chalk-white', swatch: '#f2f4f0' },
  { value: 'sepia', swatch: '#5a3a1e' },
]

const PAPERS: readonly Stationery[] = [
  'blank',
  'ruled-college',
  'ruled-wide',
  'ruled-narrow',
  'legal-pad',
  'cornell',
  'steno',
  'practice-lines',
  'graph',
  'graph-blue',
  'dot-grid',
  'isometric',
  'engineering',
  'index-card',
  'music-staff',
  'parchment',
  'kraft',
]

/**
 * The handwriting controls.
 *
 * Everything below the switch is hidden while handwriting is off, and no font
 * is requested until a hand is actually chosen — a document that never uses the
 * feature must not pay for it.
 */
export function HandwritingSection({ config, onChange, onFontError }: HandwritingSectionProps) {
  const { t, dir } = useLanguage()
  const hand = config.hand
  const enabled = hand.hand !== 'none'
  const [pending, setPending] = useState<HandStyle | null>(null)

  const script: HandScript =
    config.direction === 'rtl' || (config.direction === 'auto' && dir === 'rtl')
      ? 'arabic'
      : 'latin'
  const available = handsForScript(script)
  const isArabic = script === 'arabic'

  const patchHand = useCallback(
    (patch: Partial<HandConfig>) => onChange({ hand: { ...hand, ...patch } }),
    [hand, onChange],
  )

  // The picker shows each hand in its own face, so those faces have to be
  // present. They load only once this section is open and only for the script
  // the document is actually in.
  useEffect(() => {
    if (!enabled) return
    for (const candidate of available) void loadHand(candidate)
  }, [enabled, available])

  /**
   * Never apply a hand before its font can be measured. The fallback flash and
   * the metric jump that follows are the worst thing this feature can do, and
   * if Paged.js measures during that window the PDF paginates against the wrong
   * font entirely.
   */
  const chooseHand = useCallback(
    async (next: HandStyle) => {
      if (next === 'none') {
        patchHand({ hand: 'none' })
        return
      }
      setPending(next)
      const ok = await loadHand(next)
      setPending(null)
      if (!ok) {
        onFontError(HANDS[next as Exclude<HandStyle, 'none'>].family)
        return
      }
      patchHand({ hand: next })
    },
    [patchHand, onFontError],
  )

  const ruled = isRuled(hand.stationery)

  return (
    <div className="space-y-4">
      <Field label={t('hand.enable')}>
        <Switch
          checked={enabled}
          onChange={(on) => void chooseHand(on ? (isArabic ? 'ruqaa' : 'casual') : 'none')}
          aria-label={t('hand.enable')}
        />
      </Field>

      {enabled && (
        <>
          <Field label={t('hand.hand')} hint={t('hand.hint.script')}>
            <div className="grid grid-cols-2 gap-1.5">
              {available.map((candidate) => {
                const descriptor = HANDS[candidate]
                const active = hand.hand === candidate
                return (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => void chooseHand(candidate)}
                    aria-pressed={active}
                    className={cn(
                      'relative overflow-hidden rounded-lg border px-2 py-1.5 text-start transition-colors',
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <span
                      className="block truncate text-[15px] leading-tight text-foreground"
                      style={{ fontFamily: `'${descriptor.family}', ${descriptor.fallback}` }}
                    >
                      {descriptor.sample}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                      {descriptor.family}
                    </span>
                    {pending === candidate && (
                      <Loader2
                        size={12}
                        className="absolute end-1.5 top-1.5 animate-spin text-primary"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label={t('hand.ink')}>
            <div className="flex flex-wrap gap-1.5">
              {INKS.map((ink) => (
                <button
                  key={ink.value}
                  type="button"
                  onClick={() => patchHand({ ink: ink.value })}
                  aria-label={t(`hand.ink.${ink.value}` as 'hand.ink.pencil')}
                  aria-pressed={hand.ink === ink.value}
                  title={t(`hand.ink.${ink.value}` as 'hand.ink.pencil')}
                  className={cn(
                    'h-6 w-6 rounded-full ring-1 ring-border transition-transform',
                    hand.ink === ink.value &&
                      'ring-2 ring-primary ring-offset-2 ring-offset-surface',
                  )}
                  style={{ backgroundColor: ink.swatch }}
                />
              ))}
            </div>
          </Field>

          <Field label={t('hand.paper')} hint={ruled ? t('hand.hint.ruled') : undefined}>
            <div className="grid grid-cols-3 gap-1.5">
              {PAPERS.map((paper) => (
                <button
                  key={paper}
                  type="button"
                  onClick={() => patchHand({ stationery: paper })}
                  aria-pressed={hand.stationery === paper}
                  title={paper}
                  className={cn(
                    'overflow-hidden rounded-md border transition-colors',
                    hand.stationery === paper
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <span
                    aria-hidden
                    className="scripto-doc block h-8 w-full bg-white"
                    data-stationery={paper}
                  />
                  <span className="block truncate px-1 py-0.5 text-[9px] text-muted-foreground">
                    {paper}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <Field label={t('hand.neatness')} hint={hand.neatness.toFixed(2)}>
            <Slider
              value={hand.neatness}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patchHand({ neatness: value })}
              aria-label={t('hand.neatness')}
            />
          </Field>

          {!isArabic && (
            <Field label={t('hand.slant')} hint={hand.slant.toFixed(2)}>
              <Slider
                value={hand.slant}
                min={-1}
                max={1}
                step={0.1}
                onChange={(value) => patchHand({ slant: value })}
                aria-label={t('hand.slant')}
              />
            </Field>
          )}

          <Field label={t('hand.aging')} hint={hand.aging.toFixed(2)}>
            <Slider
              value={hand.aging}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patchHand({ aging: value })}
              aria-label={t('hand.aging')}
            />
          </Field>

          {ruled && (
            <Field label={t('hand.maskRules')} hint={t('hand.hint.maskRules')}>
              <Switch
                checked={hand.maskRules}
                onChange={(on) => patchHand({ maskRules: on })}
                aria-label={t('hand.maskRules')}
              />
            </Field>
          )}

          <Field label={t('hand.drawn')} hint={t('hand.hint.drawn')}>
            <Switch
              checked={hand.drawnElements}
              onChange={(on) => patchHand({ drawnElements: on })}
              aria-label={t('hand.drawn')}
            />
          </Field>
        </>
      )}
    </div>
  )
}
