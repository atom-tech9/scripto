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
  "(function(){var d=document.documentElement;if(d.getAttribute('data-mk-enhanced'))return;d.setAttribute('data-mk-enhanced','1');try{var s=localStorage.getItem('scripto:mk-theme');if(s==='light')d.classList.remove('dark');else if(s==='dark')d.classList.add('dark')}catch(e){}d.classList.add('js');document.addEventListener('click',function(ev){var t=ev.target;var c=t&&t.closest?t.closest('[data-copy]'):null;if(c){var box=c.closest('.mk-codebox');var pre=box&&box.querySelector('pre');if(pre&&navigator.clipboard){navigator.clipboard.writeText(pre.innerText).then(function(){var o=c.textContent;c.textContent='Copied!';setTimeout(function(){c.textContent=o},1400)})}return}var b=t&&t.closest?t.closest('[data-theme-toggle]'):null;if(!b)return;var k=d.classList.toggle('dark');try{localStorage.setItem('scripto:mk-theme',k?'dark':'light')}catch(e){}});function mkMenu(){return document.querySelector('details.mk-menu')}document.addEventListener('click',function(ev){var t=ev.target;var m=mkMenu();if(!m||!m.open||!t||!t.closest)return;if(t.closest('.mk-menu-panel a')){m.open=false;return}if(!t.closest('details.mk-menu'))m.open=false});document.addEventListener('keydown',function(ev){if(ev.key!=='Escape')return;var m=mkMenu();if(m&&m.open){m.open=false;var s=m.querySelector('summary');if(s)s.focus()}});addEventListener('resize',function(){if(innerWidth>=900){var m=mkMenu();if(m&&m.open)m.open=false}});document.addEventListener('toggle',function(ev){var m=ev.target;if(!m||!m.classList||!m.classList.contains('mk-menu'))return;var s=m.querySelector('summary');if(s){s.setAttribute('aria-expanded',m.open?'true':'false');var lb=s.getAttribute(m.open?'data-label-close':'data-label-open');if(lb)s.setAttribute('aria-label',lb)}d.classList.toggle('mk-menu-open',m.open)},true);var o='IntersectionObserver'in window?new IntersectionObserver(function(t){t.forEach(function(n){n.isIntersecting&&(n.target.classList.add('in'),o.unobserve(n.target))})},{rootMargin:'0px 0px -8% 0px',threshold:0.08}):null;function scan(){var e=document.querySelectorAll('.mk-reveal:not([data-obs])');for(var i=0;i<e.length;i++){e[i].setAttribute('data-obs','1');if(o)o.observe(e[i]);else e[i].classList.add('in')}var v=document.querySelector('video[data-hero-video]');if(v&&!v.getAttribute('data-obs')){v.setAttribute('data-obs','1');var ok=function(){d.classList.add('has-vid')};if(v.readyState>=2)ok();else v.addEventListener('loadeddata',ok,{once:true})}}if(document.readyState==='loading')addEventListener('DOMContentLoaded',scan);scan();addEventListener('load',scan);setTimeout(scan,400);setTimeout(scan,1600)})();"

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
