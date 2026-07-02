import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/Field'
import { TEMPLATES, type ResumeDetails } from '@/data/templates'
import { useLanguage } from '@/i18n'

interface ResumeDetailsDialogProps {
  open: boolean
  onClose: () => void
  /** Name of the chosen résumé template, shown in the description. */
  templateName: string
  /** Fill the header block with these details, then load the document. */
  onFill: (details: ResumeDetails) => void
  /** Load the template untouched, leaving placeholders in place. */
  onSkip: () => void
}

const EMPTY: ResumeDetails = {
  name: '',
  title: '',
  location: '',
  email: '',
  phone: '',
  links: '',
}

export function ResumeDetailsDialog({
  open,
  onClose,
  templateName,
  onFill,
  onSkip,
}: ResumeDetailsDialogProps) {
  const { t } = useLanguage()
  const [details, setDetails] = useState<ResumeDetails>(EMPTY)

  // Resolve the chosen template (matched by its English source name) so its
  // localized name can be shown in the description.
  const template = TEMPLATES.find((item) => item.name === templateName)
  const localizedName = template?.nameKey ? t(template.nameKey) : templateName

  // Reset the form each time the dialog opens for a new template.
  useEffect(() => {
    if (open) setDetails(EMPTY)
  }, [open])

  const set = (key: keyof ResumeDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDetails((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onFill(details)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('dialog.resume.title')}
      description={`${t('dialog.resume.descPrefix')}“${localizedName}”${t('dialog.resume.descSuffix')}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onSkip}>
            {t('dialog.resume.useAsIs')}
          </Button>
          <Button variant="primary" form="resume-details-form" type="submit">
            {t('dialog.resume.fill')}
          </Button>
        </>
      }
    >
      <form id="resume-details-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('dialog.resume.fullName')}>
            <TextInput
              value={details.name}
              onChange={set('name')}
              placeholder={t('dialog.resume.fullNamePlaceholder')}
              autoFocus
            />
          </Field>
          <Field label={t('dialog.resume.professionalTitle')}>
            <TextInput
              value={details.title}
              onChange={set('title')}
              placeholder={t('dialog.resume.professionalTitlePlaceholder')}
            />
          </Field>
          <Field label={t('dialog.resume.location')}>
            <TextInput
              value={details.location}
              onChange={set('location')}
              placeholder={t('dialog.resume.locationPlaceholder')}
            />
          </Field>
          <Field label={t('dialog.resume.email')}>
            <TextInput
              type="email"
              value={details.email}
              onChange={set('email')}
              placeholder={t('dialog.resume.emailPlaceholder')}
            />
          </Field>
          <Field label={t('dialog.resume.phone')}>
            <TextInput
              value={details.phone}
              onChange={set('phone')}
              placeholder={t('dialog.resume.phonePlaceholder')}
            />
          </Field>
          <Field label={t('dialog.resume.links')} hint={t('dialog.resume.linksHint')}>
            <TextInput
              value={details.links}
              onChange={set('links')}
              placeholder={t('dialog.resume.linksPlaceholder')}
            />
          </Field>
        </div>
      </form>
    </Dialog>
  )
}
