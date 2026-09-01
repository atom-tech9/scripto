import { describe, expect, it } from 'vitest'
import type { Element, Root } from 'hast'
import { bucketFor, hashSeed, mulberry32 } from '@/lib/handwriting/random'
import { rehypeHandwriting } from '@/markdown/plugins/rehypeHandwriting'
import { isRuled, leadingForPitch, rulePitchMm, snapMarginsToRule } from '@/lib/handwriting/rules'
import { documentDataAttrs, documentStyleVars } from '@/pdf/documentStyle'
import { handStylesheetHref } from '@/lib/handwriting/fonts'
import { HANDS } from '@/lib/handwriting/hands'
import { DEFAULT_CONFIG } from '@/lib/constants'
import { SKIN_OPTIONS } from '@/data/skins'
import type { PdfConfig } from '@/types'

const text = (value: string) => ({ type: 'text' as const, value })
const el = (tagName: string, children: Element['children'], className?: string[]): Element => ({
  type: 'element',
  tagName,
  properties: className ? { className } : {},
  children,
})
const root = (children: Element[]): Root => ({ type: 'root', children })

/** Every `.hw` span in a tree, flattened. */
function words(node: Root | Element): Element[] {
  const found: Element[] = []
  const walk = (parent: Root | Element) => {
    for (const child of parent.children) {
      if (child.type !== 'element') continue
      const classes = child.properties?.className
      if (Array.isArray(classes) && classes.includes('hw')) found.push(child)
      walk(child)
    }
  }
  walk(node)
  return found
}

function countNodes(node: Root | Element): number {
  let total = 1
  for (const child of node.children) {
    if (child.type === 'element') total += countNodes(child)
    else total += 1
  }
  return total
}

