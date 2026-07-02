import documentCss from '@/styles/document.css?inline'
import { downloadTextFile, escapeHtml } from '@/lib/utils'
import { documentDataAttrs, documentStyleVars } from '@/pdf/documentStyle'
import { FONT_STACKS } from '@/lib/constants'
import type { PdfConfig } from '@/types'

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Lora:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap'
const KATEX_HREF = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'

/** `<html>` lang/dir attributes for an exported document. */
function htmlLangDir(config: PdfConfig): string {
  const lang = config.direction === 'rtl' || config.font === 'arabic' ? 'ar' : 'en'
  const dir = config.direction === 'auto' ? 'auto' : config.direction
  return `lang="${lang}" dir="${dir}"`
}

/** Clone the rendered document, dropping interactive-only chrome. */
function cleanClone(docElement: HTMLElement): HTMLElement {
  const clone = docElement.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.code-block__copy').forEach((el) => el.remove())
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'))
  return clone
}

function styleVarsToString(config: PdfConfig): string {
  const vars = documentStyleVars(config) as Record<string, string | number>
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

function dataAttrsToString(config: PdfConfig): string {
  return Object.entries(documentDataAttrs(config))
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')
}

/** Export the raw Markdown source. */
export function exportMarkdown(markdown: string, name: string): void {
  downloadTextFile(`${name}.md`, markdown, 'text/markdown')
}

/** Build a fully self-contained, styled HTML document string. */
export function buildStandaloneHtml(docElement: HTMLElement, config: PdfConfig): string {
  const clone = cleanClone(docElement)
  const { title, author, keywords } = config.meta
  return `<!doctype html>
<html ${htmlLangDir(config)}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title || 'Document')}</title>
${author ? `<meta name="author" content="${escapeHtml(author)}" />` : ''}
${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONTS_HREF}" rel="stylesheet" />
<link href="${KATEX_HREF}" rel="stylesheet" />
<style>
${documentCss}
body { margin: 0; background: #f1f3f7; color: #1f2532; font-family: ${FONT_STACKS[config.font]}; }
.page { max-width: 820px; margin: 0 auto; padding: 48px 24px; }
.sheet { background: #fff; border-radius: 12px; padding: 56px 64px; box-shadow: 0 10px 40px -12px rgba(15,23,42,.18); }
@media print { body { background: #fff; } .sheet { box-shadow: none; border-radius: 0; padding: 0; } }
${config.customCss}
</style>
</head>
<body>
<div class="page"><div class="sheet">
<div class="scripto-doc" style="${styleVarsToString(config)}" ${dataAttrsToString(config)}>
${clone.innerHTML}
</div>
</div></div>
</body>
</html>`
}

/** Export a self-contained HTML file. */
export function exportHtml(docElement: HTMLElement, config: PdfConfig, name: string): void {
  downloadTextFile(`${name}.html`, buildStandaloneHtml(docElement, config), 'text/html')
}

/**
 * Export a Word-compatible `.doc` file. Word opens HTML documents with the
 * office namespace; this preserves headings, lists, tables, and inline styles.
 */
export function exportWord(docElement: HTMLElement, config: PdfConfig, name: string): void {
  const clone = cleanClone(docElement)
  const html = `<!doctype html>
<html ${htmlLangDir(config)} xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(config.meta.title || 'Document')}</title>
<style>
${documentCss}
body { font-family: ${FONT_STACKS[config.font]}; }
${config.customCss}
</style>
</head>
<body>
<div class="scripto-doc" style="${styleVarsToString(config)}" ${dataAttrsToString(config)}>
${clone.innerHTML}
</div>
</body>
</html>`
  const blob = new Blob(['﻿', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name}.doc`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
