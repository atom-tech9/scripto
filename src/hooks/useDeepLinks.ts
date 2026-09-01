import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { TEMPLATES } from '@/data/templates'
import { SKIN_VALUES } from '@/data/skins'
import { parseFrontmatter, applyFrontmatter } from '@/lib/frontmatter'
import { decodeHandRecipe } from '@/lib/handwriting/recipe'
import { loadHand } from '@/lib/handwriting/fonts'
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
 * Deep links from the marketing pages and from shared links:
 * `/app?template=<id>&skin=<id>&hand=<recipe>`.
 *
 * Every param is validated against the in-app catalogues (an allowlist — an
 * unknown value is ignored, never applied blindly), then consumed from the URL
 * so a reload doesn't re-trigger them. `hand` lets someone post their exact
 * handwriting setup and have a stranger land in the editor with it applied.
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
    const {
      createDoc: create,
      setConfig: setCfg,
      markOnboarding: mark,
      t: translate,
    } = latest.current

    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('template')
    const skinId = params.get('skin')
    const handRecipe = params.get('hand')
    if (templateId === null && skinId === null && handRecipe === null) return

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

    if (handRecipe) {
      const patch = decodeHandRecipe(handRecipe)
      const recipeHand = patch?.hand
      if (patch && recipeHand) {
        // Never apply a hand before its face can be measured, or the document
        // renders in the fallback and jumps when the real metrics land.
        void loadHand(recipeHand).then((ok) => {
          if (!ok) return
          setCfg((prev) => ({ ...prev, hand: { ...prev.hand, ...patch } }))
          trackEvent('Skin Applied', { hand: recipeHand, source: 'hand-recipe' })
          toast.success(translate('toast.handApplied'))
        })
      }
    }

    params.delete('template')
    params.delete('skin')
    params.delete('hand')
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    )
  }, [])
}
