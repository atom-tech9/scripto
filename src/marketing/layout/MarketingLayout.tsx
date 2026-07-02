import type { ReactNode } from 'react'
import { Head } from 'vite-react-ssg'
import '../marketing.css'
import type { MarketingLang } from '../types'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/**
 * Tiny progressive-enhancement script inlined into every marketing page.
 * Marketing pages ship no framework JS, so this is the only script that runs:
 * it enables the CSS reveal-on-scroll transitions. Without JS (or with
 * IntersectionObserver missing) content is simply visible — never hidden.
 */
const REVEAL_SCRIPT =
  "document.documentElement.classList.add('js');addEventListener('DOMContentLoaded',function(){var e=document.querySelectorAll('.mk-reveal');if(!('IntersectionObserver'in window)){for(var i=0;i<e.length;i++)e[i].classList.add('in');return}var o=new IntersectionObserver(function(t){t.forEach(function(n){n.isIntersecting&&(n.target.classList.add('in'),o.unobserve(n.target))})},{rootMargin:'0px 0px -8% 0px',threshold:0.08});e.forEach(function(n){o.observe(n)})});"

interface MarketingLayoutProps {
  lang: MarketingLang
  /** Path of this page in the other language, for the header switcher. */
  altPath?: string
  children: ReactNode
}

export function MarketingLayout({ lang, altPath, children }: MarketingLayoutProps) {
  return (
    <div className="mk-canvas">
      <Head>
        <body className="mk-body" />
        <script>{REVEAL_SCRIPT}</script>
      </Head>
      <SiteHeader lang={lang} altPath={altPath} />
      <main id="main">{children}</main>
      <SiteFooter lang={lang} />
    </div>
  )
}
