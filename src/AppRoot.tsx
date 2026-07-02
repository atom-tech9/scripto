import App from './App'
import { useAppLock } from '@/hooks/useAppLock'
import { LockScreen } from '@/components/security/LockScreen'

/**
 * Top-level gate. When a passphrase lock is enabled and the app is locked, the
 * main App (and its localStorage-backed state) never mounts until the vault is
 * decrypted — so locked data is only ever ciphertext at rest.
 */
export function AppRoot() {
  const lock = useAppLock()

  if (lock.status === 'locked') {
    return <LockScreen onUnlock={lock.unlock} />
  }

  return <App lock={lock} />
}
