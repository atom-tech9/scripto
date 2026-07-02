import { APP_PATH, GITHUB_URL, SITE_NAME, SITE_NAME_AR, chrome, localePath } from '../content/site'
import type { MarketingLang } from '../types'

interface SiteHeaderProps {
  lang: MarketingLang
  /** Path of this page in the other language (renders the switcher when set). */
  altPath?: string
}

const NAV_ITEMS: { to: string; key: 'nav.features' | 'nav.templates' | 'nav.skins' | 'nav.blog' }[] = [
  { to: '/features', key: 'nav.features' },
  { to: '/templates', key: 'nav.templates' },
  { to: '/skins', key: 'nav.skins' },
  { to: '/blog', key: 'nav.blog' },
]

export function SiteHeader({ lang, altPath }: SiteHeaderProps) {
  const brand = lang === 'ar' ? SITE_NAME_AR : SITE_NAME

  return (
    <header className="mk-header">
      <a href="#main" className="mk-skip-link">
        {chrome('skipToContent', lang)}
      </a>
      <div className="mk-container mk-header-inner">
        <a href={localePath(lang, '/')} className="mk-logo" aria-label={`${brand} — ${chrome('breadcrumb.home', lang)}`}>
          <img src="/logo-192.png" alt="" width={28} height={28} />
          <span>{brand}</span>
        </a>
        <nav className="mk-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a key={item.to} href={item.to}>
              {chrome(item.key, lang)}
            </a>
          ))}
        </nav>
        <div className="mk-header-actions">
          <button
            type="button"
            className="mk-btn mk-btn-ghost mk-btn-md mk-theme-toggle"
            data-theme-toggle
            aria-label={chrome('theme.toggle', lang)}
            title={chrome('theme.toggle', lang)}
          >
            {/* sun shown in dark mode (switch to light), moon in light mode */}
            <svg className="tt-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg className="tt-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          </button>
          {altPath ? (
            <a
              href={altPath}
              className="mk-btn mk-btn-ghost mk-btn-md"
              lang={lang === 'ar' ? 'en' : 'ar'}
              dir={lang === 'ar' ? 'ltr' : 'rtl'}
            >
              {chrome('lang.switch', lang)}
            </a>
          ) : null}
          <a
            href={GITHUB_URL}
            className="mk-btn mk-btn-ghost mk-btn-md"
            target="_blank"
            rel="noopener"
            aria-label={chrome('nav.github', lang)}
          >
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span className="mk-gh-label">{chrome('nav.github', lang)}</span>
          </a>
          <a href={APP_PATH} className="mk-btn mk-btn-primary mk-btn-md">
            {chrome('openApp', lang)}
          </a>
        </div>
      </div>
    </header>
  )
}
