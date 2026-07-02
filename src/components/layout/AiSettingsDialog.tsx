import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Segmented, Select, Slider, Switch, TextInput } from '@/components/ui/Field'
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_AI_MODELS,
  PROVIDER_LABELS,
  type AiConfig,
  type AiProvider,
  type AiReasoning,
} from '@/lib/ai'

interface AiSettingsDialogProps {
  open: boolean
  onClose: () => void
  config: AiConfig
  onSave: (config: AiConfig) => void
}

const PROVIDERS: AiProvider[] = ['openai', 'anthropic', 'gemini', 'openrouter', 'custom']

export function AiSettingsDialog({ open, onClose, config, onSave }: AiSettingsDialogProps) {
  const { t } = useLanguage()
  // Normalise against defaults so configs saved before new fields existed work.
  const [draft, setDraft] = useState<AiConfig>({ ...DEFAULT_AI_CONFIG, ...config })

  // Re-seed the form from the saved config whenever the dialog opens.
  useEffect(() => {
    if (open) setDraft({ ...DEFAULT_AI_CONFIG, ...config })
  }, [open, config])

  const setProvider = (provider: AiProvider) =>
    setDraft((prev) => ({
      ...prev,
      provider,
      // Offer the provider's default model when the field is empty or still the
      // previous provider's default.
      model:
        !prev.model.trim() || Object.values(DEFAULT_AI_MODELS).includes(prev.model)
          ? DEFAULT_AI_MODELS[provider]
          : prev.model,
    }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...draft,
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim() || DEFAULT_AI_MODELS[draft.provider],
      baseUrl: draft.baseUrl?.trim() ? draft.baseUrl.trim() : undefined,
    })
    onClose()
  }

  const showBaseUrl = draft.provider === 'custom' || draft.provider === 'openai'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('ai.settings.title')}
      description={t('ai.settings.description')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('confirm.cancel')}
          </Button>
          <Button variant="primary" form="ai-settings-form" type="submit">
            {t('ai.settings.save')}
          </Button>
        </>
      }
    >
      <form id="ai-settings-form" onSubmit={submit} className="space-y-4">
        <Field label={t('ai.settings.provider')} htmlFor="ai-provider">
          <Select
            id="ai-provider"
            value={draft.provider}
            onChange={(e) => setProvider(e.target.value as AiProvider)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={t('ai.settings.model')}
          hint={`${t('ai.settings.modelDefault')}: ${DEFAULT_AI_MODELS[draft.provider] || '—'}`}
        >
          <TextInput
            value={draft.model}
            onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
            placeholder={DEFAULT_AI_MODELS[draft.provider] || t('ai.settings.modelPlaceholder')}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </Field>

        <Field label={t('ai.settings.apiKey')}>
          <TextInput
            type="password"
            value={draft.apiKey}
            onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
            placeholder="sk-…"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </Field>

        {showBaseUrl && (
          <Field label={t('ai.settings.baseUrl')} hint={t('ai.settings.optional')}>
            <TextInput
              value={draft.baseUrl ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
              placeholder={
                draft.provider === 'custom' ? 'https://your-endpoint/v1' : 'https://api.openai.com/v1'
              }
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </Field>
        )}

        <Field label={t('ai.settings.reasoning')} hint={t('ai.settings.reasoningHint')}>
          <Segmented<AiReasoning>
            value={draft.reasoning}
            onChange={(reasoning) => setDraft((prev) => ({ ...prev, reasoning }))}
            size="sm"
            className="w-full"
            options={[
              { value: 'default', label: t('ai.settings.reasoning.default') },
              { value: 'low', label: t('ai.settings.reasoning.low') },
              { value: 'medium', label: t('ai.settings.reasoning.medium') },
              { value: 'high', label: t('ai.settings.reasoning.high') },
            ]}
          />
        </Field>

        <Field label={t('ai.settings.temperature')} hint={draft.temperature.toFixed(2)}>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={draft.temperature}
            onChange={(temperature) => setDraft((prev) => ({ ...prev, temperature }))}
            aria-label={t('ai.settings.temperature')}
          />
        </Field>
        <p className="-mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {t('ai.settings.temperatureHelp')}
        </p>

        <Field label={t('ai.settings.autocomplete')} hint={t('ai.settings.autocompleteHint')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('ai.settings.autocompleteDescription')}</span>
            <Switch
              checked={draft.autocomplete ?? false}
              onChange={(autocomplete) => setDraft((prev) => ({ ...prev, autocomplete }))}
              aria-label={t('ai.settings.autocomplete')}
            />
          </div>
        </Field>
        <p className="-mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {t('ai.settings.autocompleteHelpBefore')}{' '}
          <kbd className="rounded bg-muted px-1">Tab</kbd> {t('ai.settings.autocompleteHelpAccept')}{' '}
          <kbd className="rounded bg-muted px-1">Esc</kbd> {t('ai.settings.autocompleteHelpDismiss')}
        </p>

        <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" />
          <p>
            {t('ai.settings.keyNoticeBefore')}{' '}
            <strong>{t('ai.settings.keyNoticeEncrypted')}</strong>.
          </p>
        </div>
      </form>
    </Dialog>
  )
}
