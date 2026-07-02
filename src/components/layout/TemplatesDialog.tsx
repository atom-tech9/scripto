import { Dialog } from '@/components/ui/Dialog'
import { TEMPLATES, type DocumentTemplate } from '@/data/templates'
import { useLanguage } from '@/i18n'

interface TemplatesDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (template: DocumentTemplate) => void
}

export function TemplatesDialog({ open, onClose, onSelect }: TemplatesDialogProps) {
  const { t } = useLanguage()

  const SECTIONS = [
    {
      heading: t('templates.section.documents'),
      items: TEMPLATES.filter((tpl) => tpl.category !== 'diagram'),
    },
    {
      heading: t('templates.section.diagrams'),
      items: TEMPLATES.filter((tpl) => tpl.category === 'diagram'),
    },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('dialog.templates.title')}
      description={t('dialog.templates.description')}
      size="lg"
    >
      <div className="space-y-5">
        {SECTIONS.map(({ heading, items }) =>
          items.length === 0 ? null : (
            <section key={heading}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {heading}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      onSelect(template)
                      onClose()
                    }}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-start transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <span className="text-2xl">{template.emoji}</span>
                    <div>
                      <div className="font-medium text-foreground group-hover:text-primary">
                        {template.nameKey ? t(template.nameKey) : template.name}
                      </div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {template.descKey ? t(template.descKey) : template.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </Dialog>
  )
}
