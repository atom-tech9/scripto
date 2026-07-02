import { countHeadings, countWords, readingTime, stripDataUrls } from './utils'

export interface DocumentStats {
  words: number
  characters: number
  charactersNoSpaces: number
  sentences: number
  paragraphs: number
  headings: number
  codeBlocks: number
  links: number
  images: number
  tables: number
  readingTimeMin: number
}

/** Strip fenced code blocks so prose metrics don't count code. */
function stripCodeFences(markdown: string): string {
  return markdown.replace(/(```|~~~)[\s\S]*?\1/g, '')
}

/** Compute rich statistics for a Markdown document. */
export function computeStats(input: string): DocumentStats {
  const markdown = stripDataUrls(input)
  const prose = stripCodeFences(markdown)

  const words = countWords(markdown)
  const characters = markdown.length
  const charactersNoSpaces = markdown.replace(/\s/g, '').length

  const sentences = (prose.match(/[^.!?\n]+[.!?]+/g) ?? []).length
  const paragraphs = prose
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !/^[#>\-*|]/.test(block)).length

  const codeBlocks = Math.floor((markdown.match(/(```|~~~)/g) ?? []).length / 2)
  const images = (markdown.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []).length
  // Links excluding images.
  const links = (markdown.match(/(^|[^!])\[[^\]]+\]\([^)]+\)/g) ?? []).length
  const tables = (markdown.match(/^\|.*\|.*\n\|[\s:|-]+\|/gm) ?? []).length

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    headings: countHeadings(markdown),
    codeBlocks,
    links,
    images,
    tables,
    readingTimeMin: readingTime(words),
  }
}
