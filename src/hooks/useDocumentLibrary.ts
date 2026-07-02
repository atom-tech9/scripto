import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/lib/constants'
import { SAMPLE_DOCUMENT } from '@/data/sampleDocument'
import { getErrorMessage, logger } from '@/lib/logger'
import type { DocumentLibrary, DocumentRecord, PdfConfig } from '@/types'

const LIBRARY_KEY = 'scripto:library:v1'
const WRITE_DEBOUNCE_MS = 300

function now(): number {
  return Date.now()
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `doc-${now()}-${Math.floor(Math.random() * 1e6)}`
}

function makeDoc(content: string, config: PdfConfig): DocumentRecord {
  const ts = now()
  return { id: newId(), content, config, createdAt: ts, updatedAt: ts }
}

/** Seed the library, migrating any pre-existing single-document state. */
function seedLibrary(): DocumentLibrary {
  let content = SAMPLE_DOCUMENT
  let config = DEFAULT_CONFIG
  try {
    const prevDoc = window.localStorage.getItem(STORAGE_KEYS.document)
    const prevConfig = window.localStorage.getItem(STORAGE_KEYS.config)
    if (prevDoc) content = JSON.parse(prevDoc) as string
    if (prevConfig) config = { ...DEFAULT_CONFIG, ...(JSON.parse(prevConfig) as PdfConfig) }
  } catch {
    /* fall back to defaults */
  }
  const doc = makeDoc(content, config)
  return { docs: [doc], activeId: doc.id }
}

function loadLibrary(): DocumentLibrary {
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DocumentLibrary
      if (parsed?.docs?.length) return parsed
    }
  } catch (error) {
    logger.warn(`Failed to read document library: ${getErrorMessage(error)}`)
  }
  return seedLibrary()
}

export interface DocumentLibraryApi {
  docs: DocumentRecord[]
  activeId: string
  activeDoc: DocumentRecord
  selectDoc: (id: string) => void
  updateContent: (content: string) => void
  updateConfig: (updater: PdfConfig | ((prev: PdfConfig) => PdfConfig)) => void
  createDoc: (content?: string, title?: string) => void
  duplicateDoc: (id: string) => void
  deleteDoc: (id: string) => void
  importDocs: (records: DocumentRecord[]) => number
}

/**
 * Manages a local library of documents, each carrying its own content and
 * export config. Persists to localStorage and always keeps at least one doc.
 */
export function useDocumentLibrary(): DocumentLibraryApi {
  // React state is authoritative and updates instantly on every keystroke; the
  // (expensive) localStorage serialization is debounced so typing stays smooth.
  const [library, setLibraryState] = useState<DocumentLibrary>(loadLibrary)
  const libraryRef = useRef(library)
  libraryRef.current = library
  const writeTimer = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    window.clearTimeout(writeTimer.current)
    try {
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryRef.current))
    } catch (error) {
      logger.warn(`Failed to persist document library: ${getErrorMessage(error)}`)
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22)
      ) {
        window.dispatchEvent(new CustomEvent('scripto:quota-exceeded'))
      }
    }
  }, [])

  const setLibrary = useCallback(
    (updater: DocumentLibrary | ((prev: DocumentLibrary) => DocumentLibrary)) => {
      setLibraryState((prev) => {
        const next = updater instanceof Function ? updater(prev) : updater
        libraryRef.current = next
        window.clearTimeout(writeTimer.current)
        writeTimer.current = window.setTimeout(flush, WRITE_DEBOUNCE_MS)
        return next
      })
    },
    [flush],
  )

  // Persist pending changes on tab hide/close and on unmount.
  useEffect(() => {
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      flush()
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [flush])

  const activeDoc = useMemo(
    () => library.docs.find((d) => d.id === library.activeId) ?? library.docs[0],
    [library],
  )

  const patchActive = useCallback(
    (patch: (doc: DocumentRecord) => DocumentRecord) => {
      setLibrary((prev) => ({
        ...prev,
        docs: prev.docs.map((d) => (d.id === prev.activeId ? patch(d) : d)),
      }))
    },
    [setLibrary],
  )

  const updateContent = useCallback(
    (content: string) => patchActive((d) => ({ ...d, content, updatedAt: now() })),
    [patchActive],
  )

  const updateConfig = useCallback(
    (updater: PdfConfig | ((prev: PdfConfig) => PdfConfig)) =>
      patchActive((d) => ({
        ...d,
        config: typeof updater === 'function' ? updater(d.config) : updater,
        updatedAt: now(),
      })),
    [patchActive],
  )

  const selectDoc = useCallback(
    (id: string) => setLibrary((prev) => ({ ...prev, activeId: id })),
    [setLibrary],
  )

  const createDoc = useCallback(
    (content = '# Untitled\n\n', title = 'Untitled Document') => {
      const doc = makeDoc(content, {
        ...DEFAULT_CONFIG,
        meta: { ...DEFAULT_CONFIG.meta, title },
      })
      setLibrary((prev) => ({ docs: [...prev.docs, doc], activeId: doc.id }))
    },
    [setLibrary],
  )

  const duplicateDoc = useCallback(
    (id: string) => {
      setLibrary((prev) => {
        const source = prev.docs.find((d) => d.id === id)
        if (!source) return prev
        const copy = makeDoc(source.content, {
          ...source.config,
          meta: { ...source.config.meta, title: `${source.config.meta.title} (copy)` },
        })
        return { docs: [...prev.docs, copy], activeId: copy.id }
      })
    },
    [setLibrary],
  )

  const deleteDoc = useCallback(
    (id: string) => {
      setLibrary((prev) => {
        const remaining = prev.docs.filter((d) => d.id !== id)
        if (remaining.length === 0) {
          const fresh = makeDoc('# Untitled\n\n', DEFAULT_CONFIG)
          return { docs: [fresh], activeId: fresh.id }
        }
        const activeId = prev.activeId === id ? remaining[0].id : prev.activeId
        return { docs: remaining, activeId }
      })
    },
    [setLibrary],
  )

  const importDocs = useCallback(
    (records: DocumentRecord[]): number => {
      const valid = records.filter(
        (r) => r && typeof r.content === 'string' && r.config && typeof r.config === 'object',
      )
      if (valid.length === 0) return 0
      const rehydrated = valid.map((r) => ({
        ...makeDoc(r.content, { ...DEFAULT_CONFIG, ...r.config }),
        createdAt: r.createdAt ?? now(),
      }))
      setLibrary((prev) => ({ docs: [...prev.docs, ...rehydrated], activeId: rehydrated[0].id }))
      return rehydrated.length
    },
    [setLibrary],
  )

  return {
    docs: library.docs,
    activeId: library.activeId,
    activeDoc,
    selectDoc,
    updateContent,
    updateConfig,
    createDoc,
    duplicateDoc,
    deleteDoc,
    importDocs,
  }
}
