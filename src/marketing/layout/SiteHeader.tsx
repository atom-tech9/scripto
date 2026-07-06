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

function ThemeToggle({ lang }: { lang: MarketingLang }) {
  return (
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
  )
}

function GithubLink({ lang }: { lang: MarketingLang }) {
  return (
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
  )
}

function LangSwitch({ lang, altPath }: { lang: MarketingLang; altPath: string }) {
  return (
    <a
      href={altPath}
      className="mk-btn mk-btn-ghost mk-btn-md"
      lang={lang === 'ar' ? 'en' : 'ar'}
      dir={lang === 'ar' ? 'ltr' : 'rtl'}
    >
      {chrome('lang.switch', lang)}
    </a>
  )
}

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
          <span className="mk-logo-word">{brand}</span>
        </a>

        <nav className="mk-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a key={item.to} href={item.to}>
              {chrome(item.key, lang)}
            </a>
          ))}
        </nav>

        {/* Desktop action cluster (≥900px) */}
        <div className="mk-header-actions">
          <ThemeToggle lang={lang} />
          {altPath ? <LangSwitch lang={lang} altPath={altPath} /> : null}
          <GithubLink lang={lang} />
          <a href={APP_PATH} className="mk-btn mk-btn-primary mk-btn-md">
            {chrome('openApp', lang)}
          </a>
        </div>

        {/* Compact cluster (<900px): primary CTA stays 1-tap; nav + secondary actions collapse into the menu.
            zero-JS: native <details> opens the menu, ENHANCE_SCRIPT adds the niceties (never React state). */}
        <div className="mk-header-compact">
          <a href={APP_PATH} className="mk-btn mk-btn-primary mk-btn-sm mk-cta-compact">
            {chrome('openApp', lang)}
          </a>
          <details className="mk-menu">
            <summary
              className="mk-menu-toggle"
              aria-controls="mk-menu-panel"
              aria-expanded={false}
              aria-label={chrome('menu.open', lang)}
              data-label-open={chrome('menu.open', lang)}
              data-label-close={chrome('menu.close', lang)}
            >
              <svg className="mk-icon mk-icon-open" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              <svg className="mk-icon mk-icon-close" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </summary>
            <div id="mk-menu-panel" className="mk-menu-panel">
              <nav className="mk-menu-nav" aria-label="Primary">
                {NAV_ITEMS.map((item) => (
                  <a key={item.to} href={item.to}>
                    {chrome(item.key, lang)}
                  </a>
                ))}
              </nav>
              <hr className="mk-menu-divider" />
              <div className="mk-menu-actions">
                <GithubLink lang={lang} />
                {altPath ? <LangSwitch lang={lang} altPath={altPath} /> : null}
                <ThemeToggle lang={lang} />
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
