import type { ReactNode } from 'react'
import { Head } from 'vite-react-ssg'
import '../marketing.css'
import type { MarketingLang } from '../types'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/**
 * Tiny progressive-enhancement script inlined into every marketing page —
 * the only JS these pages ship. It (1) applies the persisted light/dark
 * choice before paint, (2) enables the CSS reveal-on-scroll transitions,
 * (3) wires the header theme toggle. It runs immediately when the DOM is
 * already parsed (dev/CSR) or on DOMContentLoaded (static HTML). Without JS
 * content is simply visible — never hidden.
 */
const ENHANCE_SCRIPT =
  "(function(){var d=document.documentElement;if(d.getAttribute('data-mk-enhanced'))return;d.setAttribute('data-mk-enhanced','1');try{var s=localStorage.getItem('scripto:mk-theme');if(s==='light')d.classList.remove('dark');else if(s==='dark')d.classList.add('dark')}catch(e){}d.classList.add('js');document.addEventListener('click',function(ev){var t=ev.target;var b=t&&t.closest?t.closest('[data-theme-toggle]'):null;if(!b)return;var k=d.classList.toggle('dark');try{localStorage.setItem('scripto:mk-theme',k?'dark':'light')}catch(e){}});function init(){var e=document.querySelectorAll('.mk-reveal');if('IntersectionObserver'in window){var o=new IntersectionObserver(function(t){t.forEach(function(n){n.isIntersecting&&(n.target.classList.add('in'),o.unobserve(n.target))})},{rootMargin:'0px 0px -8% 0px',threshold:0.08});e.forEach(function(n){o.observe(n)})}else{for(var i=0;i<e.length;i++)e[i].classList.add('in')}var v=document.querySelector('video[data-hero-video]');if(v){var ok=function(){d.classList.add('has-vid')};if(v.readyState>=2)ok();else v.addEventListener('loadeddata',ok,{once:true})}}if(document.readyState==='loading')addEventListener('DOMContentLoaded',init);else init()})();"

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
        <script>{ENHANCE_SCRIPT}</script>
      </Head>
      <SiteHeader lang={lang} altPath={altPath} />
      <main id="main">{children}</main>
      <SiteFooter lang={lang} />
    </div>
  )
}
