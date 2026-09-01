import { readRecord, writeRecord } from '@/lib/docStore'
import { getErrorMessage, logger } from '@/lib/logger'

/**
 * Fonts the user made from their own handwriting.
 *
 * The bytes never leave the browser: they are stored in IndexedDB and registered
 * at runtime through the `FontFace` API, which is also what gets them embedded
 * in the exported PDF. Nothing is uploaded anywhere, and the dialog says so.
 */

const RECORD = 'customHands'

/** Anything larger is a mistake, not a handwriting font. */
export const MAX_FONT_BYTES = 5 * 1024 * 1024

export interface CustomHand {
  readonly id: string
  readonly name: string
  readonly bytes: ArrayBuffer
  readonly addedAt: number
}

/** The CSS family a stored hand is registered under. */
export function customFamily(id: string): string {
  return `Scripto Hand ${id}`
}

/**
 * Font formats we accept, by their leading bytes.
 *
 * Checking the extension is not enough: the file is handed straight to the
 * font system, so anything that is not a font has to be refused before it gets
 * there rather than surfacing as an opaque `FontFace` rejection.
 */
const SIGNATURES: readonly (readonly number[])[] = [
  [0x00, 0x01, 0x00, 0x00], // TrueType
  [0x4f, 0x54, 0x54, 0x4f], // 'OTTO' — CFF OpenType
  [0x74, 0x72, 0x75, 0x65], // 'true'
  [0x74, 0x74, 0x63, 0x66], // 'ttcf' — TrueType collection
  [0x77, 0x4f, 0x46, 0x46], // 'wOFF'
  [0x77, 0x4f, 0x46, 0x32], // 'wOF2'
]

export function looksLikeFont(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 4) return false
  const head = new Uint8Array(bytes, 0, 4)
  return SIGNATURES.some((signature) => signature.every((byte, i) => head[i] === byte))
}

export type ImportFailure = 'too-large' | 'not-a-font' | 'rejected' | 'no-storage'

interface StoredHand {
  id: string
  name: string
  bytes: ArrayBuffer
  addedAt: number
}

async function readAll(): Promise<StoredHand[]> {
  const stored = await readRecord<StoredHand[]>(RECORD)
  if (!Array.isArray(stored)) return []
  // Anything that survived a bad write or a hand-edited store is dropped rather
  // than handed to the font system.
  return stored.filter(
    (hand): hand is StoredHand =>
      typeof hand?.id === 'string' &&
      typeof hand.name === 'string' &&
      hand.bytes instanceof ArrayBuffer,
  )
}

export async function listCustomHands(): Promise<CustomHand[]> {
  return readAll()
}

/** Register one stored hand with the document so CSS can name it. */
async function register(hand: StoredHand): Promise<boolean> {
  try {
    const face = new FontFace(customFamily(hand.id), hand.bytes)
    await face.load()
    document.fonts.add(face)
    return true
  } catch (error) {
    logger.warn(`custom hand "${hand.name}" could not be registered: ${getErrorMessage(error)}`)
    return false
  }
}

/**
 * Register every stored hand. Called once on start-up, because a document can
 * reference a custom hand in its front-matter before any dialog is opened.
 */
export async function registerCustomHands(): Promise<void> {
  for (const hand of await readAll()) await register(hand)
}

/** Import a font file. Returns the new hand, or why it was refused. */
export async function addCustomHand(
  name: string,
  file: File,
): Promise<{ hand: CustomHand } | { error: ImportFailure }> {
  if (file.size > MAX_FONT_BYTES) return { error: 'too-large' }

  const bytes = await file.arrayBuffer()
  if (!looksLikeFont(bytes)) return { error: 'not-a-font' }

  const hand: StoredHand = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || file.name.replace(/\.[^.]+$/, ''),
    bytes,
    addedAt: Date.now(),
  }

  // Register before storing: a font the browser refuses is not worth keeping,
  // and the user gets told now rather than the next time they open the app.
  if (!(await register(hand))) return { error: 'rejected' }
  if (!(await writeRecord(RECORD, [...(await readAll()), hand]))) return { error: 'no-storage' }

  return { hand }
}

/** Store a font built in the browser from drawn strokes. */
export async function addDrawnHand(
  name: string,
  bytes: ArrayBuffer,
): Promise<{ hand: CustomHand } | { error: ImportFailure }> {
  if (bytes.byteLength > MAX_FONT_BYTES) return { error: 'too-large' }
  if (!looksLikeFont(bytes)) return { error: 'not-a-font' }

  const hand: StoredHand = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'My handwriting',
    bytes,
    addedAt: Date.now(),
  }
  if (!(await register(hand))) return { error: 'rejected' }
  if (!(await writeRecord(RECORD, [...(await readAll()), hand]))) return { error: 'no-storage' }
  return { hand }
}

export async function renameCustomHand(id: string, name: string): Promise<void> {
  const next = (await readAll()).map((hand) =>
    hand.id === id ? { ...hand, name: name.trim() || hand.name } : hand,
  )
  await writeRecord(RECORD, next)
}

export async function deleteCustomHand(id: string): Promise<void> {
  await writeRecord(
    RECORD,
    (await readAll()).filter((hand) => hand.id !== id),
  )
}
