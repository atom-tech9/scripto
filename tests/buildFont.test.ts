import { describe, expect, it } from 'vitest'
import { ALPHABET, buildFont, buildGlyph, drawnCount, type Stroke } from '@/lib/handwriting/buildFont'

/** A short diagonal stroke across a 200px capture square. */
function stroke(x: number, y: number, length = 60): Stroke {
  return Array.from({ length: 12 }, (_, i) => [x + (i / 11) * length, y + (i / 11) * length, 0.5])
}

describe('drawing an alphabet into a font', () => {
  it('covers the characters the brief scopes in', () => {
    expect(ALPHABET).toContain('A')
    expect(ALPHABET).toContain('z')
    expect(ALPHABET).toContain('7')
    expect(ALPHABET).toContain('?')
    // Arabic is deliberately out of scope: it needs four positional forms per
    // letter plus shaping, which is a different project.
    expect(ALPHABET.some((c) => /[؀-ۿ]/.test(c))).toBe(false)
  })

  it('gives a wide character a wider advance than a narrow one', () => {
    const narrow = buildGlyph('i', [stroke(90, 40, 6)], 200)
    const wide = buildGlyph('m', [stroke(20, 40, 150)], 200)
    expect(wide.advanceWidth).toBeGreaterThan(narrow.advanceWidth!)
  })

  it('gives an undrawn character a blank advance rather than an empty box', () => {
    const glyph = buildGlyph('q', [], 200)
    expect(glyph.advanceWidth).toBeGreaterThan(0)
    expect(glyph.path.commands).toHaveLength(0)
  })

  it('writes a real OpenType file from a partial alphabet', () => {
    const drawn = new Map<string, Stroke[]>([
      ['A', [stroke(40, 40)]],
      ['b', [stroke(40, 50)]],
    ])
    const bytes = buildFont('Test Hand', drawn, 200)
    expect(bytes.byteLength).toBeGreaterThan(500)
    // 'OTTO' — a CFF-flavoured OpenType font, which is what opentype.js emits.
    expect([...new Uint8Array(bytes, 0, 4)]).toEqual([0x4f, 0x54, 0x54, 0x4f])
  })

  it('counts only the characters actually drawn', () => {
    const drawn = new Map<string, Stroke[]>([
      ['A', [stroke(40, 40)]],
      ['B', []],
    ])
    expect(drawnCount(drawn)).toBe(1)
  })
})
