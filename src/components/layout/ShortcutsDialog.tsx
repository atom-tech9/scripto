import { Dialog } from '@/components/ui/Dialog'
import { useLanguage } from '@/i18n'
import { isMac } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n'

interface ShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

const mod = isMac() ? '⌘' : 'Ctrl'

interface ShortcutGroup {
  title: TranslationKey
  items: Array<[string, TranslationKey]>
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'dialog.shortcuts.general',
    items: [
      [`${mod} K`, 'dialog.shortcuts.commandPalette'],
      [`${mod} S`, 'action.exportPdf'],
      [`${mod} P`, 'action.printPreview'],
      [`${mod} O`, 'dialog.shortcuts.importFile'],
      [`${mod} /`, 'action.shortcuts'],
    ],
  },
  {
    title: 'dialog.shortcuts.formatting',
    items: [
      [`${mod} B`, 'dialog.shortcuts.bold'],
      [`${mod} I`, 'dialog.shortcuts.italic'],
      [`${mod} E`, 'dialog.shortcuts.inlineCode'],
      [`${mod} K`, 'dialog.shortcuts.insertLink'],
      [`${mod} ⇧ X`, 'dialog.shortcuts.strikethrough'],
      [`${mod} ⇧ 8`, 'dialog.shortcuts.bulletList'],
      [`${mod} ⇧ 7`, 'dialog.shortcuts.numberedList'],
      [`${mod} ⇧ .`, 'dialog.shortcuts.blockquote'],
    ],
  },
  {
    title: 'dialog.shortcuts.editor',
    items: [
      [`${mod} F`, 'dialog.shortcuts.find'],
      [`${mod} Z`, 'dialog.shortcuts.undo'],
      [`${mod} ⇧ Z`, 'dialog.shortcuts.redo'],
    ],
  },
]

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const { t } = useLanguage()
  return (
    <Dialog open={open} onClose={onClose} title={t('action.shortcuts')} size="lg">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(group.title)}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map(([keys, label]) => (
                <li key={`${keys}-${label}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{t(label)}</span>
                  <kbd className="whitespace-nowrap rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
