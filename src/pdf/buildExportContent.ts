import { buildCoverHtml, resolveDocDirection } from './pageStyles'
import { startsWithManualNumber } from '@/lib/headingNumbers'
import { escapeHtml } from '@/lib/utils'
import type { PdfConfig, TocEntry } from '@/types'

/** Localized strings for the generated cover/TOC pages (fall back to English). */
export interface ExportStrings {
  contents?: string
  locale?: string
}

const ID_PREFIX = 'pdf-'

/** Skip the table of contents for docs with fewer headings than this — a lone
 * "Contents → heading" page is noise, not navigation. */
export const MIN_TOC_HEADINGS = 3

/** Read the heading outline from a rendered document element. */
export function extractToc(docElement: HTMLElement, maxDepth: number): TocEntry[] {
  const selector = Array.from({ length: maxDepth }, (_, i) => `h${i + 1}`).join(',')
  const headings = Array.from(docElement.querySelectorAll<HTMLElement>(selector))
  return headings
    .filter((h) => h.id && h.textContent?.trim())
    .map((h) => ({
      id: h.id,
      text: h.textContent?.trim() ?? '',
      depth: Number(h.tagName.substring(1)),
    }))
}

function buildTocHtml(entries: TocEntry[], title: string, dir: 'ltr' | 'rtl'): string {
  if (entries.length === 0) return ''
  const items = entries
    .map(
      (e) => `
      <li class="toc-entry toc-depth-${e.depth}">
        <a href="#${ID_PREFIX}${e.id}">
          <span class="toc-text">${escapeHtml(e.text)}</span>
          <span class="toc-dots"></span>
        </a>
      </li>`,
    )
    .join('')
  return `
    <section class="pdf-toc scripto-doc" dir="${dir}" style="direction:${dir};text-align:start;">
      <h2>${escapeHtml(title)}</h2>
      <ol class="toc-list">${items}</ol>
    </section>`
}

/** Prefix every id and same-document anchor so the clone can't collide with the
 * live preview. SVG-internal ids are skipped — Mermaid scopes its `<style>` and
 * `url(#…)` marker refs to them, so renaming would break diagrams in the PDF. */
function namespaceIds(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[id]').forEach((el) => {
    if (el.closest('svg')) return
    el.id = `${ID_PREFIX}${el.id}`
  })
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    if (a.closest('svg')) return
    const href = a.getAttribute('href')
    if (href && href.length > 1) a.setAttribute('href', `#${ID_PREFIX}${href.slice(1)}`)
  })
}

/**
 * Bake hierarchical heading numbers (H1 = 1., H2 = 1.1, …) into the clone as
 * literal text. The live preview uses CSS counters, but Paged.js re-creates the
 * document wrapper on every page and doesn't carry custom counters across the
 * fragments — so a heading after a page break would restart at `0.1`. Literal
 * text is immune to that, so the export numbers itself instead.
 */
function bakeHeadingNumbers(root: HTMLElement): void {
  const counters = [0, 0, 0, 0]
  root.querySelectorAll<HTMLElement>('h1, h2, h3, h4').forEach((h) => {
    if (h.closest('.footnotes')) return
    // Self-numbered headings keep their own number and don't consume a slot.
    if (startsWithManualNumber(h.textContent ?? '')) return
    const level = Number(h.tagName[1])
    counters[level - 1] += 1
    for (let i = level; i < counters.length; i++) counters[i] = 0
    const parts = counters.slice(0, level)
    const label = level === 1 ? `${parts[0]}.` : parts.join('.')
    const span = h.ownerDocument.createElement('span')
    span.className = 'heading-number'
    span.textContent = `${label}\u00a0\u00a0`
    h.insertBefore(span, h.firstChild)
  })
}

/**
 * Assemble the complete export source: optional cover page, optional table of
 * contents, and a namespaced clone of the live document. Returned as a detached
 * element ready to hand to Paged.js.
 */
export function buildExportContent(
  liveDoc: HTMLElement,
  config: PdfConfig,
  strings: ExportStrings = {},
): { content: HTMLElement; toc: TocEntry[] } {
  const wrapper = document.createElement('div')
  wrapper.className = 'pdf-export-root'

  const clone = liveDoc.cloneNode(true) as HTMLElement
  namespaceIds(clone)
  // Number headings as literal text and turn off the CSS counters (data-numbered)
  // so they don't double up — Paged.js can't reset baked-in text across pages.
  if (config.numberedHeadings) {
    bakeHeadingNumbers(clone)
    clone.removeAttribute('data-numbered')
  }

  const toc = config.tableOfContents ? extractToc(liveDoc, config.tocDepth) : []
  const showToc = toc.length >= MIN_TOC_HEADINGS
  const dir = resolveDocDirection(config)

  let html = ''
  if (config.coverPage) html += buildCoverHtml(config, strings.locale)
  if (showToc) html += buildTocHtml(toc, strings.contents ?? 'Contents', dir)
  wrapper.innerHTML = html
  wrapper.appendChild(clone)

  return { content: wrapper, toc }
}
