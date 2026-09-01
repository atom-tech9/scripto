import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { capturePreset } from '@/lib/presets'
import type { ExportPreset, PdfConfig } from '@/types'

const STORAGE_KEY = 'scripto:export-presets'
const MAX_NAME = 60

export interface ExportPresetsApi {
  readonly presets: ExportPreset[]
  /** Saves the presentation half of `config` under `name`. */
  readonly save: (name: string, config: PdfConfig) => ExportPreset | null
  readonly rename: (id: string, name: string) => void
  readonly remove: (id: string) => void
  /** Adds imported presets, replacing any with a matching id. */
  readonly merge: (incoming: readonly ExportPreset[]) => number
}

/** The user's saved export presets, persisted locally. */
export function useExportPresets(): ExportPresetsApi {
  const [stored, setStored] = useLocalStorage<ExportPreset[]>(STORAGE_KEY, [])
  const presets = useMemo(() => (Array.isArray(stored) ? stored : []), [stored])

  const save = useCallback(
    (name: string, config: PdfConfig): ExportPreset | null => {
      const trimmed = name.trim().slice(0, MAX_NAME)
      if (!trimmed) return null
      const preset: ExportPreset = {
        id: crypto.randomUUID(),
        name: trimmed,
        config: capturePreset(config),
        createdAt: Date.now(),
      }
      setStored((prev) => [preset, ...(Array.isArray(prev) ? prev : [])])
      return preset
    },
    [setStored],
  )

  const rename = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim().slice(0, MAX_NAME)
      if (!trimmed) return
      setStored((prev) =>
        (Array.isArray(prev) ? prev : []).map((preset) =>
          preset.id === id ? { ...preset, name: trimmed } : preset,
        ),
      )
    },
    [setStored],
  )

  const remove = useCallback(
    (id: string) =>
      setStored((prev) => (Array.isArray(prev) ? prev : []).filter((preset) => preset.id !== id)),
    [setStored],
  )

  const merge = useCallback(
    (incoming: readonly ExportPreset[]): number => {
      if (incoming.length === 0) return 0
      setStored((prev) => {
        const byId = new Map((Array.isArray(prev) ? prev : []).map((preset) => [preset.id, preset]))
        for (const preset of incoming) byId.set(preset.id, preset)
        return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt)
      })
      return incoming.length
    },
    [setStored],
  )

  return useMemo(
    () => ({ presets, save, rename, remove, merge }),
    [presets, save, rename, remove, merge],
  )
}
