import type { RouteRecord } from 'vite-react-ssg'

/**
 * Route table for the whole site.
 *
 * Everything is lazy so the entry chunk stays tiny (router + table only).
 * Dynamic routes get their prerender paths from `getStaticPaths` exported by
 * the lazy page modules — content data never loads into the entry bundle.
 *
 * `/app` is the interactive editor (ClientOnly); every other route is
 * prerendered to static HTML and shipped without JavaScript.
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    lazy: () => import('./marketing/pages/Landing').then((m) => ({ Component: m.LandingEn })),
    entry: 'src/marketing/pages/Landing.tsx',
  },
  {
    path: '/ar',
    lazy: () => import('./marketing/pages/Landing').then((m) => ({ Component: m.LandingAr })),
    entry: 'src/marketing/pages/Landing.tsx',
  },
  {
    path: '/app',
    lazy: () => import('./app/AppPage'),
    entry: 'src/app/AppPage.tsx',
  },
  {
    path: '/blog',
    lazy: () => import('./marketing/pages/BlogIndexPage'),
    entry: 'src/marketing/pages/BlogIndexPage.tsx',
  },
  {
    path: '/blog/:slug',
    lazy: () => import('./marketing/pages/BlogPostPage'),
    entry: 'src/marketing/pages/BlogPostPage.tsx',
  },
  {
    path: '/templates',
    lazy: () => import('./marketing/pages/TemplatesIndexPage'),
    entry: 'src/marketing/pages/TemplatesIndexPage.tsx',
  },
  {
    path: '/templates/:slug',
    lazy: () => import('./marketing/pages/TemplatePage'),
    entry: 'src/marketing/pages/TemplatePage.tsx',
  },
  {
    path: '/skins',
    lazy: () => import('./marketing/pages/SkinsIndexPage'),
    entry: 'src/marketing/pages/SkinsIndexPage.tsx',
  },
  {
    path: '/skins/:slug',
    lazy: () => import('./marketing/pages/SkinPage'),
    entry: 'src/marketing/pages/SkinPage.tsx',
  },
  {
    path: '/vs/:slug',
    lazy: () => import('./marketing/pages/ComparePage'),
    entry: 'src/marketing/pages/ComparePage.tsx',
  },
  {
    path: '/ar/:slug',
    lazy: () => import('./marketing/pages/ArSlugPage'),
    entry: 'src/marketing/pages/ArSlugPage.tsx',
  },
  {
    path: '/404',
    lazy: () => import('./marketing/pages/NotFoundPage'),
    entry: 'src/marketing/pages/NotFoundPage.tsx',
  },
  {
    path: '/:slug',
    lazy: () => import('./marketing/pages/RootSlugPage'),
    entry: 'src/marketing/pages/RootSlugPage.tsx',
  },
  {
    path: '*',
    lazy: () => import('./marketing/pages/NotFoundPage'),
    entry: 'src/marketing/pages/NotFoundPage.tsx',
  },
]
