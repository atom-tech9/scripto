import { describe, expect, it } from 'vitest'
import { compilePost, estimateReadingMinutes, parseFrontmatter } from '../src/marketing/blog/loadPosts'

const RAW = `---
title: 'Test Post'
description: 'A description.'
date: '2026-07-01'
keyword: 'test keyword'
---

# Heading

Body text here.
`

describe('parseFrontmatter', () => {
  it('separates yaml frontmatter from the body', () => {
    const { frontmatter, body } = parseFrontmatter(RAW)
    expect(frontmatter.title).toBe('Test Post')
    expect(frontmatter.date).toBe('2026-07-01')
    expect(body.startsWith('\n# Heading')).toBe(true)
    expect(body).not.toContain('---')
  })

  it('returns the whole input as body when no frontmatter exists', () => {
    const { frontmatter, body } = parseFrontmatter('# Just markdown')
    expect(frontmatter).toEqual({})
    expect(body).toBe('# Just markdown')
  })

  it('tolerates non-object yaml without crashing', () => {
    const { frontmatter } = parseFrontmatter('---\n- a\n- b\n---\nbody')
    expect(frontmatter).toEqual({})
  })
})

describe('estimateReadingMinutes', () => {
  it('never returns less than one minute', () => {
    expect(estimateReadingMinutes('two words')).toBe(1)
  })

  it('rounds by ~200 wpm', () => {
    const words = Array.from({ length: 600 }, (_, i) => `w${i}`).join(' ')
    expect(estimateReadingMinutes(words)).toBe(3)
  })
})

describe('compilePost', () => {
  it('derives the slug from the filename and carries frontmatter through', () => {
    const post = compilePost('../content/blog/my-post.md', RAW)
    expect(post.slug).toBe('my-post')
    expect(post.title).toBe('Test Post')
    expect(post.readingMinutes).toBeGreaterThanOrEqual(1)
  })

  it('throws a clear error on missing required frontmatter', () => {
    expect(() => compilePost('x/bad.md', '# no frontmatter')).toThrow(/missing required frontmatter/)
  })
})
