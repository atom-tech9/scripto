import type { HandStyle } from '@/types'

export type HandScript = 'latin' | 'arabic'

export interface HandDescriptor {
  /** CSS font-family name, as Google Fonts serves it. */
  readonly family: string
  /** The `family=` parameter for the Google Fonts CSS API, or null for `custom`. */
  readonly googleParam: string | null
  /** True when the face carries a `wght` axis we can jitter for pen pressure. */
  readonly variable: boolean
  readonly scripts: readonly HandScript[]
  readonly fallback: string
  /** Sample shown in the picker, in the hand's own script. */
  readonly sample: string
  /**
   * Multiplier on the document's font size. Display hands vary wildly in
   * x-height; without this, switching hands changes the apparent size.
   */
  readonly sizeAdjust: number
}

const CURSIVE = 'cursive'
const ARABIC_FALLBACK = "'Noto Naskh Arabic', 'Amiri', serif"

/**
 * The hands Scripto can write in.
 *
 * Faces load on demand (see `loadHand`), never from the global font URL in
 * `index.html` — that one is preloaded on every visit including the marketing
 * site, and 15 display faces there would wreck LCP for pages that never use them.
 */
export const HANDS: Record<Exclude<HandStyle, 'none'>, HandDescriptor> = {
  casual: {
    family: 'Caveat',
    googleParam: 'Caveat:wght@400..700',
    variable: true,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.25,
  },
  'neat-print': {
    family: 'Patrick Hand',
    googleParam: 'Patrick+Hand',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.1,
  },
  architect: {
    family: 'Architects Daughter',
    googleParam: 'Architects+Daughter',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'THE QUICK BROWN FOX',
    sizeAdjust: 1.05,
  },
  marker: {
    family: 'Gloria Hallelujah',
    googleParam: 'Gloria+Hallelujah',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.0,
  },
  scratchy: {
    family: 'Reenie Beanie',
    googleParam: 'Reenie+Beanie',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.35,
  },
  rushed: {
    family: 'Just Another Hand',
    googleParam: 'Just+Another+Hand',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.5,
  },
  script: {
    family: 'Dancing Script',
    googleParam: 'Dancing+Script:wght@400..700',
    variable: true,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.15,
  },
  copperplate: {
    family: 'Great Vibes',
    googleParam: 'Great+Vibes',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.3,
  },
  monoline: {
    family: 'Sacramento',
    googleParam: 'Sacramento',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.3,
  },
  cursive: {
    family: 'Cedarville Cursive',
    googleParam: 'Cedarville+Cursive',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.3,
  },
  chalk: {
    family: 'Caveat Brush',
    googleParam: 'Caveat+Brush',
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.15,
  },
  ruqaa: {
    family: 'Aref Ruqaa',
    googleParam: 'Aref+Ruqaa:wght@400;700',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.1,
  },
  'naskh-hand': {
    family: 'Lateef',
    googleParam: 'Lateef',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.35,
  },
  diwani: {
    family: 'Mirza',
    googleParam: 'Mirza:wght@400;600',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.25,
  },
  // Classical naskh, the most bookish of the Arabic hands.
  amiri: {
    family: 'Amiri',
    googleParam: 'Amiri:ital,wght@0,400;0,700;1,400',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.2,
  },
  // Naskh with generous counters — the easiest to read at length.
  scheherazade: {
    family: 'Scheherazade New',
    googleParam: 'Scheherazade+New:wght@400;700',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.3,
  },
  // A calligraphic display hand, closer to thuluth.
  katibeh: {
    family: 'Katibeh',
    googleParam: 'Katibeh',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.45,
  },
  // Nastaliq: the sloping hand of Persian and Urdu calligraphy.
  nastaliq: {
    family: 'Noto Nastaliq Urdu',
    googleParam: 'Noto+Nastaliq+Urdu:wght@400;700',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.0,
  },
  // A softer nastaliq, lighter on the page.
  gulzar: {
    family: 'Gulzar',
    googleParam: 'Gulzar',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.15,
  },
  // An everyday informal hand — the Arabic equivalent of neat print.
  harmattan: {
    family: 'Harmattan',
    googleParam: 'Harmattan:wght@400;700',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.3,
  },
  // A bold decorative hand for titles and short pieces.
  rakkas: {
    family: 'Rakkas',
    googleParam: 'Rakkas',
    variable: false,
    scripts: ['arabic'],
    fallback: ARABIC_FALLBACK,
    sample: 'الخط العربي جميل',
    sizeAdjust: 1.25,
  },
  custom: {
    family: 'Scripto Custom Hand',
    googleParam: null,
    variable: false,
    scripts: ['latin'],
    fallback: CURSIVE,
    sample: 'The quick brown fox',
    sizeAdjust: 1.15,
  },
}

export function handDescriptor(hand: HandStyle): HandDescriptor | null {
  return hand === 'none' ? null : (HANDS[hand] ?? null)
}

/** The `font-family` stack for a hand, ready for `--doc-hand-font`. */
export function handFontStack(hand: HandStyle): string | null {
  const descriptor = handDescriptor(hand)
  return descriptor ? `'${descriptor.family}', ${descriptor.fallback}` : null
}

/** Hands that can actually render the given script. */
export function handsForScript(script: HandScript): Exclude<HandStyle, 'none'>[] {
  return (Object.keys(HANDS) as Exclude<HandStyle, 'none'>[]).filter(
    (hand) => HANDS[hand].scripts.includes(script) && hand !== 'custom',
  )
}
