import {
  APP_PATH,
  ATOM_URL,
  GITHUB_URL,
  SITE_NAME,
  SITE_NAME_AR,
  chrome,
  localePath,
} from '../content/site'
import type { MarketingLang } from '../types'

interface SiteFooterProps {
  lang: MarketingLang
}

interface FooterColumn {
  heading: 'footer.product' | 'footer.useCases' | 'footer.resources' | 'footer.legal'
  links: { label: string; to: string; external?: boolean }[]
}

const COLUMNS: FooterColumn[] = [
  {
    heading: 'footer.product',
    links: [
      { label: 'Open the editor', to: APP_PATH },
      { label: 'Features', to: '/features' },
      { label: 'Templates', to: '/templates' },
      { label: 'Document skins', to: '/skins' },
      { label: 'Getting started', to: '/getting-started' },
    ],
  },
  {
    heading: 'footer.useCases',
    links: [
      { label: 'Markdown to PDF', to: '/markdown-to-pdf' },
      { label: 'README to PDF', to: '/readme-to-pdf' },
      { label: 'Resume to PDF', to: '/resume-to-pdf' },
      { label: 'Arabic Markdown to PDF', to: '/markdown-to-pdf-arabic' },
      { label: 'Mermaid diagrams to PDF', to: '/markdown-to-pdf-with-mermaid' },
      { label: 'Math & LaTeX to PDF', to: '/markdown-to-pdf-with-math' },
      { label: 'Markdown cheat sheet', to: '/markdown-cheat-sheet' },
    ],
  },
  {
    heading: 'footer.resources',
    links: [
      { label: 'Blog', to: '/blog' },
      { label: 'Scripto vs Notion export', to: '/vs/notion-pdf-export' },
      { label: 'Scripto vs Pandoc', to: '/vs/pandoc' },
      { label: 'Scripto vs Typora', to: '/vs/typora' },
      { label: 'HTML to Markdown', to: '/html-to-markdown' },
      { label: 'Word to Markdown', to: '/word-to-markdown' },
      { label: 'GitHub', to: GITHUB_URL, external: true },
    ],
  },
  {
    heading: 'footer.legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'About', to: '/about' },
      { label: 'Getting started', to: '/getting-started' },
    ],
  },
]

export function SiteFooter({ lang }: SiteFooterProps) {
  const brand = lang === 'ar' ? SITE_NAME_AR : SITE_NAME
  const year = new Date().getFullYear()

  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-grid">
          <div>
            <a href={localePath(lang, '/')} className="mk-logo">
              <img src="/logo-192.png" alt="" width={28} height={28} />
              <span>{brand}</span>
            </a>
            <p className="mk-muted" style={{ marginBlockStart: '0.875rem', maxInlineSize: '30ch', lineHeight: 1.65 }}>
              {chrome('footer.tagline', lang)}
            </p>
            <a
              href={ATOM_URL}
              target="_blank"
              rel="noopener"
              className="mk-atom-badge"
              style={{ marginBlockStart: '1.25rem' }}
            >
              <span>{chrome('footer.builtBy', lang)}</span>
              <img src="/atom-logo.png" alt="Atom" width={57} height={22} />
            </a>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4>{chrome(column.heading, lang)}</h4>
              <ul>
                {column.links.map((link) => (
                  <li key={link.to}>
                    {link.external ? (
                      <a href={link.to} target="_blank" rel="noopener">
                        {link.label}
                      </a>
                    ) : (
                      <a href={link.to}>{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mk-footer-bottom">
          <span>
            © {year} <a href={ATOM_URL} target="_blank" rel="noopener">Atom</a> · {chrome('footer.license', lang)}
          </span>
          <span>
            {lang === 'en' ? (
              <a href="/ar" lang="ar" dir="rtl">
                العربية
              </a>
            ) : (
              <a href="/" lang="en" dir="ltr">
                English
              </a>
            )}
          </span>
        </div>
      </div>
    </footer>
  )
}
