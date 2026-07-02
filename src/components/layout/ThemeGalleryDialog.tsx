import { memo } from 'react'
import { Check } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { MarkdownRenderer } from '@/markdown/MarkdownRenderer'
import { documentClassName, documentDataAttrs, documentStyleVars } from '@/pdf/documentStyle'
import { SKIN_OPTIONS } from '@/data/skins'
import { DOCUMENT_PRESETS } from '@/data/presets'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import type { DocumentSkin, PdfConfig } from '@/types'

interface ThemeGalleryDialogProps {
  open: boolean
  onClose: () => void
  config: PdfConfig
  onApply: (patch: Partial<PdfConfig>) => void
  onApplyPreset: (presetId: string) => void
}

/** Compact sample document that exercises the main typographic elements. */
const SAMPLE = `# Heading One

A short paragraph with **bold** and a [link](#).

> A blockquote line.

| A | B |
| - | - |
| 1 | 2 |
`

/**
 * A scaled-down, non-interactive live render of the sample document in a given
 * skin. The unscaled content is laid out wider than the frame and shrunk with a
 * CSS transform so every proportion matches the real preview.
 */
const SkinPreview = memo(function SkinPreview({ config }: { config: PdfConfig }) {
  return (
    <div className="pointer-events-none h-40 overflow-hidden rounded-md bg-white">
      <div
        className={documentClassName(config)}
        style={{
          ...documentStyleVars(config),
          width: '222%',
          padding: '14px 18px',
          color: '#111',
          transform: 'scale(0.45)',
          transformOrigin: 'top left',
        }}
        {...documentDataAttrs(config)}
      >
        <MarkdownRenderer content={SAMPLE} resolvedTheme="light" />
      </div>
    </div>
  )
})

export function ThemeGalleryDialog({
  open,
  onClose,
  config,
  onApply,
  onApplyPreset,
}: ThemeGalleryDialogProps) {
  const { t } = useLanguage()

  // Only mount the (live) previews while the dialog is open.
  if (!open) return null

  const applySkin = (skin: DocumentSkin) => {
    onApply({ skin })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('themeGallery.title')}
      description={t('themeGallery.description')}
      size="xl"
    >
      <section aria-label={t('themeGallery.skinsAria')}>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('themeGallery.skins')}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SKIN_OPTIONS.map(({ value, labelKey }) => {
            const active = config.skin === value
            const [name, ...rest] = t(labelKey).split(' — ')
            return (
              <button
                key={value}
                type="button"
                onClick={() => applySkin(value)}
                aria-pressed={active}
                className={cn(
                  'group overflow-hidden rounded-xl border bg-surface text-start transition-all hover:shadow-md',
                  active ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/50',
                )}
              >
                <SkinPreview config={{ ...config, skin: value }} />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{name}</div>
                    {rest.length > 0 && (
                      <div className="truncate text-[11px] text-muted-foreground">{rest.join(' — ')}</div>
                    )}
                  </div>
                  {active && <Check size={15} className="shrink-0 text-primary" />}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-label={t('themeGallery.themesAria')} className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('themeGallery.themes')}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DOCUMENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={t(preset.descKey)}
              onClick={() => {
                onApplyPreset(preset.id)
                onClose()
              }}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-start transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <span
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full ring-1 ring-border"
                style={{ backgroundColor: preset.config.accentColor ?? config.accentColor }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{t(preset.nameKey)}</span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-tight text-muted-foreground">
                  {t(preset.descKey)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </Dialog>
  )
}
