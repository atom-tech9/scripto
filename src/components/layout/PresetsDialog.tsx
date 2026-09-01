import { useRef, useState } from 'react'
import { Check, Download, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { useConfirm } from '@/components/ui/Confirm'
import { downloadPresets, parsePresets } from '@/lib/presets'
import { useLanguage } from '@/i18n'
import { PAPER_LABELS } from '@/lib/constants'
import { SKIN_OPTIONS } from '@/data/skins'
import type { ExportPreset, PdfConfig } from '@/types'

interface PresetsDialogProps {
  open: boolean
  onClose: () => void
  presets: ExportPreset[]
  /** The config a new preset is captured from. */
  config: PdfConfig
  onSave: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onApply: (preset: ExportPreset) => void
  onImport: (presets: ExportPreset[]) => void
  onNotify: (type: 'success' | 'error', message: string) => void
}

/** One line of plain English describing what a preset will change. */
function summarize(preset: ExportPreset): string {
  const { paperSize, orientation, skin, fontSize } = preset.config
  const parts: string[] = []
  if (paperSize) parts.push(PAPER_LABELS[paperSize] + (orientation === 'landscape' ? ' ↔' : ''))
  if (skin)
    parts.push(SKIN_OPTIONS.find((option) => option.value === skin)?.label.split(' — ')[0] ?? skin)
  if (fontSize) parts.push(`${fontSize}pt`)
  return parts.join(' · ')
}

/**
 * Manage saved export presets: create one from the current settings, apply,
 * rename, delete, and move them between machines as a `.json` file — the
 * closest thing to a shared house style without a backend.
 */
export function PresetsDialog({
  open,
  onClose,
  presets,
  config,
  onSave,
  onRename,
  onDelete,
  onApply,
  onImport,
  onNotify,
}: PresetsDialogProps) {
  const { t } = useLanguage()
  const confirm = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)
  const [draftName, setDraftName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  if (!open) return null

  const handleSave = () => {
    const name = draftName.trim()
    if (!name) {
      onNotify('error', t('toast.presetNameRequired'))
      return
    }
    onSave(name)
    setDraftName('')
  }

  const handleDelete = async (preset: ExportPreset) => {
    const ok = await confirm({
      title: t('confirm.deletePreset.title'),
      description: `${t('confirm.deletePreset.body')} “${preset.name}”`,
      confirmLabel: t('presets.delete'),
      destructive: true,
    })
    if (ok) onDelete(preset.id)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const imported = parsePresets(await file.text())
    if (imported.length === 0) {
      onNotify('error', t('toast.presetImportFailed'))
      return
    }
    onImport(imported)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('presets.title')}
      description={t('presets.description')}
      size="lg"
    >
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-3 sm:flex-row sm:items-center">
        <TextInput
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          aria-label={t('presets.namePlaceholder')}
          placeholder={t('presets.namePlaceholder')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSave()
          }}
        />
        <Button variant="primary" size="sm" onClick={handleSave} className="shrink-0">
          <Plus size={15} />
          {t('presets.saveCurrent')}
        </Button>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {PAPER_LABELS[config.paperSize]} · {config.skin} · {config.fontSize}pt
      </p>

      <div className="mt-4 space-y-1.5">
        {presets.length === 0 && (
          <p className="rounded-lg border border-border bg-surface px-3 py-6 text-center text-sm text-muted-foreground">
            {t('presets.empty')}
          </p>
        )}

        {presets.map((preset) => {
          const isEditing = editingId === preset.id
          return (
            <div
              key={preset.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
            >
              {isEditing ? (
                <>
                  <div className="min-w-0 flex-1">
                    <TextInput
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      aria-label={t('presets.rename')}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        onRename(preset.id, editingName)
                        setEditingId(null)
                      }}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onRename(preset.id, editingName)
                      setEditingId(null)
                    }}
                  >
                    <Check size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {preset.name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {summarize(preset)}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => onApply(preset)}>
                    {t('presets.apply')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('presets.rename')}
                    onClick={() => {
                      setEditingId(preset.id)
                      setEditingName(preset.name)
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('presets.delete')}
                    onClick={() => void handleDelete(preset)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload size={15} />
          {t('presets.import')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={presets.length === 0}
          onClick={() => downloadPresets(presets)}
        >
          <Download size={15} />
          {t('presets.export')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
    </Dialog>
  )
}
