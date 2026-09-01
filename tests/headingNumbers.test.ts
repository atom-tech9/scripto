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

  it('detects a number separated by a middot, dash or colon', () => {
    // Reported from a real document: every "# 1 · Meta" heading was numbered
    // again by the auto counter, giving "2.  1 · Meta" and pushing every
    // following section one out.
    expect(startsWithManualNumber('1 · META — Facebook Pages')).toBe(true)
    expect(startsWithManualNumber('2 · TikTok')).toBe(true)
    expect(startsWithManualNumber('4 — Rollout')).toBe(true)
    expect(startsWithManualNumber('5 – Alternatives')).toBe(true)
    expect(startsWithManualNumber('6 - Appendix')).toBe(true)
    expect(startsWithManualNumber('7: Glossary')).toBe(true)
    expect(startsWithManualNumber('8 | Index')).toBe(true)
    expect(startsWithManualNumber('10 · Apple Business Connect')).toBe(true)
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
