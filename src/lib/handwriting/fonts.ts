import { getErrorMessage, logger } from '@/lib/logger'
import { handDescriptor } from './hands'
import type { HandStyle } from '@/types'

const GOOGLE_CSS = 'https://fonts.googleapis.com/css2'
const LINK_ID_PREFIX = 'scripto-hand-'

/** Families whose stylesheet has already been injected this session. */
const requested = new Set<string>()
/** Families confirmed loaded, so a repeat selection is instant. */
const ready = new Set<string>()

/** The Google Fonts stylesheet URL for one hand. */
export function handStylesheetHref(hand: HandStyle): string | null {
  const descriptor = handDescriptor(hand)
  if (!descriptor?.googleParam) return null
  return `${GOOGLE_CSS}?family=${descriptor.googleParam}&display=swap`
}

function injectStylesheet(family: string, href: string): void {
  if (requested.has(family)) return
  requested.add(family)
  const link = document.createElement('link')
  link.id = `${LINK_ID_PREFIX}${family.replace(/\s+/g, '-').toLowerCase()}`
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

/**
 * Load a hand and resolve only once the face can actually be measured.
 *
 * Applying a hand before its font is available is the single worst thing this
 * feature can do: the document renders in the fallback, then jumps when the real
 * metrics arrive. Worse, if Paged.js measures during that window the PDF
 * paginates against the wrong font. Callers must await this before touching the
 * config or opening the print preview.
 *
 * Resolves `false` when the face cannot be loaded — offline, or a blocked CDN —
 * so the caller can say so plainly instead of silently rendering the fallback.
 */
export async function loadHand(hand: HandStyle): Promise<boolean> {
  const descriptor = handDescriptor(hand)
  if (!descriptor) return true
  if (ready.has(descriptor.family)) return true

  // A custom hand is registered directly through the FontFace API elsewhere.
  if (!descriptor.googleParam) {
    return document.fonts.check(`1em '${descriptor.family}'`, descriptor.sample)
  }

  const href = handStylesheetHref(hand)
  if (!href) return false
  injectStylesheet(descriptor.family, href)

  try {
    // The sample is in the hand's own script, which is what forces Google's
    // subsetted @font-face to fetch the right unicode-range.
    const faces = await document.fonts.load(`1em '${descriptor.family}'`, descriptor.sample)
    // `load` resolves with the faces it matched; an empty list means the
    // stylesheet never arrived, which `document.fonts.load` does not treat as
    // an error.
    if (
      faces.length === 0 &&
      !document.fonts.check(`1em '${descriptor.family}'`, descriptor.sample)
    )
      return false
    ready.add(descriptor.family)
    return true
  } catch (error) {
    logger.warn(`Handwriting font "${descriptor.family}" failed to load: ${getErrorMessage(error)}`)
    return false
  }
}

/** True when the hand is already usable, with no network round trip. */
export function isHandReady(hand: HandStyle): boolean {
  const descriptor = handDescriptor(hand)
  if (!descriptor) return true
  if (ready.has(descriptor.family)) return true
  if (typeof document === 'undefined') return false
  const available = document.fonts.check(`1em '${descriptor.family}'`, descriptor.sample)
  if (available) ready.add(descriptor.family)
  return available
}

/**
 * Load any Google-hosted family on demand, by its CSS API parameter.
 *
 * Used for the document body faces beyond the five that ship in the global
 * stylesheet: that URL is preloaded on every visit including the marketing
 * site, so families most documents never use must not be in it.
 */
export async function loadFontFamily(
  family: string,
  googleParam: string | null,
  sample = 'Aa',
): Promise<boolean> {
  if (!googleParam) return true
  if (ready.has(family)) return true
  injectStylesheet(family, `${GOOGLE_CSS}?family=${googleParam}&display=swap`)
  try {
    // Sample text picks the right unicode-range subset; without it an Arabic
    // family loads only its Latin subset.
    await document.fonts.load(`1em '${family}'`, sample)
    if (!document.fonts.check(`1em '${family}'`, sample)) return false
    ready.add(family)
    return true
  } catch (error) {
    logger.warn(`Font "${family}" failed to load: ${getErrorMessage(error)}`)
    return false
  }
}

/** Reset the module caches. Test-only. */
export function resetHandCache(): void {
  requested.clear()
  ready.clear()
}
