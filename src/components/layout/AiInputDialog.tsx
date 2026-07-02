import { useEffect, useState } from 'react'
import { useLanguage } from '@/i18n'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, TextArea, TextInput } from '@/components/ui/Field'

export interface AiInputRequest {
  title: string
  description?: string
  label: string
  placeholder?: string
  multiline?: boolean
  submitLabel?: string
  /** Optional preset value to seed the input with. */
  initialValue?: string
}

interface AiInputDialogProps {
  open: boolean
  request: AiInputRequest | null
  onClose: () => void
  onSubmit: (value: string) => void
}

/**
 * A small reusable prompt dialog for AI actions that need free-text input —
 * "Generate from prompt", "Translate…", and "Change tone…". The AI call itself
 * runs after submit (the parent shows progress via a toast).
 */
export function AiInputDialog({ open, request, onClose, onSubmit }: AiInputDialogProps) {
  const { t } = useLanguage()
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue(request?.initialValue ?? '')
  }, [open, request])

  if (!request) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={request.title}
      description={request.description}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('confirm.cancel')}
          </Button>
          <Button variant="primary" form="ai-input-form" type="submit">
            {request.submitLabel ?? t('ai.input.run')}
          </Button>
        </>
      }
    >
      <form id="ai-input-form" onSubmit={submit}>
        <Field label={request.label}>
          {request.multiline ? (
            <TextArea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={request.placeholder}
              rows={5}
              autoFocus
            />
          ) : (
            <TextInput
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={request.placeholder}
              autoFocus
            />
          )}
        </Field>
      </form>
    </Dialog>
  )
}
