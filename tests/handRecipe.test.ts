import { describe, expect, it } from 'vitest'
import { decodeHandRecipe, encodeHandRecipe } from '@/lib/handwriting/recipe'
import { DEFAULT_CONFIG } from '@/lib/constants'

const base = DEFAULT_CONFIG.hand

describe('shareable handwriting recipes', () => {
  it('round-trips a setup through a link', () => {
    const hand = {
      ...base,
      hand: 'copperplate',
      headingHand: 'marker',
      ink: 'sepia',
      stationery: 'parchment',
      variation: 'expressive',
      neatness: 0.35,
      slant: -0.4,
      aging: 0.6,
      drawnElements: true,
      maskRules: false,
    } as const
    const decoded = decodeHandRecipe(encodeHandRecipe(hand))
    expect(decoded).toMatchObject({
      hand: 'copperplate',
      headingHand: 'marker',
      ink: 'sepia',
      stationery: 'parchment',
      variation: 'expressive',
      neatness: 0.35,
      slant: -0.4,
      aging: 0.6,
      drawnElements: true,
      maskRules: false,
    })
  })

  it('refuses a recipe whose hand is not one we ship', () => {
    // The parameter is attacker-controlled: an unknown value must never reach
    // the renderer, and a half-parsed setup is worse than none.
    expect(decodeHandRecipe('evil~same~sepia~blank~none~100~0~0~0~0')).toBeNull()
    expect(decodeHandRecipe('')).toBeNull()
    expect(decodeHandRecipe('../../etc/passwd')).toBeNull()
  })

  it('never shares a custom hand, which only exists in its author browser', () => {
    expect(decodeHandRecipe('custom~same~sepia~blank~none~100~0~0~0~0')).toBeNull()
    expect(encodeHandRecipe({ ...base, hand: 'casual', customHand: 'abc123' })).not.toContain('abc123')
  })

  it('drops unknown field values instead of applying them', () => {
    const decoded = decodeHandRecipe('casual~same~NOT_AN_INK~NOT_PAPER~none~50~0~0~1~0')
    expect(decoded?.hand).toBe('casual')
    expect(decoded).not.toHaveProperty('ink')
    expect(decoded).not.toHaveProperty('stationery')
  })

  it('clamps sliders that arrive out of range', () => {
    const decoded = decodeHandRecipe('casual~same~pencil~blank~none~9900~-9900~500~1~1')
    expect(decoded?.neatness).toBe(1)
    expect(decoded?.slant).toBe(-1)
    expect(decoded?.aging).toBe(1)
  })

  it('survives a truncated recipe', () => {
    expect(decodeHandRecipe('casual')).toMatchObject({ hand: 'casual' })
  })

  it('keeps decimals intact -- the separator must not be the decimal point', () => {
    const link = encodeHandRecipe({ ...base, hand: 'casual', neatness: 0.35, aging: 0.6 })
    expect(decodeHandRecipe(link)).toMatchObject({ neatness: 0.35, aging: 0.6 })
  })
})
