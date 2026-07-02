import { Check, X } from 'lucide-react'
import { useLanguage } from '@/i18n'

export interface OnboardingState {
  dismissed: boolean
  template: boolean
  edit: boolean
  export: boolean
}

export const ONBOARDING_DEFAULT: OnboardingState = {
  dismissed: false,
  template: false,
  edit: false,
  export: false,
}

interface OnboardingChecklistProps {
  state: OnboardingState
  onDismiss: () => void
  onOpenTemplates: () => void
}

/**
 * First-run checklist (template → edit → export). Steps tick themselves off
 * as the user actually does them; state persists in localStorage so the card
 * shows only until completed or dismissed. RTL-safe via logical properties.
 */
export function OnboardingChecklist({ state, onDismiss, onOpenTemplates }: OnboardingChecklistProps) {
  const { t } = useLanguage()
  if (state.dismissed) return null

  const steps = [
    { done: state.template, title: t('onboarding.step.template'), desc: t('onboarding.step.template.desc') },
    { done: state.edit, title: t('onboarding.step.edit'), desc: t('onboarding.step.edit.desc') },
    { done: state.export, title: t('onboarding.step.export'), desc: t('onboarding.step.export.desc') },
  ]
  const allDone = steps.every((step) => step.done)

  return (
    <aside
      className="fixed bottom-10 z-30 w-80 max-w-[calc(100vw-2rem)] animate-pop-in rounded-xl border border-border bg-surface p-4 shadow-xl"
      style={{ insetInlineEnd: '1rem' }}
      aria-label={t('onboarding.title')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{t('onboarding.title')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {allDone ? t('onboarding.done') : t('onboarding.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('onboarding.dismiss')}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <ol className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.title} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                step.done
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-transparent'
              }`}
              style={{ width: '1.125rem', height: '1.125rem' }}
              aria-hidden="true"
            >
              <Check size={11} strokeWidth={3} />
            </span>
            <div className={step.done ? 'opacity-60' : ''}>
              <p className={`text-xs font-medium text-foreground ${step.done ? 'line-through' : ''}`}>
                {step.title}
              </p>
              <p className="text-[11px] leading-snug text-muted-foreground">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {!state.template && !allDone ? (
        <button
          type="button"
          onClick={onOpenTemplates}
          className="mt-3 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('onboarding.openTemplates')}
        </button>
      ) : null}
      {allDone ? (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('onboarding.dismiss')}
        </button>
      ) : null}
    </aside>
  )
}
