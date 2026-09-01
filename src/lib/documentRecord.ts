import { DEFAULT_CONFIG } from '@/lib/constants'
import type { DocumentRecord, PdfConfig } from '@/types'

/**
 * Validation for document records arriving from outside the running app:
 * localStorage (which can be hand-edited, or left half-written by an older
 * build) and the JSON files `importDocs` accepts. Keeping it here rather than
 * inside the hook makes the boundary explicit and directly testable.
 */

function now(): number {
  return Date.now()
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `doc-${now()}-${Math.floor(Math.random() * 1e6)}`
}

/** Coerce one untrusted metadata field to the string the UI expects. */
function asText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * Merge a stored or imported config over the defaults, nested objects included.
 *
 * Everything that reaches here is untrusted: localStorage can be hand-edited or
 * left half-written by an older build, and `importDocs` takes a JSON file the
 * user picked. A shallow spread was not enough — a record carrying
 * `meta: { title: 1 }`, or no `meta` at all, used to reach the UI and crash it
 * on `config.meta.title.toLowerCase()`, with no way out but clearing storage.
 */
export function normaliseConfig(raw: unknown): PdfConfig {
  const partial = (raw && typeof raw === 'object' ? raw : {}) as Partial<PdfConfig>
  const meta = (partial.meta && typeof partial.meta === 'object' ? partial.meta : {}) as Partial<
    PdfConfig['meta']
  >
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    meta: {
      title: asText(meta.title, DEFAULT_CONFIG.meta.title),
      author: asText(meta.author, DEFAULT_CONFIG.meta.author),
      subject: asText(meta.subject, DEFAULT_CONFIG.meta.subject),
      keywords: asText(meta.keywords, DEFAULT_CONFIG.meta.keywords),
      subtitle: asText(meta.subtitle, DEFAULT_CONFIG.meta.subtitle),
      organization: asText(meta.organization, DEFAULT_CONFIG.meta.organization),
      date: asText(meta.date, DEFAULT_CONFIG.meta.date),
      version: asText(meta.version, DEFAULT_CONFIG.meta.version),
      docType: asText(meta.docType, DEFAULT_CONFIG.meta.docType),
    },
    hand: { ...DEFAULT_CONFIG.hand, ...(partial.hand && typeof partial.hand === 'object' ? partial.hand : {}) },
    margins: { ...DEFAULT_CONFIG.margins, ...(partial.margins ?? {}) },
    customSize: { ...DEFAULT_CONFIG.customSize, ...(partial.customSize ?? {}) },
  }
}

/** Narrow one untrusted record into a document, or null if it is unusable. */
export function normaliseDoc(raw: unknown): DocumentRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Partial<DocumentRecord>
  if (typeof record.content !== 'string') return null
  return {
    id: typeof record.id === 'string' && record.id ? record.id : newId(),
    content: record.content,
    config: normaliseConfig(record.config),
    createdAt: typeof record.createdAt === 'number' ? record.createdAt : now(),
    updatedAt: typeof record.updatedAt === 'number' ? record.updatedAt : now(),
  }
}
