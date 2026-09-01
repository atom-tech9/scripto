import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { TEMPLATES } from '@/data/templates'
import { SKIN_VALUES } from '@/data/skins'
import { parseFrontmatter, applyFrontmatter } from '@/lib/frontmatter'
import { trackEvent } from '@/lib/analytics'
import { useLanguage } from '@/i18n'
import type { DocumentSkin, PdfConfig } from '@/types'

interface UseDeepLinksOptions {
  /** Opens a template as a NEW document so existing work is never clobbered. */
  readonly createDoc: (content: string, name: string) => void
  readonly setConfig: (update: (prev: PdfConfig) => PdfConfig) => void
  readonly markOnboarding: (step: 'template' | 'edit' | 'export') => void
}

/**
 * Deep links from the marketing pages: `/app?template=<id>&skin=<id>`.
 *
 * Both params are validated against the in-app catalogues (an allowlist — an
 * unknown id is ignored, never applied blindly), then consumed from the URL so a
 * reload doesn't re-trigger them.
 */
export function useDeepLinks({ createDoc, setConfig, markOnboarding }: UseDeepLinksOptions): void {
  const { t } = useLanguage()
  const handled = useRef(false)

  // Reads the latest callbacks without letting their identity re-run the
  // effect — this must fire exactly once, on mount.
  const latest = useRef({ createDoc, setConfig, markOnboarding, t })
  latest.current = { createDoc, setConfig, markOnboarding, t }

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    const { createDoc: create, setConfig: setCfg, markOnboarding: mark, t: translate } = latest.current

    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('template')
    const skinId = params.get('skin')
    if (templateId === null && skinId === null) return

    const template = templateId ? TEMPLATES.find((entry) => entry.id === templateId) : undefined
    const skin: DocumentSkin | undefined =
      skinId && (SKIN_VALUES as string[]).includes(skinId) ? (skinId as DocumentSkin) : undefined

    if (template) {
      const name = template.nameKey ? translate(template.nameKey) : template.name
      create(template.content, name)
      const { data } = parseFrontmatter(template.content)
      if (Object.keys(data).length > 0) setCfg((prev) => applyFrontmatter(prev, data))
      toast.success(`${translate('toast.templateLoaded')} “${name}”`)
      trackEvent('Template Used', { template: template.id, source: 'deeplink' })
      mark('template')
    }
    if (skin) {
      setCfg((prev) => ({ ...prev, skin }))
      trackEvent('Skin Applied', { skin, source: 'deeplink' })
      toast.success(translate('toast.skinApplied'))
    }

    params.delete('template')
    params.delete('skin')
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    )
  }, [])
}
