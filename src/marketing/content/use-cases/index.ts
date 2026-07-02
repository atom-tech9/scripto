import type { MarketingLang, UseCaseContent } from '../../types'
import { htmlToMarkdown } from './html-to-markdown'
import { markdownToPdf } from './markdown-to-pdf'
import { markdownToPdfArabic, markdownToPdfArabicAr } from './markdown-to-pdf-arabic'
import { markdownToPdfWithMath } from './markdown-to-pdf-with-math'
import { markdownToPdfWithMermaid } from './markdown-to-pdf-with-mermaid'
import { readmeToPdf } from './readme-to-pdf'
import { resumeToPdf } from './resume-to-pdf'
import { wordToMarkdown } from './word-to-markdown'

/** English use-case pages, in nav/footer order. */
export const USE_CASES: UseCaseContent[] = [
  markdownToPdf,
  readmeToPdf,
  resumeToPdf,
  markdownToPdfArabic,
  markdownToPdfWithMermaid,
  markdownToPdfWithMath,
  htmlToMarkdown,
  wordToMarkdown,
]

/** Arabic variants, keyed by slug (only pages translated so far). */
export const USE_CASES_AR: Record<string, UseCaseContent> = {
  'markdown-to-pdf-arabic': markdownToPdfArabicAr,
}

export const findUseCase = (slug: string, lang: MarketingLang): UseCaseContent | undefined =>
  lang === 'ar' ? USE_CASES_AR[slug] : USE_CASES.find((useCase) => useCase.slug === slug)

export const useCaseHasArabic = (slug: string): boolean => slug in USE_CASES_AR
