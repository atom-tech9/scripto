import { useState } from 'react'
import { motion } from 'motion/react'
import { KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'

interface LockScreenProps {
  onUnlock: (passphrase: string) => Promise<boolean>
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { t } = useLanguage()
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!passphrase || busy) return
    setBusy(true)
    setError(false)
    const ok = await onUnlock(passphrase)
    setBusy(false)
    if (!ok) {
      setError(true)
      setPassphrase('')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock size={26} />
          </div>
          <h1 className="text-lg font-semibold text-foreground">{t('security.lockedTitle')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('security.lockedSubtitle')}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <KeyRound
              size={16}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <TextInput
              type="password"
              autoFocus
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={t('security.passphrase')}
              aria-label={t('security.passphrase')}
              aria-invalid={error}
              className="ps-9"
            />
          </div>
          {error && (
            <p className="text-center text-sm text-destructive">{t('security.incorrectPassphrase')}</p>
          )}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy || !passphrase}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {t('security.unlock')}
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck size={12} />
          {t('security.e2eNotice')}
        </p>
      </motion.div>
    </div>
  )
}
