import { decryptString, encryptString, type CipherPayload } from './crypto'
import { logger } from './logger'
import { clearRecords, exportRecords, importRecords } from './docStore'

/**
 * The vault stores an encrypted snapshot of every `scripto:*` localStorage
 * entry AND the IndexedDB document store. While unlocked the app uses plaintext
 * for speed; the vault is kept in sync and is the only thing left at rest once
 * locked.
 *
 * Both stores have to be covered. Documents moved to IndexedDB for the space,
 * and encrypting only localStorage would leave the entire library readable on
 * disk while the UI claimed to be locked.
 */

const LOCK_META_KEY = 'scripto:lock'
const VAULT_KEY = 'scripto:vault'
const APP_PREFIX = 'scripto:'

export interface LockMeta {
  enabled: boolean
  salt: string
  verifier: CipherPayload
  autoLockMinutes: number
}

export function getLockMeta(): LockMeta | null {
  try {
    const raw = localStorage.getItem(LOCK_META_KEY)
    return raw ? (JSON.parse(raw) as LockMeta) : null
  } catch {
    return null
  }
}

export function setLockMeta(meta: LockMeta): void {
  localStorage.setItem(LOCK_META_KEY, JSON.stringify(meta))
}

export function removeLock(): void {
  localStorage.removeItem(LOCK_META_KEY)
  localStorage.removeItem(VAULT_KEY)
}

export function isLockEnabled(): boolean {
  return getLockMeta()?.enabled === true
}

/**
 * The shape written into the vault.
 *
 * Documents now live in IndexedDB, so encrypting localStorage alone would leave
 * the whole library readable while the app claimed to be locked. Both stores go
 * in, under separate keys, and both come back out on unlock.
 */
interface VaultPayload {
  local: Record<string, string>
  store: Record<string, unknown>
}

/** Collect all app data entries except the lock meta and vault themselves. */
function snapshotPlaintext(): Record<string, string> {
  const snapshot: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(APP_PREFIX)) continue
    if (key === LOCK_META_KEY || key === VAULT_KEY) continue
    const value = localStorage.getItem(key)
    if (value !== null) snapshot[key] = value
  }
  return snapshot
}

/**
 * Remove all plaintext app data — localStorage entries and the document store
 * alike, keeping only the lock meta and the ciphertext.
 *
 * Awaiting this matters: until the IndexedDB half resolves, the library is
 * still on disk in the clear.
 */
export async function clearPlaintext(): Promise<void> {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && key.startsWith(APP_PREFIX) && key !== LOCK_META_KEY && key !== VAULT_KEY) {
      keys.push(key)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
  await clearRecords()
}

/** Encrypt the current plaintext snapshot into the vault. */
export async function syncVault(key: CryptoKey): Promise<void> {
  try {
    const snapshot: VaultPayload = { local: snapshotPlaintext(), store: await exportRecords() }
    const payload = await encryptString(JSON.stringify(snapshot), key)
    localStorage.setItem(VAULT_KEY, JSON.stringify(payload))
  } catch (error) {
    logger.error('Failed to sync vault', error)
  }
}

/** Decrypt the vault and write its contents back to plaintext localStorage. */
export async function restoreVault(key: CryptoKey): Promise<boolean> {
  try {
    const raw = localStorage.getItem(VAULT_KEY)
    if (!raw) return true // nothing stored yet
    const payload = JSON.parse(raw) as CipherPayload
    const json = await decryptString(payload, key)
    const data = JSON.parse(json) as Partial<VaultPayload> & Record<string, unknown>
    // Vaults written before documents moved to IndexedDB are a flat map of
    // localStorage entries, so read either shape.
    const local = (data.local ?? data) as Record<string, string>
    for (const [k, v] of Object.entries(local)) {
      if (typeof v === 'string') localStorage.setItem(k, v)
    }
    if (data.store) await importRecords(data.store)
    return true
  } catch (error) {
    logger.error('Failed to restore vault', error)
    return false
  }
}
