import { useMemo } from 'react'
import {
  AlignLeft,
  Clock,
  Code2,
  HardDrive,
  Hash,
  Image as ImageIcon,
  Link2,
  Pilcrow,
  Table2,
  Type,
  Quote,
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { useLanguage } from '@/i18n'
import { computeStats } from '@/lib/stats'
import { estimateAppStorageBytes, formatBytes } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsDialogProps {
  open: boolean
  onClose: () => void
  markdown: string
}

const STORAGE_BUDGET = 5 * 1024 * 1024 // ~5 MB typical localStorage quota

export function StatsDialog({ open, onClose, markdown }: StatsDialogProps) {
  const { t } = useLanguage()
  const stats = useMemo(() => computeStats(markdown), [markdown])
  const storageBytes = useMemo(() => (open ? estimateAppStorageBytes() : 0), [open])
  const storagePct = Math.min(100, Math.round((storageBytes / STORAGE_BUDGET) * 100))

  const items: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Type, label: t('dialog.stats.words'), value: stats.words.toLocaleString() },
    { icon: Clock, label: t('dialog.stats.readingTime'), value: `${stats.readingTimeMin} ${t('dialog.stats.minute')}` },
    { icon: AlignLeft, label: t('dialog.stats.characters'), value: stats.characters.toLocaleString() },
    { icon: Pilcrow, label: t('dialog.stats.noSpaces'), value: stats.charactersNoSpaces.toLocaleString() },
    { icon: Quote, label: t('dialog.stats.sentences'), value: stats.sentences.toLocaleString() },
    { icon: AlignLeft, label: t('dialog.stats.paragraphs'), value: stats.paragraphs.toLocaleString() },
    { icon: Hash, label: t('dialog.stats.headings'), value: stats.headings.toLocaleString() },
    { icon: Code2, label: t('dialog.stats.codeBlocks'), value: stats.codeBlocks.toLocaleString() },
    { icon: Link2, label: t('dialog.stats.links'), value: stats.links.toLocaleString() },
    { icon: ImageIcon, label: t('dialog.stats.images'), value: stats.images.toLocaleString() },
    { icon: Table2, label: t('dialog.stats.tables'), value: stats.tables.toLocaleString() },
  ]

  return (
    <Dialog open={open} onClose={onClose} title={t('dialog.stats.title')} size="md">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-primary/40"
          >
            <Icon size={16} className="mb-2 text-primary" />
            <div className="text-xl font-semibold tabular-nums text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <HardDrive size={15} className="text-primary" /> {t('dialog.stats.storageUsed')}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {formatBytes(storageBytes)} <span className="opacity-60">/ ~5 MB</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              storagePct > 85 ? 'bg-destructive' : storagePct > 60 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.max(2, storagePct)}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t('dialog.stats.storageNote')}
        </p>
      </div>
    </Dialog>
  )
}
