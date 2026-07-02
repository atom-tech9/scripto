import { Breadcrumbs, CtaBand } from '../components/blocks'
import { Seo } from '../components/Seo'
import { BLOG_POSTS } from '../blog/loadPosts'
import { MarketingLayout } from '../layout/MarketingLayout'
import { breadcrumb } from '../seo/jsonld'
import type { SeoMeta } from '../types'

const META: SeoMeta = {
  title: 'Scripto Blog — Markdown, PDFs and Print Typography',
  description:
    'Practical guides on turning Markdown into professional PDFs: pagination, resumes, Arabic documents, diagrams, math and print typography.',
  path: '/blog',
}

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso))

export function BlogIndexPage() {
  const crumbs = [{ name: 'Blog', path: '/blog' }]

  return (
    <MarketingLayout lang="en">
      <Seo meta={META} lang="en" jsonLd={[breadcrumb([{ name: 'Home', path: '/' }, ...crumbs])]} />
      <div className="mk-container mk-section-tight" style={{ paddingBlockStart: '3.5rem' }}>
        <Breadcrumbs items={crumbs} lang="en" />
        <h1 className="mk-h1" style={{ marginBlockStart: '1.5rem' }}>
          The Scripto blog.
        </h1>
        <p className="mk-lead" style={{ maxInlineSize: '58ch', marginBlockStart: '1.25rem' }}>
          Field guides for people who ship documents: Markdown workflows, pagination craft and
          print typography — written with the same care as the product.
        </p>
      </div>

      <div className="mk-container mk-section-tight">
        <div style={{ display: 'grid', gap: '1.125rem', maxInlineSize: '52rem' }}>
          {BLOG_POSTS.map((post) => (
            <a key={post.slug} href={`/blog/${post.slug}`} className="mk-card mk-reveal">
              <p className="mk-muted" style={{ fontSize: '0.8125rem', marginBlockEnd: '0.5rem' }}>
                <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
              </p>
              <h2 className="mk-h3" style={{ fontSize: '1.375rem' }}>
                {post.title}
              </h2>
              <p className="mk-muted" style={{ marginBlockStart: '0.5rem', lineHeight: 1.65 }}>
                {post.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      <div className="mk-container">
        <CtaBand
          lang="en"
          title="Reading about PDFs is slower than making one."
          lead="The editor is free and takes no signup — your first typeset export is two minutes away."
        />
      </div>
    </MarketingLayout>
  )
}

export const Component = BlogIndexPage
