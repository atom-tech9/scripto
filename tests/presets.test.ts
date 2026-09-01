import { describe, expect, it } from 'vitest'
import { capturePreset, mergePreset, parsePresets, serializePresets } from '@/lib/presets'
import { DEFAULT_CONFIG, MARGIN_PRESETS } from '@/lib/constants'
import { DOCUMENT_PRESETS } from '@/data/presets'
import type { ExportPreset } from '@/types'

describe('export presets', () => {
  describe('mergePreset', () => {
    it('takes the canonical margins for a named margin preset', () => {
      const next = mergePreset(
        { ...DEFAULT_CONFIG, margins: { top: 1, right: 2, bottom: 3, left: 4 } },
        { marginPreset: 'wide' },
      )
      expect(next.margins).toEqual(MARGIN_PRESETS.wide)
    })

    it('keeps explicit margins when the preset is custom', () => {
      const margins = { top: 9, right: 9, bottom: 9, left: 9 }
      const next = mergePreset(DEFAULT_CONFIG, { marginPreset: 'custom', margins })
      expect(next.margins).toEqual(margins)
    })

    it('leaves the current margins alone when the preset says nothing about them', () => {
      const margins = { top: 5, right: 5, bottom: 5, left: 5 }
      const next = mergePreset({ ...DEFAULT_CONFIG, margins }, { skin: 'swiss' })
      expect(next.margins).toEqual(margins)
      expect(next.skin).toBe('swiss')
    })

    it('applies every built-in theme without dropping the document meta', () => {
      for (const preset of DOCUMENT_PRESETS) {
        const next = mergePreset(DEFAULT_CONFIG, preset.config)
        expect(next.meta).toEqual(DEFAULT_CONFIG.meta)
        if (preset.config.skin) expect(next.skin).toBe(preset.config.skin)
      }
    })
  })

  describe('capturePreset', () => {
    it('captures the look but never the document meta', () => {
      const captured = capturePreset({
        ...DEFAULT_CONFIG,
        skin: 'ledger',
        meta: { ...DEFAULT_CONFIG.meta, title: 'Secret Q4 numbers', author: 'Someone' },
      })
      expect(captured).not.toHaveProperty('meta')
      expect(captured.skin).toBe('ledger')
      expect(captured.paperSize).toBe(DEFAULT_CONFIG.paperSize)
    })
  })

  describe('serialize / parse', () => {
    const preset: ExportPreset = {
      id: 'abc',
      name: 'House style',
      config: { skin: 'swiss', fontSize: 10 },
      createdAt: 1700000000000,
    }

    it('round-trips a preset through the file format', () => {
      expect(parsePresets(serializePresets([preset]))).toEqual([preset])
    })

    it('accepts a bare array, which is the obvious thing to hand-write', () => {
      expect(parsePresets(JSON.stringify([preset]))).toEqual([preset])
    })

    it('returns nothing for malformed JSON', () => {
      expect(parsePresets('{{{')).toEqual([])
      expect(parsePresets('')).toEqual([])
    })

    it('drops entries that are not presets rather than importing junk', () => {
      const raw = JSON.stringify({
        presets: [preset, null, 42, { name: '' }, { name: 'no config' }, { config: {} }],
      })
      expect(parsePresets(raw)).toEqual([preset])
    })

    it('strips document meta out of an imported preset', () => {
      const raw = JSON.stringify([
        { id: 'x', name: 'From a colleague', config: { skin: 'zen', meta: { title: 'theirs' } } },
      ])
      const [imported] = parsePresets(raw)
      expect(imported.config).not.toHaveProperty('meta')
      expect(imported.config.skin).toBe('zen')
    })

    it('caps an absurdly long name', () => {
      const raw = JSON.stringify([{ name: 'x'.repeat(500), config: {} }])
      expect(parsePresets(raw)[0].name).toHaveLength(60)
    })

    it('fills in an id and a timestamp when the file omits them', () => {
      const [imported] = parsePresets(JSON.stringify([{ name: 'Minimal', config: {} }]))
      expect(imported.id).toBeTruthy()
      expect(imported.createdAt).toBeGreaterThan(0)
    })
  })
})
