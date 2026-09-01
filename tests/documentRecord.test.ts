import { describe, expect, it } from 'vitest'
import { normaliseConfig, normaliseDoc } from '@/lib/documentRecord'
import { DEFAULT_CONFIG } from '@/lib/constants'

/**
 * Everything here arrives from outside the app — localStorage, or a JSON file
 * the user imported — so none of it can be trusted. Before this validation
 * existed, a record carrying a partial or non-object `meta` reached the UI and
 * crashed it on `config.meta.title.toLowerCase()`, with no way out but clearing
 * site data.
 */
describe('normaliseConfig', () => {
  it('fills every field from the defaults', () => {
    expect(normaliseConfig({})).toEqual(DEFAULT_CONFIG)
  })

  it('survives a config that is not an object at all', () => {
    for (const junk of [null, undefined, 42, 'nope', []]) {
      expect(normaliseConfig(junk).meta.title).toBe(DEFAULT_CONFIG.meta.title)
    }
  })

  it('keeps the values that are present', () => {
    const next = normaliseConfig({ skin: 'ledger', fontSize: 9 })
    expect(next.skin).toBe('ledger')
    expect(next.fontSize).toBe(9)
    expect(next.paperSize).toBe(DEFAULT_CONFIG.paperSize)
  })

  it('completes a partial meta rather than leaving holes in it', () => {
    const next = normaliseConfig({ meta: { title: 'Q3 report' } })
    expect(next.meta.title).toBe('Q3 report')
    expect(next.meta.author).toBe(DEFAULT_CONFIG.meta.author)
    expect(next.meta.docType).toBe(DEFAULT_CONFIG.meta.docType)
  })

  it('replaces meta fields that are the wrong type', () => {
    const next = normaliseConfig({ meta: { title: 42, author: null, keywords: {} } })
    expect(typeof next.meta.title).toBe('string')
    expect(typeof next.meta.author).toBe('string')
    expect(typeof next.meta.keywords).toBe('string')
  })

  it('completes partial margins and custom sizes', () => {
    const next = normaliseConfig({ margins: { top: 5 }, customSize: { width: 100 } })
    expect(next.margins).toEqual({ ...DEFAULT_CONFIG.margins, top: 5 })
    expect(next.customSize).toEqual({ ...DEFAULT_CONFIG.customSize, width: 100 })
  })
})

describe('normaliseDoc', () => {
  it('rejects anything without string content', () => {
    for (const junk of [null, undefined, 42, 'nope', {}, { content: 5 }, []]) {
      expect(normaliseDoc(junk)).toBeNull()
    }
  })

  it('accepts a record carrying only content', () => {
    const doc = normaliseDoc({ content: '# Hello' })
    expect(doc?.content).toBe('# Hello')
    expect(doc?.id).toBeTruthy()
    expect(doc?.config).toEqual(DEFAULT_CONFIG)
    expect(typeof doc?.createdAt).toBe('number')
  })

  it('keeps a usable id and timestamps, and replaces unusable ones', () => {
    const kept = normaliseDoc({ id: 'abc', content: 'x', createdAt: 111, updatedAt: 222 })
    expect(kept).toMatchObject({ id: 'abc', createdAt: 111, updatedAt: 222 })

    const replaced = normaliseDoc({ id: 42, content: 'x', createdAt: 'yesterday' })
    expect(typeof replaced?.id).toBe('string')
    expect(replaced?.id).not.toBe('42')
    expect(typeof replaced?.createdAt).toBe('number')
  })

  it('normalises the config of an imported record', () => {
    const doc = normaliseDoc({ content: 'x', config: { meta: null, skin: 'swiss' } })
    expect(doc?.config.meta.title).toBe(DEFAULT_CONFIG.meta.title)
    expect(doc?.config.skin).toBe('swiss')
  })
})
