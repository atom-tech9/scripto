import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { readFileAsText } from '@/lib/utils'
import { getErrorMessage, logger } from '@/lib/logger'

export interface ImportResult {
  markdown: string
  name: string
}

export const ACCEPTED_IMPORT = '.md,.markdown,.mdx,.txt,.tex,.docx,.html,.htm'

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '')
}

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  })
  td.use(gfm)
  return td
}

/**
 * Convert an HTML string to Markdown using the same turndown + GFM config used
 * for file imports. Shared with the editor's paste-to-Markdown path so pasted
 * rich content and imported HTML produce identical Markdown.
 */
export function htmlToMarkdown(html: string): string {
  return createTurndown().turndown(html).trim()
}

/** Convert a DOCX file to Markdown via mammoth → HTML → Turndown. */
async function docxToMarkdown(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  if (result.messages.length > 0) {
    logger.debug('mammoth conversion messages', result.messages)
  }
  return htmlToMarkdown(result.value)
}

/**
 * Import a file and return Markdown. Supports Markdown/text/LaTeX (as-is),
 * Word `.docx` (converted), and HTML (converted).
 */
export async function importFile(file: File): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const name = baseName(file.name)

  try {
    if (ext === 'docx') {
      return { markdown: await docxToMarkdown(file), name }
    }
    if (ext === 'html' || ext === 'htm') {
      const html = await readFileAsText(file)
      return { markdown: htmlToMarkdown(html), name }
    }
    // md, markdown, mdx, txt, tex — already text-based
    return { markdown: await readFileAsText(file), name }
  } catch (error) {
    logger.error('Import failed', error)
    throw new Error(`Couldn't import "${file.name}": ${getErrorMessage(error)}`)
  }
}
