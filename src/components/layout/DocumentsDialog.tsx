import { useMemo, useRef, useState } from 'react'
import { Copy, Download, FileText, Plus, Search, Trash2, Upload } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { useConfirm } from '@/components/ui/Confirm'
import { useLanguage } from '@/i18n'
import {
  cn,
  countWords,
  downloadTextFile,
  estimateAppStorageBytes,
  formatBytes,
  readFileAsText,
} from '@/lib/utils'
import { getErrorMessage } from '@/lib/logger'
import type { DocumentRecord } from '@/types'

interface DocumentsDialogProps {
  open: boolean
  onClose: () => void
  docs: DocumentRecord[]
  activeId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onImport: (records: DocumentRecord[]) => number
  onNotify: (type: 'success' | 'error', message: string) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DocumentsDialog({
  open,
  onClose,
  docs,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onImport,
  onNotify,
}: DocumentsDialogProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const restoreRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...docs]
      .filter(
        (d) =>
          !q ||
          d.config.meta.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [docs, query])

  function backup() {
    const payload = JSON.stringify({ version: 1, app: 'scripto', docs }, null, 2)
    downloadTextFile('scripto-backup.json', payload, 'application/json')
    onNotify(
      'success',
      `${t('dialog.documents.backedUp')} ${docs.length} ${
        docs.length === 1 ? t('dialog.documents.documentOne') : t('dialog.documents.documentMany')
      }`,
    )
  }

  async function restore(file: File | undefined) {
    if (!file) return
    try {
      const text = await readFileAsText(file)
      const parsed = JSON.parse(text) as { docs?: DocumentRecord[] }
      const count = onImport(Array.isArray(parsed.docs) ? parsed.docs : [])
      if (count > 0) {
        onNotify(
          'success',
          `${t('dialog.documents.restored')} ${count} ${
            count === 1 ? t('dialog.documents.documentOne') : t('dialog.documents.documentMany')
          }`,
        )
        onClose()
      } else {
        onNotify('error', t('dialog.documents.noValidDocs'))
      }
    } catch (error) {
      onNotify('error', getErrorMessage(error))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('action.documents')}
      description={`${docs.length} ${
        docs.length === 1 ? t('dialog.documents.documentOne') : t('dialog.documents.documentMany')
      } · ${formatBytes(estimateAppStorageBytes())} ${t('dialog.documents.used')} · ${t('dialog.documents.storedLocally')}`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={backup}>
              <Download size={15} />
              {t('dialog.documents.backup')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => restoreRef.current?.click()}>
              <Upload size={15} />
              {t('dialog.documents.restore')}
            </Button>
            <input
              ref={restoreRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                void restore(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onCreate()
              onClose()
            }}
          >
            <Plus size={15} />
            {t('action.newDocument')}
          </Button>
        </div>
      }
    >
      {docs.length > 3 && (
        <div className="relative mb-3">
          <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('dialog.documents.searchPlaceholder')}
            className="ps-9"
          />
        </div>
      )}
      <div className="space-y-2">
        {sorted.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('dialog.documents.noMatch')} “{query}”.</p>
        )}
        {sorted.map((doc) => {
          const isActive = doc.id === activeId
          return (
            <div
              key={doc.id}
              className={cn(
                'group flex items-center gap-3 rounded-xl border p-3 transition-all',
                isActive
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-border bg-surface hover:border-primary/40',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(doc.id)
                  onClose()
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-start"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {doc.config.meta.title || t('dialog.documents.untitled')}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {countWords(doc.content).toLocaleString()} {t('status.words')} · {formatDate(doc.updatedAt)}
                    {isActive && ` · ${t('dialog.documents.current')}`}
                  </span>
                </span>
              </button>

              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={t('dialog.documents.duplicate')}
                  onClick={() => onDuplicate(doc.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  aria-label={t('dialog.documents.delete')}
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('dialog.documents.deleteTitle'),
                      description: `“${doc.config.meta.title || t('dialog.documents.untitled')}” ${t('dialog.documents.deleteDescription')}`,
                      confirmLabel: t('dialog.documents.delete'),
                      destructive: true,
                    })
                    if (ok) onDelete(doc.id)
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Dialog>
  )
}
