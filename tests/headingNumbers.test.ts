import { describe, expect, it } from 'vitest'
import { startsWithManualNumber } from '../src/lib/headingNumbers'

describe('startsWithManualNumber', () => {
  it('detects common manual numbering styles', () => {
    expect(startsWithManualNumber('1. Executive Summary')).toBe(true)
    expect(startsWithManualNumber('3.1 Compute Instance')).toBe(true)
    expect(startsWithManualNumber('10.2.4 Deep Section')).toBe(true)
    expect(startsWithManualNumber('2) Scope')).toBe(true)
    expect(startsWithManualNumber('  4. Indented')).toBe(true)
    expect(startsWithManualNumber('1.0 Overview')).toBe(true)
  })

  it('detects Arabic-Indic numbering', () => {
    expect(startsWithManualNumber('١. الملخص التنفيذي')).toBe(true)
    expect(startsWithManualNumber('٣.١ التخزين')).toBe(true)
  })

  it('handles glued and malformed spacing', () => {
    expect(startsWithManualNumber('1.Introduction')).toBe(true)
    expect(startsWithManualNumber('2)Scope')).toBe(true)
    expect(startsWithManualNumber('1.5x Faster')).toBe(false)
  })

  it('leaves ordinary headings alone', () => {
    expect(startsWithManualNumber('Executive Summary')).toBe(false)
    expect(startsWithManualNumber('2024 Annual Report')).toBe(false)
    expect(startsWithManualNumber('Top 10 Tips')).toBe(false)
    expect(startsWithManualNumber('3D Rendering')).toBe(false)
    expect(startsWithManualNumber('42')).toBe(false)
    expect(startsWithManualNumber('')).toBe(false)
  })
})
