import { FONT_STACKS, resolvePageDimensions } from '@/lib/constants'
import { escapeHtml } from '@/lib/utils'
import type { PdfConfig } from '@/types'

/** Resolve a concrete direction for the generated cover/TOC pages. */
export function resolveDocDirection(config: PdfConfig): 'ltr' | 'rtl' {
  if (config.direction === 'rtl') return 'rtl'
  if (config.direction === 'ltr') return 'ltr'
  return config.font === 'arabic' ? 'rtl' : 'ltr'
}

/**
 * Build the CSS Paged Media stylesheet handed to Paged.js. This is where real
 * pagination behaviour lives: page size, margins, running headers/footers,
 * page numbers, watermarks, and named pages for the cover and table of contents.
 */
export function buildPageCss(config: PdfConfig): string {
  const { width, height } = resolvePageDimensions(config)
  const { top, right, bottom, left } = config.margins
  const accent = config.accentColor
  const docDir = resolveDocDirection(config)
  const rtl = docDir === 'rtl' || config.font === 'arabic'
  const frontFont = rtl ? FONT_STACKS.arabic : 'Inter, sans-serif'

  const marginBoxes: string[] = []

  if (config.runningHeaderFromH1) {
    marginBoxes.push(`@top-right { content: string(doctitle); ${marginBoxStyle()} }`)
  } else if (config.headerText.trim()) {
    marginBoxes.push(
      `@top-center { content: "${cssString(config.headerText)}"; ${marginBoxStyle()} }`,
    )
  }

  if (config.footerText.trim()) {
    marginBoxes.push(
      `@bottom-left { content: "${cssString(config.footerText)}"; ${marginBoxStyle()} }`,
    )
  }
  if (config.showPageNumbers) {
    marginBoxes.push(
      `@bottom-right { content: counter(page) " / " counter(pages); ${marginBoxStyle()} }`,
    )
  }
  if (config.attribution) {
    marginBoxes.push(
      `@bottom-center { content: "Made with Scripto \\00b7 md.atom.sa"; ${marginBoxStyle()} font-size: 7pt; opacity: 0.85; }`,
    )
  }

  const watermark = config.watermarkText.trim()
    ? `
    .pagedjs_page::after {
      content: "${cssString(config.watermarkText)}";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-32deg);
      font-family: Inter, sans-serif;
      font-weight: 800;
      font-size: 64pt;
      letter-spacing: 0.05em;
      color: ${accent};
      opacity: ${config.watermarkOpacity};
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }
    .pagedjs_page_content { position: relative; z-index: 1; }
  `
    : ''

  return `
    @page {
      size: ${round(width)}mm ${round(height)}mm;
      margin: ${top}mm ${right}mm ${bottom}mm ${left}mm;
      ${marginBoxes.join('\n      ')}
    }

    /* Cover page: full-bleed, no margin boxes */
    @page cover {
      margin: 0;
      @top-right { content: none; }
      @top-center { content: none; }
      @bottom-left { content: none; }
      @bottom-center { content: none; }
      @bottom-right { content: none; }
    }

    /* Table of contents: keep header/footer but restart body counter after it */
    .pdf-cover { page: cover; break-after: page; }
    .pdf-toc { break-after: page; }
    /* Start the markdown body on a fresh page after any cover/contents. The
       :not(.pdf-toc) guard keeps this off the TOC itself (which is also a
       .scripto-doc) so there's no blank page between cover and contents. */
    .pdf-cover ~ .scripto-doc:not(.pdf-toc),
    .pdf-toc ~ .scripto-doc:not(.pdf-toc) { break-before: page; }

    /* Running header source */
    .scripto-doc h1 { string-set: doctitle content(text); }

    /* Break controls layered on top of document.css */
    .scripto-doc h1, .scripto-doc h2, .scripto-doc h3 { break-after: avoid; }
    /* Small, atomic blocks stay whole; large tables are allowed to flow. */
    .scripto-doc pre, .scripto-doc .code-block,
    .scripto-doc figure, .scripto-doc blockquote, .scripto-doc .callout,
    .scripto-doc .katex-display, .scripto-doc .mermaid-figure {
      break-inside: avoid;
    }

    /* Tall diagrams / images are scaled to fit within one page's content box,
       WITH the heading that precedes them (headings set break-after: avoid). An
       unbreakable heading+figure taller than the page makes Paged.js split the
       SVG — spilling blank pages and leaking the diagram's inner <style> as
       text — so the cap reserves room for a heading + the figure's margins.
       width:auto keeps the aspect ratio intact. */
    .scripto-doc .mermaid-figure svg,
    .scripto-doc figure svg,
    .scripto-doc img {
      max-height: ${round(Math.max(40, height - top - bottom - 30))}mm;
    }
    .scripto-doc .mermaid-figure svg,
    .scripto-doc figure svg {
      width: auto;
      height: auto;
    }
    /* ASCII diagram figures are unbreakable text: a max-height alone would not
       reflow them, so the page box converts to a font-size cap instead —
       height ≈ rows × 1.2 line-height (+ padding slack). The 45mm reserve
       keeps a preceding heading, the figure margins, and a caption on the same
       page. The width term mirrors document.css; the smallest bound wins. */
    .scripto-doc .ascii-diagram pre {
      font-size: min(
        0.82em,
        calc(100cqw / (var(--diagram-cols, 60) * 0.6 + 2)),
        calc(${round(Math.max(40, height - top - bottom - 45))}mm / (var(--diagram-rows, 10) * 1.2 + 6))
      );
    }
    /* Tables flow across pages: header repeats, rows never split. */
    .scripto-doc .table-wrap { break-inside: auto; overflow: visible; border: none; }
    .scripto-doc table { break-inside: auto; }
    .scripto-doc thead { display: table-header-group; }
    .scripto-doc tfoot { display: table-footer-group; }
    .scripto-doc tr { break-inside: avoid; break-after: auto; }
    .scripto-doc img { break-inside: avoid; }

    /* Images that failed to load get a fixed box so the paginator can place them. */
    .scripto-doc img[data-unavailable] {
      display: block;
      width: 60mm;
      height: 34mm;
      border: 1px dashed #b9c0cc;
      background: #f4f6f9;
    }

    /* Cover + Contents follow the document direction even after Paged.js re-parents them */
    .pdf-cover { direction: ${docDir}; }

    /* Table of contents */
    .pdf-toc { font-family: ${frontFont}; direction: ${docDir}; }
    .pdf-toc h2 {
      font-family: ${frontFont}; font-size: 18pt; font-weight: 800;
      border: none; margin: 0 0 8mm; letter-spacing: -0.01em;
    }
    .pdf-toc .toc-list { list-style: none; margin: 0; padding: 0; }
    .pdf-toc .toc-entry { margin: 2.4mm 0; }
    .pdf-toc .toc-depth-1 { font-weight: 700; }
    .pdf-toc .toc-depth-3 { padding-inline-start: 7mm; font-size: 0.95em; }
    .pdf-toc .toc-depth-4, .pdf-toc .toc-depth-5, .pdf-toc .toc-depth-6 {
      padding-inline-start: 14mm; font-size: 0.9em; color: #5b6472;
    }
    .pdf-toc a {
      display: flex; align-items: baseline; gap: 0;
      text-decoration: none; color: #1f2532; border: none;
    }
    .pdf-toc .toc-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pdf-toc .toc-dots {
      flex: 1; margin: 0 4px; border-bottom: 1px dotted #b9c0cc;
      transform: translateY(-2px);
    }
    .pdf-toc a::after {
      content: target-counter(attr(href), page);
      font-variant-numeric: tabular-nums; color: #5b6472; white-space: nowrap;
    }

    ${watermark}

    /* User-supplied custom CSS */
    ${config.customCss}
  `
}

