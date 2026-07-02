import { motion } from 'motion/react'
import { FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface EmptyStateProps {
  onUseTemplate: () => void
  onUseSample: () => void
}

export function EmptyState({ onUseTemplate, onUseSample }: EmptyStateProps) {
  const { t } = useLanguage()
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <motion.div
        variants={staggerItem}
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15"
      >
        <span className="absolute inset-0 rounded-2xl bg-primary/10 blur-lg" aria-hidden />
        <FileText size={30} className="relative" />
      </motion.div>
      <motion.div variants={staggerItem} className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t('empty.title')}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t('empty.body')}</p>
      </motion.div>
      <motion.p
        variants={staggerItem}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
      >
        <Sparkles size={13} />
        {t('empty.pasteHook')}
      </motion.p>
      <motion.div variants={staggerItem} className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onUseTemplate}>
          <Sparkles size={15} />
          {t('empty.browseTemplates')}
        </Button>
        <Button variant="outline" size="sm" onClick={onUseSample}>
          {t('empty.loadSample')}
        </Button>
      </motion.div>
    </motion.div>
  )
}
