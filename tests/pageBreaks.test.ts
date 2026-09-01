import { describe, expect, it } from 'vitest'
import {
  findPageBreaks,
  insertPageBreak,
  removePageBreak,
  toDocumentLine,
  wrapKeepTogether,
  wrapLandscape,
} from '@/pdf/pageBreaks'

const DOC = [
  '# Title',
  '',
  'First paragraph.',
  '',
  'Second paragraph.',
  '',
  '## Section',
  '',
  'Third.',
].join('\n')

describe('page-break directives', () => {
  describe('insert', () => {
    it('puts the directive before the target block', () => {
      // Line 5 is "Second paragraph."
      const next = insertPageBreak(DOC, 5)
      const lines = next.split('\n')
      expect(lines[4]).toBe('::page-break')
      expect(lines[6]).toBe('Second paragraph.')
    })

    it('snaps back to the block start rather than splitting a paragraph', () => {
      const source = ['One', 'Two'].join('\n')
      expect(insertPageBreak(source, 2)).toBe(['::page-break', '', 'One', 'Two'].join('\n'))
    })

    it('needs no leading blank at the very start of the document', () => {
      expect(insertPageBreak(DOC, 1).split('\n')[0]).toBe('::page-break')
    })

    it('clamps a line past the end of the document', () => {
      expect(insertPageBreak(DOC, 999)).toContain('::page-break')
    })
  })

  describe('round trip', () => {
    it('restores the document byte for byte at a block boundary', () => {
      for (const line of [1, 3, 5, 7, 9]) {
        const inserted = insertPageBreak(DOC, line)
        const breaks = findPageBreaks(inserted)
        expect(breaks).toHaveLength(1)
        expect(removePageBreak(inserted, breaks[0])).toBe(DOC)
      }
    })

    it('restores the document byte for byte from inside a paragraph too', () => {
      const source = ['Intro', '', 'One', 'Two'].join('\n')
      const inserted = insertPageBreak(source, 4)
      expect(removePageBreak(inserted, findPageBreaks(inserted)[0])).toBe(source)
    })

    it('survives several independent inserts and removes', () => {
      let doc = insertPageBreak(DOC, 5)
      doc = insertPageBreak(doc, 1)
      expect(findPageBreaks(doc)).toHaveLength(2)
      for (const line of [...findPageBreaks(doc)].reverse()) doc = removePageBreak(doc, line)
      expect(doc).toBe(DOC)
    })
  })

  describe('remove', () => {
    it('leaves the document alone when the line is not a directive', () => {
      expect(removePageBreak(DOC, 3)).toBe(DOC)
    })

    it('leaves the document alone for an out-of-range line', () => {
      expect(removePageBreak(DOC, 999)).toBe(DOC)
    })
  })

  describe('findPageBreaks', () => {
    it('reports 1-based lines and ignores indented look-alikes in prose', () => {
      const source = ['a', '::page-break', 'b', 'text ::page-break inline', '::page-break'].join(
        '\n',
      )
      expect(findPageBreaks(source)).toEqual([2, 5])
    })

    it('returns nothing for a document with no breaks', () => {
      expect(findPageBreaks(DOC)).toEqual([])
    })
  })

  describe('containers', () => {
    it('wraps a run in :::keep-together', () => {
      const next = wrapKeepTogether(DOC, 3, 3).split('\n')
      expect(next[2]).toBe(':::keep-together')
      expect(next[3]).toBe('First paragraph.')
      expect(next[4]).toBe(':::')
    })

    it('extends the wrap to the end of the block the selection lands in', () => {
      const source = ['Intro', '', 'Line one', 'Line two', '', 'After'].join('\n')
      const next = wrapLandscape(source, 3, 3).split('\n')
      expect(next).toEqual([
        'Intro',
        '',
        ':::landscape',
        'Line one',
        'Line two',
        ':::',
        '',
        'After',
      ])
    })

    it('keeps the wrapped content intact', () => {
      const wrapped = wrapKeepTogether(DOC, 7, 9)
      expect(wrapped).toContain('## Section')
      expect(wrapped).toContain('Third.')
      expect(wrapped.split('\n').filter((l) => l === ':::')).toHaveLength(1)
    })
  })

  describe('toDocumentLine', () => {
    it('adds the front-matter offset', () => {
      expect(toDocumentLine(4, 6)).toBe(10)
      expect(toDocumentLine(1, 0)).toBe(1)
    })
  })
})
