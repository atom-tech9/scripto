import { motion } from 'motion/react'
import { ClipboardPaste, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface PreviewEmptyProps {
  onUseTemplate: () => void
  onUseSample: () => void
}

/**
 * The empty state, rendered on the stage rather than instead of it — a blank
 * sheet on the current ground reads as "your document goes here".
 */
export function PreviewEmpty({ onUseTemplate, onUseSample }: PreviewEmptyProps) {
  const { t } = useLanguage()
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex min-h-[min(60vh,26rem)] flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:py-16"
    >
      <motion.div
        variants={staggerItem}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15 sm:h-16 sm:w-16"
      >
        <span className="absolute inset-0 rounded-2xl bg-primary/10 blur-lg" aria-hidden />
        <FileText size={28} className="relative" />
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-1.5">
        <h2 className="text-base font-semibold text-foreground sm:text-lg">{t('empty.title')}</h2>
        <p className="mx-auto max-w-sm text-pretty text-sm text-muted-foreground">
          {t('empty.body')}
        </p>
      </motion.div>

      <motion.p
        variants={staggerItem}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
      >
        <ClipboardPaste size={13} />
        {t('empty.pasteHook')}
      </motion.p>

      <motion.div variants={staggerItem} className="flex flex-wrap justify-center gap-2">
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
