import { describe, expect, it } from 'vitest'
import {
  clearRecords,
  exportRecords,
  importRecords,
  isStoreAvailable,
  readRecord,
  writeRecord,
} from '@/lib/docStore'

/**
 * These run in a Node environment with no `indexedDB`, which is exactly the
 * condition the store has to survive: a private window, a hardened profile, or
 * a browser with site data disabled. Every call must degrade quietly rather
 * than throw — the app falls back to localStorage, and a thrown error here
 * would take the whole editor down instead.
 */
describe('document store without IndexedDB', () => {
  it('reports itself unavailable', async () => {
    await expect(isStoreAvailable()).resolves.toBe(false)
  })

  it('reads nothing rather than throwing', async () => {
    await expect(readRecord('library')).resolves.toBeNull()
  })

  it('reports a failed write instead of throwing', async () => {
    await expect(writeRecord('library', { docs: [] })).resolves.toBe(false)
  })

  it('exports an empty set', async () => {
    await expect(exportRecords()).resolves.toEqual({})
  })

  it('accepts an import as a no-op', async () => {
    await expect(importRecords({ library: { docs: [] } })).resolves.toBeUndefined()
  })

  it('clears without throwing, so locking never fails on this path', async () => {
    await expect(clearRecords()).resolves.toBeUndefined()
  })
})
