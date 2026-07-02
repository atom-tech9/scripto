import { useLocation } from 'react-router-dom'
import { INFO_PAGES, findInfoPage } from '../content/staticPages'
import { USE_CASES } from '../content/use-cases'
import { CheatSheetPage } from './CheatSheetPage'
import { InfoPage } from './InfoPage'
import { UseCasePage } from './UseCasePage'

const CHEAT_SHEET_SLUG = 'markdown-cheat-sheet'

/**
 * Dispatcher for all root-level content slugs (`/:slug`): use-case guides,
 * info pages and the cheat sheet share the top level for clean, short URLs.
 */
export function RootSlugPage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/\/+$/, '').split('/').pop() ?? ''

  if (slug === CHEAT_SHEET_SLUG) return <CheatSheetPage />
  if (findInfoPage(slug)) return <InfoPage />
  return <UseCasePage />
}

export const Component = RootSlugPage

export const getStaticPaths = (): string[] => [
  ...USE_CASES.map((useCase) => useCase.slug),
  ...INFO_PAGES.map((page) => page.slug),
  CHEAT_SHEET_SLUG,
]

// Branded 404 for unmatched slugs reached via client-side navigation.
export { NotFoundPage as ErrorBoundary } from './NotFoundPage'
