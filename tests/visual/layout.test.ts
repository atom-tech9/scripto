import { describe, expect, it, vi } from 'vitest'

// The renderer's code-block header pulls a label from the i18n context, which
// needs a React provider we have no use for here — the label is hidden in the
// PDF anyway and never affects layout.
vi.mock('@/i18n', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'en', dir: 'ltr', setLang: () => {} }),
}))

const { findChrome, fixtureSource, paginate, sourceCodeLines } = await import('./harness')
type PageReport = Awaited<ReturnType<typeof paginate>>

/**
 * Layout regressions are invisible to unit tests: every bug fixed in this
 * suite's history was a single CSS declaration that broke rendering while every
 * other test stayed green. These render fixtures through the real export
 * pipeline and Paged.js, then assert on the laid-out result.
 *
 * Needs a Chrome/Chromium binary (CHROME_PATH overrides discovery). Skipped
 * rather than failed where none exists, so `npm test` still works on a bare box.
 */

const FIXTURES = [
  'checklists',
  'code-blocks',
  'tables',
  'structure',
  'rtl-arabic',
  'page-directives',
] as const

// Opt-in: `SCRIPTO_VISUAL=1 npm test`. Headless Chrome's --dump-dom races
// Paged.js's async layout under a virtual time budget, so the run is not yet
// reliable enough to gate every commit on. Everything else about the harness
// works — see docs/VISUAL_REGRESSION.md for the remaining fix.
const enabled = process.env.SCRIPTO_VISUAL === '1' && findChrome() !== null
const suite = enabled ? describe : describe.skip

// One pagination run per fixture, shared by every assertion about it.
const reports = new Map<string, Promise<PageReport>>()
const report = (fixture: string): Promise<PageReport> => {
  if (!reports.has(fixture)) reports.set(fixture, paginate(fixture))
  return reports.get(fixture)!
}

suite(
  'paginated layout',
  () => {
    describe.each(FIXTURES)('%s', (fixture) => {
      it('lays out at least one page', async () => {
        expect((await report(fixture)).pages).toBeGreaterThan(0)
      })

      it('keeps every element inside the page box', async () => {
        // Anything sticking out horizontally is silently clipped in the PDF —
        // there is no scrollbar on paper. This is what caught the flex task-list,
        // the unwrapped code lines, and the overflowing wide tables.
        const { overflowing } = await report(fixture)
        expect(overflowing).toEqual([])
      })

      it('renders every source code line exactly once, in order', async () => {
        // Paged.js can drop the line straddling a page edge when it fragments a
        // code block, leaving an empty shell behind. Comparing the rendered run
        // against the source is the only way to see it.
        const { codeLines } = await report(fixture)
        const source = sourceCodeLines(fixtureSource(fixture))
        expect(codeLines.map((l) => l.text.replace(/\n$/, ''))).toEqual(source)
      })

      it('never renders a blank line where the source has content', async () => {
        const { codeLines } = await report(fixture)
        const source = sourceCodeLines(fixtureSource(fixture))
        const blanked = codeLines.filter(
          (rendered, index) => !rendered.text.trim() && (source[index] ?? '').trim(),
        )
        expect(blanked).toEqual([])
      })
    })

    it('honours ::page-break and :::landscape', async () => {
      const { pages } = await report('page-directives')
      // Two forced breaks plus a landscape section that breaks either side.
      expect(pages).toBeGreaterThanOrEqual(4)
    })

    /**
     * Was an upstream stall, now a regression guard.
     *
     * Paged.js 0.4.3 stalls when a replaced element has to be placed at a page
     * boundary: two pages lay out and the chunker stops dead, never firing its
     * `after` hook. `flattenImages` swaps every `<img>` for an equivalent
     * background-image box before pagination, which the chunker handles fine.
     *
     * The 25 s cap keeps a regression fast to spot -- the original stall was
     * unbounded. See docs/PAGEDJS_IMAGE_STALL.md.
     */
    it('paginates an image sitting on a page boundary', async () => {
      const { pages } = await paginate('image-stall', {}, { timeoutMs: 25_000 })
      expect(pages).toBeGreaterThan(0)
    })
  },
  240_000,
)
