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
     * Known upstream defect, kept as a tripwire.
     *
     * Paged.js 0.4.3 stalls when an `<img>` has to be placed at a page boundary:
     * it lays out two pages and then stops dead — no further pages, and the
     * `after` hook never fires. Bisected down from the `checklists` fixture; it is
     * the replaced element itself, not RTL, task lists, `break-inside: avoid`,
     * `overflow-x`, image dimensions or image preloading. Replacing the `<img>`
     * with any non-replaced element paginates fine.
     *
     * `it.fails` passes while the bug is present and starts failing the moment it
     * is fixed, so the mitigation can be removed deliberately rather than by
     * accident. The 25 s cap keeps the suite fast — the real stall is unbounded.
     *
     * See docs/PAGEDJS_IMAGE_STALL.md.
     */
    it.fails('stalls when an image lands on a page boundary (pagedjs#0.4.3)', async () => {
      const { pages } = await paginate('image-stall', {}, { timeoutMs: 25_000 })
      expect(pages).toBeGreaterThan(0)
    })
  },
  240_000,
)
