import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Field, Segmented, Select, Slider, Switch, TextArea, TextInput } from '@/components/ui/Field'
import { MARGIN_PRESETS } from '@/lib/constants'
import { DOCUMENT_PRESETS } from '@/data/presets'
import { SKIN_OPTIONS } from '@/data/skins'
import { useLanguage } from '@/i18n'
import { useMode } from '@/mode'
import type { TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type {
  CodeTheme,
  CoverStyle,
  DocumentFont,
  DocumentSkin,
  MarginPreset,
  Orientation,
  PaperSize,
  PdfConfig,
  TableStyle,
  TextDirection,
} from '@/types'

interface ConfigPanelProps {
  config: PdfConfig
  onChange: (patch: Partial<PdfConfig>) => void
  onApplyPreset: (presetId: string) => void
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-start"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <ChevronDown
          size={15}
          className={cn('text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="space-y-4 px-4 pb-5">{children}</div>}
    </section>
  )
}

const PAPER_OPTIONS: PaperSize[] = ['a4', 'letter', 'legal', 'a3', 'a5', 'custom']
const FONT_OPTIONS: Array<{ value: DocumentFont; labelKey: TranslationKey }> = [
  { value: 'serif', labelKey: 'config.font.serif' },
  { value: 'lora', labelKey: 'config.font.lora' },
  { value: 'sans', labelKey: 'config.font.sans' },
  { value: 'system', labelKey: 'config.font.system' },
  { value: 'arabic', labelKey: 'config.font.arabic' },
]
const COVER_STYLE_OPTIONS: Array<{ value: CoverStyle; labelKey: TranslationKey }> = [
  { value: 'minimal', labelKey: 'config.coverStyle.minimal' },
  { value: 'banner', labelKey: 'config.coverStyle.banner' },
  { value: 'centered', labelKey: 'config.coverStyle.centered' },
]
const CODE_OPTIONS: Array<{ value: CodeTheme; labelKey: TranslationKey }> = [
  { value: 'github-dark', labelKey: 'config.code.githubDark' },
  { value: 'github-light', labelKey: 'config.code.githubLight' },
  { value: 'dracula', labelKey: 'config.code.dracula' },
  { value: 'nord', labelKey: 'config.code.nord' },
]
const PAPER_LABEL_KEYS: Record<PaperSize, TranslationKey> = {
  a4: 'config.paper.a4',
  letter: 'config.paper.letter',
  legal: 'config.paper.legal',
  a3: 'config.paper.a3',
  a5: 'config.paper.a5',
  custom: 'config.paper.custom',
}
const MARGIN_SIDE_KEYS: Record<'top' | 'right' | 'bottom' | 'left', TranslationKey> = {
  top: 'config.margin.top',
  right: 'config.margin.right',
  bottom: 'config.margin.bottom',
  left: 'config.margin.left',
}

const ACCENT_SWATCHES = [
  '#6366f1',
  '#2563eb',
  '#0ea5e9',
  '#0d9488',
  '#16a34a',
  '#ea580c',
  '#dc2626',
  '#db2777',
  '#9333ea',
  '#334155',
]

export function ConfigPanel({ config, onChange, onApplyPreset }: ConfigPanelProps) {
  const { t } = useLanguage()
  const { isSimple } = useMode()

  const setMargin = (key: keyof PdfConfig['margins'], value: number) =>
    onChange({ marginPreset: 'custom', margins: { ...config.margins, [key]: value } })

  const setMeta = (key: keyof PdfConfig['meta'], value: string) =>
    onChange({ meta: { ...config.meta, [key]: value } })

  const applyMarginPreset = (preset: MarginPreset) => {
    if (preset === 'custom') return onChange({ marginPreset: 'custom' })
    onChange({ marginPreset: preset, margins: MARGIN_PRESETS[preset] })
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <Section title={t('config.section.documentTheme')}>
        <div className="grid grid-cols-2 gap-2">
          {DOCUMENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              title={t(preset.descKey)}
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-start transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="text-sm font-medium text-foreground">{t(preset.nameKey)}</div>
              <div className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                {t(preset.descKey)}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('config.section.page')}>
        <Field label={t('config.field.paperSize')} htmlFor="paper">
          <Select
            id="paper"
            value={config.paperSize}
            onChange={(e) => onChange({ paperSize: e.target.value as PaperSize })}
          >
            {PAPER_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {t(PAPER_LABEL_KEYS[p])}
              </option>
            ))}
          </Select>
        </Field>

        {config.paperSize === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('config.field.width')}>
              <TextInput
                type="number"
                value={config.customSize.width}
                onChange={(e) =>
                  onChange({ customSize: { ...config.customSize, width: Number(e.target.value) } })
                }
              />
            </Field>
            <Field label={t('config.field.height')}>
              <TextInput
                type="number"
                value={config.customSize.height}
                onChange={(e) =>
                  onChange({ customSize: { ...config.customSize, height: Number(e.target.value) } })
                }
              />
            </Field>
          </div>
        )}

        <Field label={t('config.field.orientation')}>
          <Segmented<Orientation>
            value={config.orientation}
            onChange={(orientation) => onChange({ orientation })}
            className="w-full"
            options={[
              { value: 'portrait', label: t('config.orientation.portrait') },
              { value: 'landscape', label: t('config.orientation.landscape') },
            ]}
          />
        </Field>

        <Field label={t('config.field.margins')}>
          <Segmented<MarginPreset>
            value={config.marginPreset}
            onChange={applyMarginPreset}
            size="sm"
            className="w-full"
            options={[
              { value: 'narrow', label: t('config.margin.narrow') },
              { value: 'normal', label: t('config.margin.normal') },
              { value: 'wide', label: t('config.margin.wide') },
              { value: 'custom', label: t('config.margin.custom') },
            ]}
          />
        </Field>

        {config.marginPreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <Field key={side} label={t(MARGIN_SIDE_KEYS[side])}>
                <TextInput
                  type="number"
                  value={config.margins[side]}
                  onChange={(e) => setMargin(side, Number(e.target.value))}
                />
              </Field>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('config.section.typography')}>
        <Field label={t('config.field.bodyFont')} htmlFor="font">
          <Select
            id="font"
            value={config.font}
            onChange={(e) => onChange({ font: e.target.value as DocumentFont })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {t(f.labelKey)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('config.field.fontSize')} hint={`${config.fontSize}pt`}>
          <Slider
            min={8}
            max={16}
            step={0.5}
            value={config.fontSize}
            onChange={(fontSize) => onChange({ fontSize })}
            aria-label={t('config.field.fontSize')}
          />
        </Field>
        <Field label={t('config.field.lineHeight')} hint={config.lineHeight.toFixed(2)}>
          <Slider
            min={1.2}
            max={2.2}
            step={0.05}
            value={config.lineHeight}
            onChange={(lineHeight) => onChange({ lineHeight })}
            aria-label={t('config.field.lineHeight')}
          />
        </Field>
        <Field label={t('config.field.textDirection')} hint={t('config.hint.textDirection')}>
          <Segmented<TextDirection>
            value={config.direction}
            onChange={(direction) => onChange({ direction })}
            size="sm"
            className="w-full"
            options={[
              { value: 'auto', label: t('config.direction.auto') },
              { value: 'ltr', label: t('config.direction.ltr') },
              { value: 'rtl', label: t('config.direction.rtl') },
            ]}
          />
        </Field>
        <Field label={t('config.field.hyphenation')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('config.hint.hyphenation')}</span>
            <Switch
              checked={config.hyphenation}
              onChange={(hyphenation) => onChange({ hyphenation })}
              aria-label={t('config.field.hyphenation')}
            />
          </div>
        </Field>
      </Section>

      <Section title={t('config.section.style')}>
        <Field label={t('config.field.documentSkin')} htmlFor="skin" hint={t('config.hint.documentSkin')}>
          <Select
            id="skin"
            value={config.skin}
            onChange={(e) => onChange({ skin: e.target.value as DocumentSkin })}
          >
            {SKIN_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {t(s.labelKey)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('config.field.codeTheme')} htmlFor="code-theme">
          <Select
            id="code-theme"
            value={config.codeTheme}
            onChange={(e) => onChange({ codeTheme: e.target.value as CodeTheme })}
          >
            {CODE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.labelKey)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('config.field.tableStyle')}>
          <Segmented<TableStyle>
            value={config.tableStyle}
            onChange={(tableStyle) => onChange({ tableStyle })}
            size="sm"
            className="w-full"
            options={[
              { value: 'striped', label: t('config.table.striped') },
              { value: 'lines', label: t('config.table.lines') },
              { value: 'boxed', label: t('config.table.boxed') },
              { value: 'minimal', label: t('config.table.minimal') },
            ]}
          />
        </Field>
        <Field label={t('config.field.accentColor')}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`${t('config.field.accentColor')} ${color}`}
                  onClick={() => onChange({ accentColor: color })}
                  className={cn(
                    'h-6 w-6 rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110',
                    config.accentColor.toLowerCase() === color.toLowerCase()
                      ? 'ring-2 ring-foreground'
                      : 'ring-1 ring-border',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                aria-label={t('config.field.customAccentColor')}
                className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-surface p-1"
              />
              <TextInput
                value={config.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </div>
        </Field>
      </Section>

      <Section title={t('config.section.headerFooter')} defaultOpen={!isSimple}>
        <Field label={t('config.field.pageNumbers')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('config.hint.pageNumbers')}</span>
            <Switch
              checked={config.showPageNumbers}
              onChange={(showPageNumbers) => onChange({ showPageNumbers })}
              aria-label={t('config.field.pageNumbers')}
            />
          </div>
        </Field>
        <Field label={t('config.field.runningHeader')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('config.hint.runningHeader')}</span>
            <Switch
              checked={config.runningHeaderFromH1}
              onChange={(runningHeaderFromH1) => onChange({ runningHeaderFromH1 })}
              aria-label={t('config.field.runningHeader')}
            />
          </div>
        </Field>
        {!config.runningHeaderFromH1 && (
          <Field label={t('config.field.headerText')}>
            <TextInput
              value={config.headerText}
              placeholder={t('config.placeholder.headerText')}
              onChange={(e) => onChange({ headerText: e.target.value })}
            />
          </Field>
        )}
        <Field label={t('config.field.footerText')}>
          <TextInput
            value={config.footerText}
            placeholder={t('config.placeholder.footerText')}
            onChange={(e) => onChange({ footerText: e.target.value })}
          />
        </Field>
        <Field label={t('config.field.attribution')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('config.hint.attribution')}</span>
            <Switch
              checked={config.attribution}
              onChange={(attribution) => onChange({ attribution })}
              aria-label={t('config.field.attribution')}
            />
          </div>
        </Field>
      </Section>

      <Section title={t('config.section.cover')} defaultOpen={false}>
        <Field label={t('config.field.coverPage')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('config.hint.coverPage')}</span>
            <Switch
              checked={config.coverPage}
              onChange={(coverPage) => onChange({ coverPage })}
              aria-label={t('config.field.coverPage')}
            />
          </div>
        </Field>
        {config.coverPage && (
          <>
            <Field label={t('config.field.coverStyle')}>
              <Segmented<CoverStyle>
                value={config.coverStyle}
                onChange={(coverStyle) => onChange({ coverStyle })}
                size="sm"
                className="w-full"
                options={COVER_STYLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
              />
            </Field>
            <Field label={t('config.field.docType')}>
              <TextInput
                value={config.meta.docType}
                placeholder={t('config.placeholder.docType')}
                onChange={(e) => setMeta('docType', e.target.value)}
              />
            </Field>
            <Field label={t('config.field.subtitle')}>
              <TextInput value={config.meta.subtitle} onChange={(e) => setMeta('subtitle', e.target.value)} />
            </Field>
            <Field label={t('config.field.organization')}>
              <TextInput
                value={config.meta.organization}
                onChange={(e) => setMeta('organization', e.target.value)}
              />
            </Field>
            <Field label={t('config.field.coverDate')} hint={t('config.hint.coverDate')}>
              <TextInput
                value={config.meta.date}
                placeholder={t('config.placeholder.coverDate')}
                onChange={(e) => setMeta('date', e.target.value)}
              />
            </Field>
            <Field label={t('config.field.version')}>
              <TextInput
                value={config.meta.version}
                placeholder={t('config.placeholder.version')}
                onChange={(e) => setMeta('version', e.target.value)}
              />
            </Field>
          </>
        )}
      </Section>

      <Section title={t('config.section.structure')} defaultOpen={false}>
        <Field label={t('config.field.tableOfContents')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('config.hint.tableOfContents')}</span>
            <Switch
              checked={config.tableOfContents}
              onChange={(tableOfContents) => onChange({ tableOfContents })}
              aria-label={t('config.field.tableOfContents')}
            />
          </div>
        </Field>
        {config.tableOfContents && (
          <Field label={t('config.field.tocDepth')} hint={`H1–H${config.tocDepth}`}>
            <Slider
              min={1}
              max={6}
              value={config.tocDepth}
              onChange={(tocDepth) => onChange({ tocDepth })}
              aria-label={t('config.field.tocDepth')}
            />
          </Field>
        )}
        <Field label={t('config.field.numberedHeadings')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('config.hint.numberedHeadings')}</span>
            <Switch
              checked={config.numberedHeadings}
              onChange={(numberedHeadings) => onChange({ numberedHeadings })}
              aria-label={t('config.field.numberedHeadings')}
            />
          </div>
        </Field>
      </Section>

      <Section title={t('config.section.watermark')} defaultOpen={false}>
        <Field label={t('config.field.watermarkText')}>
          <TextInput
            value={config.watermarkText}
            placeholder={t('config.placeholder.watermarkText')}
            onChange={(e) => onChange({ watermarkText: e.target.value })}
          />
        </Field>
        {config.watermarkText.trim() !== '' && (
          <Field label={t('config.field.opacity')} hint={`${Math.round(config.watermarkOpacity * 100)}%`}>
            <Slider
              min={0.02}
              max={0.3}
              step={0.01}
              value={config.watermarkOpacity}
              onChange={(watermarkOpacity) => onChange({ watermarkOpacity })}
              aria-label={t('config.field.opacity')}
            />
          </Field>
        )}
      </Section>

      <Section title={t('config.section.advancedCss')} defaultOpen={false}>
        <Field label={t('config.field.customCss')} hint={t('config.hint.customCss')}>
          <TextArea
            value={config.customCss}
            onChange={(e) => onChange({ customCss: e.target.value })}
            placeholder={'.scripto-doc h1 {\n  color: teal;\n}'}
            rows={6}
            spellCheck={false}
            className="font-mono text-xs"
          />
        </Field>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t('config.hint.customCssHelp')}
        </p>
      </Section>

      <Section title={t('config.section.metadata')} defaultOpen={false}>
        <Field label={t('config.field.metaTitle')}>
          <TextInput value={config.meta.title} onChange={(e) => setMeta('title', e.target.value)} />
        </Field>
        <Field label={t('config.field.metaAuthor')}>
          <TextInput value={config.meta.author} onChange={(e) => setMeta('author', e.target.value)} />
        </Field>
        <Field label={t('config.field.metaSubject')}>
          <TextInput value={config.meta.subject} onChange={(e) => setMeta('subject', e.target.value)} />
        </Field>
        <Field label={t('config.field.metaKeywords')}>
          <TextInput
            value={config.meta.keywords}
            placeholder={t('config.placeholder.metaKeywords')}
            onChange={(e) => setMeta('keywords', e.target.value)}
          />
        </Field>
      </Section>
    </div>
  )
}
