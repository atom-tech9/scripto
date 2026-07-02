import { TEMPLATES } from '@/data/templates'
import { translate } from '@/lib/i18n'
import type { MarketingLang } from '../types'

/**
 * Emoji cards linking to /templates/:id, resolved from the app's template
 * catalogue so marketing pages never drift from the product.
 */
export function TemplateCards({ ids, lang }: { ids: string[]; lang: MarketingLang }) {
  const entries = ids
    .map((id) => TEMPLATES.find((template) => template.id === id))
    .filter((template): template is (typeof TEMPLATES)[number] => Boolean(template))

  if (entries.length === 0) return null

  return (
    <div className="mk-grid mk-grid-4">
      {entries.map((template) => {
        const name = lang === 'ar' && template.nameKey ? translate('ar', template.nameKey) : template.name
        const description =
          lang === 'ar' && template.descKey ? translate('ar', template.descKey) : template.description
        return (
          <a key={template.id} href={`/templates/${template.id}`} className="mk-card mk-reveal">
            <span className="mk-tpl-emoji" aria-hidden="true">
              {template.emoji}
            </span>
            <h3 className="mk-h3">{name}</h3>
            <p className="mk-muted" style={{ marginBlockStart: '0.375rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {description}
            </p>
          </a>
        )
      })}
    </div>
  )
}
