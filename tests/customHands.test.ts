import { describe, expect, it } from 'vitest'
import { customFamily, looksLikeFont, MAX_FONT_BYTES } from '@/lib/handwriting/customHands'

function bytes(...head: number[]): ArrayBuffer {
  return new Uint8Array([...head, 0, 0, 0, 0]).buffer
}

describe('accepting a handwriting font', () => {
  it('accepts the formats a browser can register', () => {
    expect(looksLikeFont(bytes(0x00, 0x01, 0x00, 0x00))).toBe(true) // TrueType
    expect(looksLikeFont(bytes(0x4f, 0x54, 0x54, 0x4f))).toBe(true) // OTTO
    expect(looksLikeFont(bytes(0x77, 0x4f, 0x46, 0x46))).toBe(true) // wOFF
    expect(looksLikeFont(bytes(0x77, 0x4f, 0x46, 0x32))).toBe(true) // wOF2
  })

  it('refuses anything that is not a font', () => {
    // The bytes go straight to the font system, so a mislabelled file has to be
    // caught here rather than surfacing as an opaque FontFace rejection.
    expect(looksLikeFont(bytes(0x89, 0x50, 0x4e, 0x47))).toBe(false) // PNG
    expect(looksLikeFont(bytes(0x25, 0x50, 0x44, 0x46))).toBe(false) // PDF
    expect(looksLikeFont(bytes(0x3c, 0x21, 0x44, 0x4f))).toBe(false) // HTML
    expect(looksLikeFont(new Uint8Array([0x00]).buffer)).toBe(false) // truncated
  })

  it('caps the size well below anything a real handwriting font needs', () => {
    expect(MAX_FONT_BYTES).toBe(5 * 1024 * 1024)
  })

  it('gives each stored hand its own family so they never collide', () => {
    expect(customFamily('abc')).not.toBe(customFamily('abd'))
  })
})
