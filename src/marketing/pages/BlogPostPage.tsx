import ReactMarkdown from 'react-markdown'
import { useLocation } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { Breadcrumbs, CtaBand } from '../components/blocks'
import { Seo } from '../components/Seo'
import { BLOG_POSTS, findPost } from '../blog/loadPosts'
import { MarketingLayout } from '../layout/MarketingLayout'
import { blogPosting, breadcrumb } from '../seo/jsonld'

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso))

export function BlogPostPage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/\/+$/, '').split('/').pop() ?? ''
  const post = findPost(slug)

  if (!post) {
    throw new Error(`Unknown blog post route: ${pathname}`)
  }

  const crumbs = [
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ]

  return (
    <MarketingLayout lang="en">
      <Seo
        meta={{
          title: `${post.title} — Scripto Blog`,
          description: post.description,
          path: `/blog/${post.slug}`,
          keyword: post.keyword,
        }}
        lang="en"
        ogType="article"
        articleDate={post.date}
        ogTag="Blog"
        jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs]), blogPosting(post)]}
      />
      <article className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
        <Breadcrumbs items={crumbs.slice(0, 1)} lang="en" />
        <header style={{ maxInlineSize: '70ch', marginBlockStart: '1.5rem' }}>
          <p className="mk-muted" style={{ fontSize: '0.875rem' }}>
            <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
          </p>
          <h1 className="mk-h1" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', marginBlockStart: '0.75rem' }}>
            {post.title}
          </h1>
          <p className="mk-lead" style={{ marginBlockStart: '1rem' }}>
            {post.description}
          </p>
        </header>
        <div className="mk-prose" style={{ marginBlockStart: '2.5rem' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
            {post.body}
          </ReactMarkdown>
        </div>
      </article>

      <div className="mk-container">
        <CtaBand
          lang="en"
          title="Try it on your own document."
          lead="Free, no signup, runs in your browser — paste your Markdown and export a typeset PDF."
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = BlogPostPage

export const getStaticPaths = (): string[] => BLOG_POSTS.map((post) => `blog/${post.slug}`)
