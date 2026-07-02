import yaml from 'js-yaml'
import type { BlogPostData } from '../types'

interface Frontmatter {
  title?: string
  description?: string
  date?: string
  keyword?: string
}

export interface ParsedMarkdownFile {
  frontmatter: Frontmatter
  body: string
}

/** Split `---` frontmatter from a markdown file. Pure — unit tested. */
export const parseFrontmatter = (raw: string): ParsedMarkdownFile => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { frontmatter: {}, body: raw }
  const parsed = yaml.load(match[1])
  const frontmatter =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Frontmatter) : {}
  return { frontmatter, body: raw.slice(match[0].length) }
}

export const estimateReadingMinutes = (body: string): number =>
  Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))

const slugFromPath = (path: string): string => path.split('/').pop()?.replace(/\.md$/, '') ?? path

/** Compile a raw markdown file into post data; throws on missing frontmatter. */
export const compilePost = (path: string, raw: string): BlogPostData => {
  const { frontmatter, body } = parseFrontmatter(raw)
  const slug = slugFromPath(path)
  if (!frontmatter.title || !frontmatter.description || !frontmatter.date) {
    throw new Error(`Blog post ${path} is missing required frontmatter (title/description/date)`)
  }
  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: String(frontmatter.date),
    keyword: frontmatter.keyword,
    readingMinutes: estimateReadingMinutes(body),
    body,
  }
}

const rawPosts = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** All posts, newest first. */
export const BLOG_POSTS: BlogPostData[] = Object.entries(rawPosts)
  .map(([path, raw]) => compilePost(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date))

export const findPost = (slug: string): BlogPostData | undefined =>
  BLOG_POSTS.find((post) => post.slug === slug)
