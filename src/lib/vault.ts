import { decryptString, encryptString, type CipherPayload } from './crypto'
import { logger } from './logger'

/**
 * The vault stores an encrypted snapshot of every `scripto:*` localStorage
 * entry. While unlocked the app uses plaintext entries for speed; the vault is
 * kept in sync and is the only thing left at rest once locked.
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

/** Remove all plaintext app-data entries (keeps lock meta + vault). */
export function clearPlaintext(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && key.startsWith(APP_PREFIX) && key !== LOCK_META_KEY && key !== VAULT_KEY) {
      keys.push(key)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

/** Encrypt the current plaintext snapshot into the vault. */
export async function syncVault(key: CryptoKey): Promise<void> {
  try {
    const payload = await encryptString(JSON.stringify(snapshotPlaintext()), key)
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
    const data = JSON.parse(json) as Record<string, string>
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v))
    return true
  } catch (error) {
    logger.error('Failed to restore vault', error)
    return false
  }
}
