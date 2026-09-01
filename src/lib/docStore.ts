import { getErrorMessage, logger } from '@/lib/logger'

/**
 * The durable store for documents.
 *
 * localStorage was the wrong home for these: the whole library, base64 images
 * and all, was serialised into a single string on every debounce, against a
 * quota of a few megabytes. One pasted screenshot could exhaust it.
 *
 * IndexedDB has no practical size ceiling and stores structured values, so
 * nothing has to be re-serialised to save one keystroke's worth of change.
 * Small settings stay in localStorage, where the synchronous read is worth more
 * than the space.
 */

const DB_NAME = 'scripto'
const DB_VERSION = 1
const STORE = 'kv'

/** Everything the vault has to encrypt when the app is locked. */
export const LIBRARY_RECORD = 'library'
export const SNAPSHOTS_RECORD = 'snapshots'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch (error) {
      // Private windows and hardened profiles can refuse outright.
      logger.warn(`IndexedDB unavailable: ${getErrorMessage(error)}`)
      resolve(null)
      return
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      logger.warn(`IndexedDB open failed: ${request.error?.message ?? 'unknown'}`)
      resolve(null)
    }
    request.onblocked = () => resolve(null)
  })
  return dbPromise
}

/**
 * Run one transaction.
 *
 * A write resolves on the transaction **completing**, not on the request
 * succeeding. The difference matters: a request can succeed while its
 * transaction is still uncommitted, and `lockNow` reloads the page the instant
 * the wipe returns — which would abort that transaction and leave the documents
 * on disk in the clear, with the UI insisting it had locked.
 */
function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null)
          return
        }
        try {
          const tx = db.transaction(STORE, mode)
          const request = fn(tx.objectStore(STORE))
          let value: T | null = null

          request.onsuccess = () => {
            value = (request.result ?? null) as T | null
            if (mode === 'readonly') resolve(value)
          }
          request.onerror = () => {
            logger.warn(`IndexedDB request failed: ${request.error?.message ?? 'unknown'}`)
            resolve(null)
          }

          if (mode !== 'readonly') {
            // `undefined` is a legitimate result for put/delete/clear, so
            // completion is signalled with a sentinel the callers can test.
            tx.oncomplete = () => resolve((value ?? true) as T)
            tx.onabort = () => {
              logger.warn(`IndexedDB transaction aborted: ${tx.error?.message ?? 'unknown'}`)
              resolve(null)
            }
            tx.onerror = () => resolve(null)
          }
        } catch (error) {
          logger.warn(`IndexedDB transaction failed: ${getErrorMessage(error)}`)
          resolve(null)
        }
      }),
  )
}

/** True when IndexedDB is actually usable in this browser/profile. */
export async function isStoreAvailable(): Promise<boolean> {
  return (await openDb()) !== null
}

export function readRecord<T>(key: string): Promise<T | null> {
  return run<T>('readonly', (store) => store.get(key))
}

export async function writeRecord(key: string, value: unknown): Promise<boolean> {
  const result = await run<IDBValidKey>('readwrite', (store) => store.put(value, key))
  return result !== null
}

export async function deleteRecord(key: string): Promise<void> {
  await run('readwrite', (store) => store.delete(key))
}

/** Every record, for the vault to encrypt. */
export async function exportRecords(): Promise<Record<string, unknown>> {
  const keys = await run<IDBValidKey[]>('readonly', (store) => store.getAllKeys())
  if (!keys) return {}
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    const value = await readRecord(String(key))
    if (value !== null) out[String(key)] = value
  }
  return out
}

/** Write a decrypted vault back into the store. */
export async function importRecords(records: Record<string, unknown>): Promise<void> {
  for (const [key, value] of Object.entries(records)) await writeRecord(key, value)
}

/**
 * Remove every plaintext record.
 *
 * Called when the app locks. If this does not run, documents stay readable in
 * IndexedDB while the UI claims to be locked — which would make the lock a
 * decoration rather than a control.
 */
export async function clearRecords(): Promise<void> {
  await run('readwrite', (store) => store.clear())
}