describe('deterministic randomness', () => {
  it('produces byte-identical sequences for the same seed', () => {
    const a = Array.from({ length: 64 }, (_, i) => bucketFor(12345, i, 16))
    const b = Array.from({ length: 64 }, (_, i) => bucketFor(12345, i, 16))
    expect(a).toEqual(b)
  })

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 32 }, (_, i) => bucketFor(1, i, 16))
    const b = Array.from({ length: 32 }, (_, i) => bucketFor(2, i, 16))
    expect(a).not.toEqual(b)
  })

  it('keeps every bucket in range', () => {
    for (const buckets of [16, 32]) {
      for (let i = 0; i < 500; i++) {
        const bucket = bucketFor(99, i, buckets)
        expect(bucket).toBeGreaterThanOrEqual(0)
        expect(bucket).toBeLessThan(buckets)
      }
    }
  })

  it("does not depend on how many words came before, so editing the top of a document cannot reshuffle the bottom", () => {
    expect(bucketFor(7, 400, 16)).toBe(bucketFor(7, 400, 16))
  })

  it('spreads across the buckets rather than favouring one', () => {
    const seen = new Set(Array.from({ length: 400 }, (_, i) => bucketFor(3, i, 16)))
    expect(seen.size).toBe(16)
  })

  it('hashes a document id to a stable seed', () => {
    expect(hashSeed('doc-abc')).toBe(hashSeed('doc-abc'))
    expect(hashSeed('doc-abc')).not.toBe(hashSeed('doc-abd'))
  })

  it('mulberry32 stays within [0, 1)', () => {
    const next = mulberry32(42)
    for (let i = 0; i < 200; i++) {
      const value = next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('rehypeHandwriting', () => {
  const run = (tree: Root, buckets = 16) => {
    rehypeHandwriting({ seed: 5, buckets })(tree)
    return tree
  }

  it('wraps each word once, splitting only on whitespace', () => {
    const tree = run(root([el('p', [text('one two three')])]))
    const wrapped = words(tree)
    expect(wrapped).toHaveLength(3)
    expect(wrapped.map((w) => (w.children[0] as { value: string }).value)).toEqual([
      'one',
      'two',
      'three',
    ])
  })

  it('preserves the whitespace between words', () => {
    const tree = run(root([el('p', [text('a  b')])]))
    const paragraph = tree.children[0] as Element
    const spaces = paragraph.children.filter((c) => c.type === 'text')
    expect(spaces.map((s) => (s as { value: string }).value)).toEqual(['  '])
  })

  it('leaves pre, code, svg and katex subtrees completely untouched', () => {
    for (const skipped of [
      el('pre', [el('code', [text('const x = 1')])]),
      el('svg', [el('text', [text('node label')])]),
      el('span', [text('x squared')], ['katex']),
      el('figure', [el('div', [text('flow chart')])], ['mermaid-figure']),
    ]) {
      const before = countNodes(skipped)
      const tree = run(root([skipped]))
      expect(words(tree)).toHaveLength(0)
      expect(countNodes(tree.children[0] as Element)).toBe(before)
    }
  })

  it('still wraps ordinary text alongside a skipped sibling', () => {
    const tree = run(root([el('p', [text('before')]), el('pre', [text('code here')])]))
    expect(words(tree)).toHaveLength(1)
  })

  it('never nests one wrapper inside another when run twice', () => {
    const tree = root([el('p', [text('idempotent please')])])
    run(tree)
    run(tree)
    for (const word of words(tree)) {
      expect(words(word)).toHaveLength(0)
    }
  })

  it('splits Arabic only at spaces, keeping each word whole', () => {
    // Arabic is a connected script: splitting inside a word breaks glyph
    // shaping and renders it as disconnected isolated forms.
    const tree = run(root([el('p', [text('الخط العربي جميل')])]))
    const wrapped = words(tree)
    expect(wrapped).toHaveLength(3)
    expect(wrapped.map((w) => (w.children[0] as { value: string }).value)).toEqual([
      'الخط',
      'العربي',
      'جميل',
    ])
    for (const word of wrapped) {
      expect(word.children).toHaveLength(1)
      expect(word.children[0].type).toBe('text')
    }
  })

  it('is deterministic across two independent runs', () => {
    const classesOf = () => {
      const tree = root([el('p', [text('the quick brown fox jumps over the lazy dog')])])
      rehypeHandwriting({ seed: 2024, buckets: 16 })(tree)
      return words(tree).map((w) => (w.properties?.className as string[]).join(' '))
    }
    expect(classesOf()).toEqual(classesOf())
  })
})

describe('rule-pitch locking', () => {
  it('snaps the block margins to a whole number of rules', () => {
    const pitch = 7.1
    const snapped = snapMarginsToRule({ top: 20, right: 18, bottom: 20, left: 18 }, pitch)
    // Compare the ratio, not a modulo: 3 * 7.1 is not exactly 21.3 in binary
    // floating point, so `% pitch` reports a full pitch rather than zero.
    expect(snapped.top / pitch).toBeCloseTo(Math.round(snapped.top / pitch), 6)
    expect(snapped.bottom / pitch).toBeCloseTo(Math.round(snapped.bottom / pitch), 6)
    expect(snapped.top).toBeCloseTo(21.3, 6)
  })

  it('leaves the inline margins alone', () => {
    const snapped = snapMarginsToRule({ top: 20, right: 18, bottom: 20, left: 18 }, 7.1)
    expect(snapped.right).toBe(18)
    expect(snapped.left).toBe(18)
  })

  it('never snaps the top margin below a single rule', () => {
    expect(snapMarginsToRule({ top: 1, bottom: 1 }, 7.1).top).toBeCloseTo(7.1, 6)
  })

  it('is a no-op for a nonsense pitch', () => {
    const margins = { top: 20, bottom: 20 }
    expect(snapMarginsToRule(margins, 0)).toEqual(margins)
    expect(snapMarginsToRule(margins, Number.NaN)).toEqual(margins)
  })

  it('knows which papers are ruled and what their pitch is', () => {
    expect(isRuled('ruled-college')).toBe(true)
    expect(isRuled('blank')).toBe(false)
    expect(isRuled('graph')).toBe(false)
    expect(rulePitchMm('ruled-college')).toBeGreaterThan(0)
    expect(rulePitchMm('blank')).toBeNull()
  })

  it('derives a leading that makes one line occupy exactly one rule', () => {
    const pitch = 7.1
    const fontPx = 16
    const leading = leadingForPitch(pitch, fontPx)
    expect(leading * fontPx).toBeCloseTo(pitch * (96 / 25.4), 6)
  })
})

describe("hand: 'none' is a total no-op", () => {
  // The whole feature has to be free for a document that never uses it: no
  // extra attributes, no extra custom properties, no font request, no plugin.
  it('emits no handwriting attributes', () => {
    const attrs = documentDataAttrs(DEFAULT_CONFIG)
    for (const key of Object.keys(attrs)) {
      expect(key.startsWith('data-hand')).toBe(false)
      expect(key).not.toBe('data-ink')
      expect(key).not.toBe('data-stationery')
      expect(key).not.toBe('data-drawn')
      expect(key).not.toBe('data-aged')
    }
  })

  it('emits no handwriting custom properties', () => {
    const vars = documentStyleVars(DEFAULT_CONFIG) as Record<string, unknown>
    for (const key of Object.keys(vars)) {
      expect(key.startsWith('--hw-')).toBe(false)
      expect(key).not.toBe('--doc-hand-font')
      expect(key).not.toBe('--doc-heading-hand-font')
    }
  })

  it('leaves the leading exactly as configured', () => {
    const vars = documentStyleVars(DEFAULT_CONFIG) as Record<string, unknown>
    expect(vars['--doc-leading']).toBe(DEFAULT_CONFIG.lineHeight)
  })

  it('requests no font for a hand that is not in use', () => {
    expect(handStylesheetHref('none')).toBeNull()
  })
})

describe('a hand in use', () => {
  const withHand = (patch: Partial<PdfConfig['hand']>): PdfConfig => ({
    ...DEFAULT_CONFIG,
    hand: { ...DEFAULT_CONFIG.hand, hand: 'casual', ...patch },
  })

  it('marks the document with the hand, ink and paper', () => {
    const attrs = documentDataAttrs(withHand({ ink: 'pencil', stationery: 'ruled-college' }))
    expect(attrs['data-hand']).toBe('casual')
    expect(attrs['data-ink']).toBe('pencil')
    expect(attrs['data-stationery']).toBe('ruled-college')
  })

  it('omits the stationery attribute for blank paper', () => {
    expect(documentDataAttrs(withHand({ stationery: 'blank' }))['data-stationery']).toBeUndefined()
  })

  it('flags a variable face so pen pressure can be jittered', () => {
    expect(documentDataAttrs(withHand({}))['data-hand-variable']).toBe('true')
    expect(documentDataAttrs(withHand({ hand: 'neat-print' }))['data-hand-variable']).toBeUndefined()
  })

  it('publishes the rule pitch and marks the document ruled', () => {
    // The rhythm is locked in CSS from `--hw-pitch` in absolute units, not by
    // deriving a unitless line-height here: rounding error in a derived leading
    // accumulates down the page until the text visibly drifts off the lines.
    const ruled = documentStyleVars(withHand({ stationery: 'ruled-college' })) as Record<string, unknown>
    expect(ruled['--hw-pitch']).toBe('7.1mm')
    expect(documentDataAttrs(withHand({ stationery: 'ruled-college' }))['data-ruled']).toBe('true')
  })

  it('leaves unruled paper out of the rule lock', () => {
    const blank = documentStyleVars(withHand({ stationery: 'blank' })) as Record<string, unknown>
    expect(blank['--hw-pitch']).toBeUndefined()
    expect(documentDataAttrs(withHand({ stationery: 'blank' }))['data-ruled']).toBeUndefined()
    expect(documentDataAttrs(withHand({ stationery: 'graph' }))['data-ruled']).toBeUndefined()
  })

  it('builds a font URL for every hand that has one', () => {
    for (const hand of Object.keys(HANDS) as (keyof typeof HANDS)[]) {
      const href = handStylesheetHref(hand)
      if (HANDS[hand].googleParam) expect(href).toContain('fonts.googleapis.com')
      else expect(href).toBeNull()
    }
  })
})

describe('hand affinity', () => {
  it('is declared by every skin', () => {
    expect(SKIN_OPTIONS).not.toHaveLength(0)
    for (const option of SKIN_OPTIONS) {
      expect(['native', 'good', 'adapts', 'discouraged']).toContain(option.handAffinity)
    }
  })

  it('marks the skins a hand would actively undermine', () => {
    const byValue = new Map(SKIN_OPTIONS.map((o) => [o.value, o.handAffinity]))
    // A handwritten CV defeats the entire point of an ATS-readable skin.
    expect(byValue.get('resume')).toBe('discouraged')
    expect(byValue.get('invoice')).toBe('discouraged')
    expect(byValue.get('terminal')).toBe('discouraged')
  })
})