/** The physical @page rule injected for the actual browser print (margin 0). */
export function buildPrintPageRule(config: PdfConfig): string {
  const { width, height } = resolvePageDimensions(config)
  return `@page { size: ${round(width)}mm ${round(height)}mm; margin: 0; }`
}

function marginBoxStyle(): string {
  return 'font-family: Inter, sans-serif; font-size: 8.5pt; color: #8a93a3; direction: ltr;'
}

function cssString(value: string): string {
  // Raw newlines are invalid inside CSS string tokens and corrupt the whole
  // declaration; watermark text is settable from document frontmatter, so an
  // imported file must not be able to break the page styles.
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

const TITLE_COLOR = '#1f2532'
const MUTED_COLOR = '#5b6472'

/** HTML for the optional cover page, honouring the chosen style, direction, and
 * the document's cover fields. Used by both the live preview and the export. */
export function buildCoverHtml(config: PdfConfig, locale?: string): string {
  const { title, author, subject, subtitle, organization, date: customDate, version, docType } =
    config.meta
  const accent = config.accentColor
  const dir = resolveDocDirection(config)
  const font = dir === 'rtl' || config.font === 'arabic' ? FONT_STACKS.arabic : 'Inter, sans-serif'
  const sub = subtitle.trim() || subject.trim()
  const date =
    customDate.trim() ||
    new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })

  const heading = (title || 'Untitled Document').trim()
  const label = (color: string): string =>
    docType.trim()
      ? `<div style="font-family:${font};font-size:10.5pt;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${color};margin:0 0 5mm;">${escapeHtml(docType)}</div>`
      : ''
  const titleHtml = (color: string, maxWidth: string): string =>
    `<h1 style="font-family:${font};font-size:34pt;font-weight:800;line-height:1.15;letter-spacing:-0.02em;margin:0 0 6mm;color:${color};max-width:${maxWidth};">${escapeHtml(heading)}</h1>`
  const subtitleHtml = (maxWidth: string): string =>
    sub
      ? `<p style="font-family:${font};font-size:14pt;color:${MUTED_COLOR};margin:0 0 4mm;max-width:${maxWidth};line-height:1.4;">${escapeHtml(sub)}</p>`
      : ''
  const metaHtml = (align: 'start' | 'center'): string => {
    const rows = [
      author.trim() && `<div style="font-weight:600;color:${TITLE_COLOR};">${escapeHtml(author)}</div>`,
      organization.trim() && `<div>${escapeHtml(organization)}</div>`,
      date && `<div>${escapeHtml(date)}</div>`,
      version.trim() && `<div>${escapeHtml(version)}</div>`,
    ].filter(Boolean)
    if (rows.length === 0) return ''
    const items = align === 'center' ? 'align-items:center;' : ''
    return `<div style="font-family:${font};font-size:11pt;color:${MUTED_COLOR};display:flex;flex-direction:column;gap:1mm;${items}">${rows.join('')}</div>`
  }

  const open = (style: string): string =>
    `<section class="pdf-cover" dir="${dir}" style="direction:${dir};height:100%;box-sizing:border-box;${style}">`

  if (config.coverStyle === 'banner') {
    return `
      ${open('display:flex;flex-direction:column;text-align:start;')}
        <div style="background:${accent};color:#fff;padding:34mm 28mm 24mm;">
          ${label('rgba(255,255,255,0.85)')}
          ${titleHtml('#fff', '160mm')}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;padding:20mm 28mm;">
          ${subtitleHtml('160mm')}
          <div style="margin-top:auto;">${metaHtml('start')}</div>
        </div>
      </section>`
  }

  if (config.coverStyle === 'centered') {
    return `
      ${open('display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:36mm 28mm;')}
        ${label(accent)}
        ${titleHtml(TITLE_COLOR, '160mm')}
        <div style="width:24mm;height:1.5mm;background:${accent};margin:6mm 0;"></div>
        ${subtitleHtml('150mm')}
        <div style="margin-top:8mm;">${metaHtml('center')}</div>
      </section>`
  }

  // minimal (default)
  return `
    ${open(`display:flex;flex-direction:column;justify-content:center;align-items:flex-start;text-align:start;padding:36mm 28mm;border-inline-start:10mm solid ${accent};`)}
      <div style="width:18mm;height:1.5mm;background:${accent};margin-bottom:10mm;"></div>
      ${label(accent)}
      ${titleHtml(TITLE_COLOR, '150mm')}
      ${subtitleHtml('150mm')}
      <div style="margin-top:auto;">${metaHtml('start')}</div>
    </section>`
}
