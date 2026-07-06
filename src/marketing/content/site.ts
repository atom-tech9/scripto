import type { Localized, MarketingLang } from '../types'

/** Production origin (no trailing slash). */
export const SITE_URL = 'https://md.atom.sa'

export const SITE_NAME = 'Scripto'
export const SITE_NAME_AR = 'سكربتو'

export const GITHUB_URL = 'https://github.com/atom-tech9/scripto'

export const ATOM_URL = 'https://atom.sa'

/** Route (not URL) of the interactive editor. */
export const APP_PATH = '/app'

export const OG_IMAGE_ENDPOINT = '/api/og'

/** Default social image parameters when a page doesn't provide any. */
export const DEFAULT_OG_TITLE = 'Markdown in. Pixel-perfect PDF out.'

export const localePath = (lang: MarketingLang, path: string): string => {
  if (lang === 'en') return path
  return path === '/' ? '/ar' : `/ar${path}`
}

export const absoluteUrl = (path: string): string =>
  path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`

/** Shared chrome copy (header/footer/CTAs) in both languages. */
export const CHROME: Record<
  | 'openApp'
  | 'openAppFree'
  | 'nav.features'
  | 'nav.templates'
  | 'nav.skins'
  | 'nav.compare'
  | 'nav.blog'
  | 'nav.gettingStarted'
  | 'nav.github'
  | 'footer.tagline'
  | 'footer.product'
  | 'footer.useCases'
  | 'footer.compare'
  | 'footer.resources'
  | 'footer.legal'
  | 'footer.builtBy'
  | 'footer.privacy'
  | 'footer.about'
  | 'footer.license'
  | 'lang.switch'
  | 'theme.toggle'
  | 'menu.open'
  | 'menu.close'
  | 'skipToContent'
  | 'breadcrumb.home',
  Localized
> = {
  openApp: { en: 'Open Scripto', ar: 'افتح سكربتو' },
  openAppFree: { en: 'Open Scripto — free, no signup', ar: 'افتح سكربتو — مجانًا وبدون تسجيل' },
  'nav.features': { en: 'Features', ar: 'المزايا' },
  'nav.templates': { en: 'Templates', ar: 'القوالب' },
  'nav.skins': { en: 'Skins', ar: 'التصاميم' },
  'nav.compare': { en: 'Compare', ar: 'قارن' },
  'nav.blog': { en: 'Blog', ar: 'المدونة' },
  'nav.gettingStarted': { en: 'Getting started', ar: 'ابدأ الآن' },
  'nav.github': { en: 'GitHub', ar: 'GitHub' },
  'footer.tagline': {
    en: 'The free, open-source Markdown → PDF studio. 100% in your browser.',
    ar: 'استوديو مجاني ومفتوح المصدر لتحويل ماركداون إلى PDF — يعمل بالكامل داخل متصفحك.',
  },
  'footer.product': { en: 'Product', ar: 'المنتج' },
  'footer.useCases': { en: 'Use cases', ar: 'حالات الاستخدام' },
  'footer.compare': { en: 'Compare', ar: 'مقارنات' },
  'footer.resources': { en: 'Resources', ar: 'مصادر' },
  'footer.legal': { en: 'Legal', ar: 'قانوني' },
  'footer.builtBy': { en: 'Built by', ar: 'صنعته' },
  'footer.privacy': { en: 'Privacy', ar: 'الخصوصية' },
  'footer.about': { en: 'About', ar: 'عن سكربتو' },
  'footer.license': { en: 'MIT licensed', ar: 'رخصة MIT' },
  'lang.switch': { en: 'العربية', ar: 'English' },
  'theme.toggle': { en: 'Switch light/dark theme', ar: 'بدِّل بين الوضع الفاتح والداكن' },
  'menu.open': { en: 'Open menu', ar: 'افتح القائمة' },
  'menu.close': { en: 'Close menu', ar: 'أغلق القائمة' },
  skipToContent: { en: 'Skip to content', ar: 'تخطَّ إلى المحتوى' },
  'breadcrumb.home': { en: 'Home', ar: 'الرئيسية' },
}

export const chrome = (key: keyof typeof CHROME, lang: MarketingLang): string => CHROME[key][lang]
