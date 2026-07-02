import { USE_CASES_AR } from '../content/use-cases'
import { UseCasePage } from './UseCasePage'

/** Arabic variants of content pages (`/ar/:slug`). */
export function ArSlugPage() {
  return <UseCasePage />
}

export const Component = ArSlugPage

export const getStaticPaths = (): string[] =>
  Object.keys(USE_CASES_AR).map((slug) => `ar/${slug}`)

// Branded 404 for unmatched slugs reached via client-side navigation.
export { NotFoundPage as ErrorBoundary } from './NotFoundPage'
