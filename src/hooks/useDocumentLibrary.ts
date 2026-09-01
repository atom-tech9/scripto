import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/lib/constants'
import { normaliseDoc } from '@/lib/documentRecord'
import {
  LIBRARY_RECORD,
  SNAPSHOTS_RECORD,
  isStoreAvailable,
  readRecord,
  writeRecord,
} from '@/lib/docStore'
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
      const parsed = JSON.parse(raw) as unknown
      const docs = (
        Array.isArray((parsed as DocumentLibrary)?.docs) ? (parsed as DocumentLibrary).docs : []
      )
        .map(normaliseDoc)
        .filter((doc): doc is DocumentRecord => doc !== null)
      if (docs.length > 0) {
        const storedId = (parsed as DocumentLibrary).activeId
        const activeId = docs.some((doc) => doc.id === storedId) ? storedId : docs[0].id
        return { docs, activeId }
      }
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
  /** Past versions of the active document, newest first. */
  snapshots: DocumentSnapshot[]
  /** Replace the active document's content with a past version. */
  restoreSnapshot: (takenAt: number) => void
}

/** One past version of a document. */
export interface DocumentSnapshot {
  readonly docId: string
  readonly takenAt: number
  readonly content: string
}

/**
 * Manages a local library of documents, each carrying its own content and
 * export config. Persists to localStorage and always keeps at least one doc.
 */
/** Set once the library has been copied into IndexedDB and verified. */
const MIGRATED_KEY = 'scripto:library-migrated'

/** How many past versions to keep per document. */
const MAX_SNAPSHOTS = 20

/** Minimum gap between versions, so typing does not fill the history. */
const SNAPSHOT_INTERVAL_MS = 3 * 60_000

function hasMigrated(): boolean {
  try {
    return window.localStorage.getItem(MIGRATED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Copy the localStorage library into IndexedDB, once.
 *
 * Non-destructive on purpose: the old key is read back and verified before the
 * migration is marked done, and is then left in place — unwritten but readable —
 * so a user who downgrades a release still finds their documents.
 */
async function migrateToStore(library: DocumentLibrary): Promise<boolean> {
  if (!(await isStoreAvailable())) return false
  const existing = await readRecord<DocumentLibrary>(LIBRARY_RECORD)
  if (existing?.docs?.length) return true

  if (!(await writeRecord(LIBRARY_RECORD, library))) return false
  const verify = await readRecord<DocumentLibrary>(LIBRARY_RECORD)
  if (verify?.docs?.length !== library.docs.length) {
    logger.warn('Library migration could not be verified; keeping localStorage')
    return false
  }
  try {
    window.localStorage.setItem(MIGRATED_KEY, '1')
  } catch {
    /* the migration still stands even if the marker cannot be written */
  }
  return true
}

/** Keep only the newest `MAX_SNAPSHOTS` per document. */
function trimSnapshots(all: DocumentSnapshot[]): DocumentSnapshot[] {
  const byDoc = new Map<string, DocumentSnapshot[]>()
  for (const snap of [...all].sort((a, b) => b.takenAt - a.takenAt)) {
    const list = byDoc.get(snap.docId) ?? []
    if (list.length < MAX_SNAPSHOTS) {
      list.push(snap)
      byDoc.set(snap.docId, list)
    }
  }
  return [...byDoc.values()].flat()
}

export function useDocumentLibrary(): DocumentLibraryApi {
  // React state is authoritative and updates instantly on every keystroke; the
  // (expensive) localStorage serialization is debounced so typing stays smooth.
  const [library, setLibraryState] = useState<DocumentLibrary>(loadLibrary)
  const libraryRef = useRef(library)
  libraryRef.current = library
  const writeTimer = useRef<number | undefined>(undefined)
  const storeReady = useRef(false)
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([])
  const snapshotsRef = useRef(snapshots)
  snapshotsRef.current = snapshots
  const lastSnapshotAt = useRef(0)

  // Adopt IndexedDB on first load, migrating the localStorage library across.
  // The synchronous localStorage read above still runs, so the first paint is
  // never blocked on a database open.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!(await isStoreAvailable())) return
      const stored = await readRecord<DocumentLibrary>(LIBRARY_RECORD)
      if (cancelled) return

      if (stored?.docs?.length) {
        storeReady.current = true
        // Only adopt it when it differs, so we never clobber edits made in the
        // moments before the database answered.
        if (!hasMigrated() || stored.activeId !== libraryRef.current.activeId) {
          const docs = stored.docs
            .map(normaliseDoc)
            .filter((doc): doc is DocumentRecord => doc !== null)
          if (docs.length > 0) {
            const activeId = docs.some((d) => d.id === stored.activeId)
              ? stored.activeId
              : docs[0].id
            setLibraryState({ docs, activeId })
          }
        }
        return
      }

      storeReady.current = await migrateToStore(libraryRef.current)
    })()
    void readRecord<DocumentSnapshot[]>(SNAPSHOTS_RECORD).then((stored) => {
      if (!cancelled && Array.isArray(stored)) setSnapshots(stored)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const flush = useCallback(() => {
    window.clearTimeout(writeTimer.current)
    // IndexedDB is the durable home; localStorage stays as the fallback for
    // profiles where it is unavailable, and as the pre-migration store.
    if (storeReady.current) {
      void writeRecord(LIBRARY_RECORD, libraryRef.current)
      // A version every few minutes, now that there is room for them. Cheap
      // insurance against the one mistake local-first software cannot undo.
      const active = libraryRef.current.docs.find((d) => d.id === libraryRef.current.activeId)
      if (active && Date.now() - lastSnapshotAt.current > SNAPSHOT_INTERVAL_MS) {
        const latest = snapshotsRef.current.find((s) => s.docId === active.id)
        if (latest?.content !== active.content) {
          lastSnapshotAt.current = Date.now()
          const next = trimSnapshots([
            { docId: active.id, takenAt: Date.now(), content: active.content },
            ...snapshotsRef.current,
          ])
          snapshotsRef.current = next
          setSnapshots(next)
          void writeRecord(SNAPSHOTS_RECORD, next)
        }
      }
      return
    }
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
      const valid = records.map(normaliseDoc).filter((doc): doc is DocumentRecord => doc !== null)
      if (valid.length === 0) return 0
      // Fresh ids so an imported file can never collide with an existing doc.
      const rehydrated = valid.map((doc) => ({
        ...makeDoc(doc.content, doc.config),
        createdAt: doc.createdAt,
      }))
      setLibrary((prev) => ({ docs: [...prev.docs, ...rehydrated], activeId: rehydrated[0].id }))
      return rehydrated.length
    },
    [setLibrary],
  )

  const restoreSnapshot = useCallback(
    (takenAt: number) => {
      const snap = snapshotsRef.current.find(
        (s) => s.takenAt === takenAt && s.docId === libraryRef.current.activeId,
      )
      if (snap) patchActive((doc) => ({ ...doc, content: snap.content, updatedAt: now() }))
    },
    [patchActive],
  )

  const activeSnapshots = useMemo(
    () =>
      snapshots.filter((s) => s.docId === library.activeId).sort((a, b) => b.takenAt - a.takenAt),
    [snapshots, library.activeId],
  )

  return {
    docs: library.docs,
    activeId: library.activeId,
    snapshots: activeSnapshots,
    restoreSnapshot,
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
