import { Font, Glyph, Path } from 'opentype.js'
import getStroke from 'perfect-freehand'

/**
 * Build a real OpenType font from strokes drawn in the browser.
 *
 * Strokes are captured as vectors from the first pointer event, so there is no
 * raster-tracing step anywhere: `perfect-freehand` turns each pointer path into
 * a variable-width outline, and `opentype.js` assembles those outlines into
 * glyphs and writes the `.otf`. Entirely offline — no account, no upload, no
 * third-party service.
 *
 * Latin letters, digits and common punctuation only. Arabic needs four
 * positional forms per letter plus shaping rules, which is a different and much
 * larger project; the UI says so rather than producing something broken.
 */

/** One captured pointer stroke: x, y and pressure per sample. */
export type Point = readonly [x: number, y: number, pressure: number]
export type Stroke = readonly Point[]

/** The design grid a glyph is drawn on, in font units. */
export const UNITS_PER_EM = 1000
/** Where the baseline sits in that grid, matching the canvas guide. */
export const BASELINE = 750
export const ASCENDER = 800
export const DESCENDER = -200

/** Blank space on each side of a glyph, as a fraction of its drawn width. */
const SIDE_BEARING_RATIO = 0.08
/** Advance for the space character, and for a character drawn with no strokes. */
const BLANK_ADVANCE = Math.round(UNITS_PER_EM * 0.28)

export const ALPHABET: readonly string[] = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'abcdefghijklmnopqrstuvwxyz',
  ...'0123456789',
  ...'.,;:\'"!?-()/&@#%+=',
]

const STROKE_OPTIONS = {
  size: 16,
  thinning: 0.55,
  smoothing: 0.6,
  streamline: 0.5,
  simulatePressure: true,
}

/**
 * Outline one stroke.
 *
 * `perfect-freehand` returns the stroke as a closed polygon of outline points,
 * which is exactly what a glyph contour is — hence no tracing step.
 */
function outline(stroke: Stroke): [number, number][] {
  return getStroke(stroke.map(([x, y, pressure]) => [x, y, pressure]), STROKE_OPTIONS) as [
    number,
    number,
  ][]
}

/** Canvas y grows downward; font y grows upward from the baseline. */
function toFontSpace(y: number, canvasSize: number): number {
  return BASELINE - (y / canvasSize) * UNITS_PER_EM
}

function toFontX(x: number, canvasSize: number): number {
  return (x / canvasSize) * UNITS_PER_EM
}

interface Contour {
  readonly points: readonly [number, number][]
}

/**
 * Turn the strokes for one character into a glyph.
 *
 * Side bearings come from the drawn bounding box, so a narrow `i` advances less
 * than a wide `m` without the user setting anything. No kerning pairs — the
 * brief scopes those out, and guessing them makes writing look worse, not better.
 */
export function buildGlyph(char: string, strokes: readonly Stroke[], canvasSize: number): Glyph {
  const contours: Contour[] = strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) => ({
      points: outline(stroke).map(
        ([x, y]) => [toFontX(x, canvasSize), toFontSpace(y, canvasSize)] as [number, number],
      ),
    }))
    .filter((contour) => contour.points.length > 2)

  const unicode = char.codePointAt(0)
  if (contours.length === 0) {
    return new Glyph({ name: char, unicode, advanceWidth: BLANK_ADVANCE, path: new Path() })
  }

  const xs = contours.flatMap((contour) => contour.points.map(([x]) => x))
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const bearing = Math.max(8, Math.round((maxX - minX) * SIDE_BEARING_RATIO))

  const path = new Path()
  for (const contour of contours) {
    contour.points.forEach(([x, y], index) => {
      // Shift so the drawn ink starts one bearing in from the origin.
      const px = Math.round(x - minX + bearing)
      const py = Math.round(y)
      if (index === 0) path.moveTo(px, py)
      else path.lineTo(px, py)
    })
    path.close()
  }

  return new Glyph({
    name: char,
    unicode,
    advanceWidth: Math.round(maxX - minX + bearing * 2),
    path,
  })
}

/**
 * Assemble the drawn characters into an `.otf`.
 *
 * Characters with no strokes are simply left out, so a half-finished alphabet
 * still produces a usable font rather than a file full of empty boxes.
 */
export function buildFont(
  familyName: string,
  drawn: ReadonlyMap<string, readonly Stroke[]>,
  canvasSize: number,
): ArrayBuffer {
  const notdef = new Glyph({ name: '.notdef', unicode: 0, advanceWidth: BLANK_ADVANCE, path: new Path() })
  const space = new Glyph({ name: 'space', unicode: 32, advanceWidth: BLANK_ADVANCE, path: new Path() })

  const glyphs: Glyph[] = [notdef, space]
  for (const char of ALPHABET) {
    const strokes = drawn.get(char)
    if (strokes && strokes.length > 0) glyphs.push(buildGlyph(char, strokes, canvasSize))
  }

  const font = new Font({
    familyName,
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs,
  })

  return font.toArrayBuffer()
}

/** How many characters of the alphabet have been drawn. */
export function drawnCount(drawn: ReadonlyMap<string, readonly Stroke[]>): number {
  return ALPHABET.filter((char) => (drawn.get(char)?.length ?? 0) > 0).length
}
