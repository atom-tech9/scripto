/**
 * Zero-knowledge client-side encryption using the Web Crypto API.
 * A passphrase is stretched with PBKDF2 (SHA-256) into an AES-GCM key.
 * The passphrase is never stored — only a salt and a verifier blob are kept,
 * so forgotten passphrases mean unrecoverable data (by design).
 */

const PBKDF2_ITERATIONS = 150_000
const VERIFIER_TEXT = 'scripto-vault-ok'

export interface CipherPayload {
  iv: string
  data: string
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const b of view) binary += String.fromCharCode(b)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function randomSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)))
}

/** Derive an AES-GCM key from a passphrase and salt. */
export async function deriveKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltB64) as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptString(plaintext: string, key: CryptoKey): Promise<CipherPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext) as BufferSource,
  )
  return { iv: toBase64(iv), data: toBase64(cipher) }
}

export async function decryptString(payload: CipherPayload, key: CryptoKey): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) as BufferSource },
    key,
    fromBase64(payload.data) as BufferSource,
  )
  return new TextDecoder().decode(plain)
}

/** Create a verifier blob used to check a passphrase without storing it. */
export function makeVerifier(key: CryptoKey): Promise<CipherPayload> {
  return encryptString(VERIFIER_TEXT, key)
}

/** Returns true when the key successfully decrypts the verifier. */
export async function checkVerifier(payload: CipherPayload, key: CryptoKey): Promise<boolean> {
  try {
    return (await decryptString(payload, key)) === VERIFIER_TEXT
  } catch {
    return false
  }
}
