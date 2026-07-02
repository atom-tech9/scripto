import { useState } from 'react'
import { toast } from 'sonner'
import { Github, Loader2 } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/Field'
import { useLanguage } from '@/i18n'
import { fetchReadme, parseRepo } from '@/io/github'
import { getErrorMessage } from '@/lib/logger'

interface GithubDialogProps {
  open: boolean
  onClose: () => void
  /** Create a new document from the fetched README. */
  onImport: (markdown: string, name: string) => void
}

export function GithubDialog({ open, onClose, onImport }: GithubDialogProps) {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setUrl('')
    setError(null)
    setLoading(false)
  }

  const close = () => {
    if (loading) return
    reset()
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const ref = parseRepo(url)
    if (!ref) {
      setError(t('dialog.github.invalidUrl'))
      return
    }
    setLoading(true)
    try {
      const { markdown, name } = await fetchReadme(ref.owner, ref.repo)
      onImport(markdown, name)
      toast.success(`${t('dialog.github.importedFrom')} ${ref.owner}/${ref.repo}`)
      reset()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t('action.importGithub')}
      description={t('dialog.github.description')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={loading}>
            {t('dialog.github.cancel')}
          </Button>
          <Button variant="primary" form="github-import-form" type="submit" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Github size={15} />}
            {loading ? t('dialog.github.importing') : t('action.import')}
          </Button>
        </>
      }
    >
      <form id="github-import-form" onSubmit={submit} className="space-y-3">
        <Field label={t('dialog.github.repository')} hint={t('dialog.github.publicOnly')}>
          <TextInput
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError(null)
            }}
            placeholder={t('dialog.github.urlPlaceholder')}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t('dialog.github.rateNote')}
        </p>
      </form>
    </Dialog>
  )
}
