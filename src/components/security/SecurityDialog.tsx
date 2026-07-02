import { useState } from 'react'
import { Lock, LockKeyhole, ShieldCheck, ShieldOff } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextInput } from '@/components/ui/Field'
import { useConfirm } from '@/components/ui/Confirm'
import type { AppLockApi } from '@/hooks/useAppLock'

interface SecurityDialogProps {
  open: boolean
  onClose: () => void
  lock: AppLockApi
}

export function SecurityDialog({ open, onClose, lock }: SecurityDialogProps) {
  const { t } = useLanguage()
  const isEnabled = lock.status === 'unlocked'
  const askConfirm = useConfirm()
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [minutes, setMinutes] = useState(lock.autoLockMinutes)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function enable() {
    setError('')
    if (pass.length < 6) return setError(t('security.errorMinLength'))
    if (pass !== confirm) return setError(t('security.errorMismatch'))
    setBusy(true)
    await lock.enable(pass, minutes)
    setBusy(false)
    setPass('')
    setConfirm('')
    onClose()
  }

  async function disable() {
    const ok = await askConfirm({
      title: t('security.disableTitle'),
      description: t('security.disableDescription'),
      confirmLabel: t('security.disableConfirm'),
      destructive: true,
    })
    if (ok) {
      lock.disable()
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('action.security')}
      description={t('security.dialogDescription')}
      size="md"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('security.noticeBefore')} <strong>{t('security.noticeNoServer')}</strong>{' '}
            {t('security.noticeMiddle')} <strong>{t('security.noticeAes')}</strong>{' '}
            {t('security.noticeAfter')}
          </p>
        </div>

        {isEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <LockKeyhole size={16} /> {t('security.active')}
            </div>
            <Field label={t('security.autoLock')}>
              <Select
                value={String(lock.autoLockMinutes)}
                onChange={(e) => lock.setAutoLockMinutes(Number(e.target.value))}
              >
                <option value="0">{t('security.never')}</option>
                <option value="5">{t('security.minutes5')}</option>
                <option value="15">{t('security.minutes15')}</option>
                <option value="30">{t('security.minutes30')}</option>
                <option value="60">{t('security.hour1')}</option>
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button variant="primary" size="md" onClick={() => void lock.lockNow()} className="flex-1">
                <Lock size={15} /> {t('security.lockNow')}
              </Button>
              <Button variant="outline" size="md" onClick={disable} className="flex-1">
                <ShieldOff size={15} /> {t('security.disable')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label={t('security.passphrase')}>
              <TextInput
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={t('security.passphrasePlaceholder')}
              />
            </Field>
            <Field label={t('security.confirmPassphrase')}>
              <TextInput
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('security.confirmPlaceholder')}
              />
            </Field>
            <Field label={t('security.autoLock')}>
              <Select value={String(minutes)} onChange={(e) => setMinutes(Number(e.target.value))}>
                <option value="0">{t('security.never')}</option>
                <option value="5">{t('security.minutes5')}</option>
                <option value="15">{t('security.minutes15')}</option>
                <option value="30">{t('security.minutes30')}</option>
                <option value="60">{t('security.hour1')}</option>
              </Select>
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => void enable()}
              disabled={busy}
            >
              <ShieldCheck size={16} /> {t('security.enable')}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
