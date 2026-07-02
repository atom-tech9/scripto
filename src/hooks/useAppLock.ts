import { useCallback, useEffect, useRef, useState } from 'react'
import { checkVerifier, deriveKey, makeVerifier, randomSalt } from '@/lib/crypto'
import {
  clearPlaintext,
  getLockMeta,
  isLockEnabled,
  removeLock,
  restoreVault,
  setLockMeta,
  syncVault,
} from '@/lib/vault'

export type LockStatus = 'open' | 'locked' | 'unlocked'

export interface AppLockApi {
  status: LockStatus
  autoLockMinutes: number
  /** Unlock with a passphrase. Returns false on wrong passphrase. */
  unlock: (passphrase: string) => Promise<boolean>
  /** Enable encryption with a new passphrase (must currently be open/unlocked). */
  enable: (passphrase: string, autoLockMinutes: number) => Promise<void>
  /** Disable encryption and keep data in plaintext. */
  disable: () => void
  /** Lock now: sync the vault, wipe plaintext, return to the lock screen. */
  lockNow: () => Promise<void>
  /** Mirror current plaintext into the encrypted vault (no-op when open). */
  mirror: () => void
  setAutoLockMinutes: (minutes: number) => void
}

/**
 * Drives the zero-knowledge passphrase lock. The derived AES key lives only in
 * memory (a ref) — never persisted — so closing the tab always re-locks.
 */
export function useAppLock(): AppLockApi {
  const [status, setStatus] = useState<LockStatus>(() => (isLockEnabled() ? 'locked' : 'open'))
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(
    () => getLockMeta()?.autoLockMinutes ?? 15,
  )
  const keyRef = useRef<CryptoKey | null>(null)
  const mirrorTimer = useRef<number | undefined>(undefined)

  // On a locked cold start, remove stale plaintext so only ciphertext remains.
  useEffect(() => {
    if (status === 'locked') clearPlaintext()
  }, [status])

  const unlock = useCallback(async (passphrase: string): Promise<boolean> => {
    const meta = getLockMeta()
    if (!meta) return false
    const key = await deriveKey(passphrase, meta.salt)
    if (!(await checkVerifier(meta.verifier, key))) return false
    await restoreVault(key)
    keyRef.current = key
    setStatus('unlocked')
    return true
  }, [])

  const enable = useCallback(async (passphrase: string, minutes: number): Promise<void> => {
    const salt = randomSalt()
    const key = await deriveKey(passphrase, salt)
    const verifier = await makeVerifier(key)
    setLockMeta({ enabled: true, salt, verifier, autoLockMinutes: minutes })
    keyRef.current = key
    await syncVault(key)
    setAutoLockMinutesState(minutes)
    setStatus('unlocked')
  }, [])

  const disable = useCallback((): void => {
    removeLock()
    keyRef.current = null
    setStatus('open')
  }, [])

  const lockNow = useCallback(async (): Promise<void> => {
    if (keyRef.current) await syncVault(keyRef.current)
    clearPlaintext()
    window.location.reload()
  }, [])

  const mirror = useCallback((): void => {
    if (status !== 'unlocked' || !keyRef.current) return
    window.clearTimeout(mirrorTimer.current)
    mirrorTimer.current = window.setTimeout(() => {
      if (keyRef.current) void syncVault(keyRef.current)
    }, 700)
  }, [status])

  const setAutoLockMinutes = useCallback((minutes: number): void => {
    setAutoLockMinutesState(minutes)
    const meta = getLockMeta()
    if (meta) setLockMeta({ ...meta, autoLockMinutes: minutes })
  }, [])

  // Auto-lock after inactivity.
  useEffect(() => {
    if (status !== 'unlocked' || autoLockMinutes <= 0) return
    let timer: number
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void lockNow(), autoLockMinutes * 60_000)
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      window.clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [status, autoLockMinutes, lockNow])

  // Best-effort vault sync when the tab is hidden/closed.
  useEffect(() => {
    const onHide = () => {
      if (status === 'unlocked' && keyRef.current) void syncVault(keyRef.current)
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [status])

  return {
    status,
    autoLockMinutes,
    unlock,
    enable,
    disable,
    lockNow,
    mirror,
    setAutoLockMinutes,
  }
}
