import { useState } from 'react'
import {
  CheckCircle2,
  Expand,
  KeyRound,
  Languages,
  Loader2,
  Lock,
  PenLine,
  Plug,
  ScissorsLineDashed,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SpellCheck,
  Trash2,
  Wand2,
  WrapText,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '@/i18n'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  PROVIDER_LABELS,
  isAiConfigured,
  testAiConnection,
  type AiConfig,
  type AiTestResult,
} from '@/lib/ai'
import type { TranslationKey } from '@/lib/i18n'
import type { AiToolbarAction } from '@/components/editor/EditorToolbar'

interface AiDashboardDialogProps {
  open: boolean
  onClose: () => void
  config: AiConfig
  /** True when the passphrase lock is set up (key is encrypted at rest). */
  encryptedAtRest: boolean
  /** True when there's a non-empty editor selection to operate on. */
  hasSelection: boolean
  onRun: (action: AiToolbarAction) => void
  onEditSettings: () => void
  onRemoveKey: () => void
  onOpenSecurity: () => void
}

interface ActionDef {
  action: AiToolbarAction
  labelKey: TranslationKey
  icon: LucideIcon
  /** Selection-based actions are disabled when nothing is selected. */
  needsSelection: boolean
}

const ACTIONS: ActionDef[] = [
  { action: 'improve', labelKey: 'ai.action.improve', icon: Sparkles, needsSelection: true },
  { action: 'grammar', labelKey: 'ai.action.grammar', icon: SpellCheck, needsSelection: true },
  { action: 'concise', labelKey: 'ai.action.concise', icon: ScissorsLineDashed, needsSelection: true },
  { action: 'expand', labelKey: 'ai.action.expand', icon: Expand, needsSelection: true },
  { action: 'summarize', labelKey: 'ai.action.summarize', icon: WrapText, needsSelection: true },
  { action: 'tone', labelKey: 'ai.action.tone', icon: Wand2, needsSelection: true },
  { action: 'translate', labelKey: 'ai.action.translate', icon: Languages, needsSelection: true },
  { action: 'generate', labelKey: 'ai.action.generate', icon: PenLine, needsSelection: false },
]

export function AiDashboardDialog({
  open,
  onClose,
  config,
  encryptedAtRest,
  hasSelection,
  onRun,
  onEditSettings,
  onRemoveKey,
  onOpenSecurity,
}: AiDashboardDialogProps) {
  const { t } = useLanguage()
  const configured = isAiConfigured(config)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<AiTestResult | null>(null)

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testAiConnection(config)
    setTestResult(result)
    setTesting(false)
  }

  const run = (action: AiToolbarAction) => {
    onClose()
    onRun(action)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('action.ai')}
      description={t('ai.dashboard.description')}
      size="lg"
      footer={
        <>
          {configured && (
            <Button variant="ghost" className="me-auto text-destructive" onClick={onRemoveKey}>
              <Trash2 size={15} /> {t('ai.dashboard.removeKey')}
            </Button>
          )}
          <Button variant="outline" onClick={onEditSettings}>
            <KeyRound size={15} /> {configured ? t('ai.dashboard.editSettings') : t('ai.dashboard.addKey')}
          </Button>
          <Button variant="primary" onClick={onClose}>
            {t('ai.dashboard.done')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  configured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500',
                )}
              >
                <Sparkles size={18} />
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {configured ? t('ai.dashboard.ready') : t('ai.dashboard.notSetUp')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {configured
                    ? `${PROVIDER_LABELS[config.provider]} · ${config.model}`
                    : t('ai.dashboard.addKeyPrompt')}
                </div>
              </div>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium',
                configured
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              )}
            >
              {configured ? t('ai.dashboard.active') : t('ai.dashboard.inactive')}
            </span>
          </div>
          {configured && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <KeyRound size={13} />
                  <span className="font-mono tracking-widest">••••••••••••</span>
                  <span>{t('ai.dashboard.keyStored')}</span>
                </span>
                <Button variant="outline" size="sm" onClick={runTest} disabled={testing}>
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
                  {testing ? t('ai.dashboard.testing') : t('ai.dashboard.testConnection')}
                </Button>
              </div>
              {testResult && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs',
                    testResult.ok
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {testResult.ok ? (
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={14} className="mt-0.5 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex gap-2.5 rounded-xl border p-3.5 text-xs leading-relaxed',
            encryptedAtRest
              ? 'border-emerald-500/30 bg-emerald-500/5 text-muted-foreground'
              : 'border-amber-500/30 bg-amber-500/5 text-muted-foreground',
          )}
        >
          {encryptedAtRest ? (
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
          )}
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {encryptedAtRest
                ? t('ai.dashboard.encryptedTitle')
                : t('ai.dashboard.unencryptedTitle')}
            </p>
            <p>
              {t('ai.dashboard.requestsNotice')}{' '}
              {encryptedAtRest
                ? t('ai.dashboard.lockEncrypts')
                : t('ai.dashboard.enableToEncrypt')}
            </p>
            {!encryptedAtRest && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenSecurity()
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
              >
                <Lock size={12} /> {t('ai.dashboard.enableLock')}
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('ai.dashboard.quickActions')}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {hasSelection
                ? t('ai.dashboard.actsOnSelection')
                : t('ai.dashboard.actsOnParagraph')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ACTIONS.map(({ action, labelKey, icon: Icon }) => {
              const label = t(labelKey)
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => run(action)}
                  title={label}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-start text-sm transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <Icon size={15} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
