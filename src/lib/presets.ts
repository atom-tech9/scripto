import { DEFAULT_CONFIG, MARGIN_PRESETS } from '@/lib/constants'
import { sanitiseHandConfig } from '@/lib/handwriting/vocabulary'
import type { ExportPreset, PdfConfig } from '@/types'

/** File format version, so a future change can migrate rather than guess. */
const FILE_VERSION = 1
const FILE_KIND = 'scripto-export-presets'

/**
 * Apply a preset on top of a config.
 *
 * Named margin presets win over whatever margins the config currently holds —
 * otherwise picking "Wide" would leave the previous numbers in place. This is
 * the one merge rule every preset path shares, built-in and user-saved alike.
 */
export function mergePreset(previous: PdfConfig, patch: Partial<PdfConfig>): PdfConfig {
  const margins =
    patch.marginPreset && patch.marginPreset !== 'custom'
      ? MARGIN_PRESETS[patch.marginPreset]
      : (patch.margins ?? previous.margins)
  return { ...previous, ...patch, margins }
}

/**
 * The presentation half of a config — everything a house style covers.
 * `meta` is deliberately excluded: a title and author belong to a document, not
 * to a style.
 */
export function capturePreset(config: PdfConfig): Partial<PdfConfig> {
  const { meta: _meta, ...presentation } = config
  return presentation
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Narrow one untrusted entry from an imported file into a preset. */
function toPreset(value: unknown): ExportPreset | null {
  if (!isRecord(value)) return null
  const { id, name, config, createdAt } = value
  if (typeof name !== 'string' || name.trim() === '') return null
  if (!isRecord(config)) return null
  // `meta` can carry a title and author from whoever exported the file.
  const { meta: _meta, ...presentation } = config
  // The hand block comes straight out of someone else's file, so it is narrowed
  // to values we ship rather than trusted as-is.
  const hand = 'hand' in presentation ? sanitiseHandConfig(presentation.hand, DEFAULT_CONFIG.hand) : undefined
  return {
    id: typeof id === 'string' && id ? id : crypto.randomUUID(),
    name: name.trim().slice(0, 60),
    config: { ...(presentation as Partial<PdfConfig>), ...(hand ? { hand } : {}) },
    createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
  }
}

export function serializePresets(presets: readonly ExportPreset[]): string {
  return JSON.stringify({ kind: FILE_KIND, version: FILE_VERSION, presets }, null, 2)
}

/**
 * Parse an imported presets file. Everything in it is untrusted, so each entry
 * is narrowed individually and anything malformed is dropped rather than
 * poisoning the library.
 */
export function parsePresets(raw: string): ExportPreset[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  // Accept a bare array too — it is the obvious thing to hand-write.
  const list = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.presets)
      ? parsed.presets
      : []
  return list.map(toPreset).filter((preset): preset is ExportPreset => preset !== null)
}

/** Trigger a download of the presets as a portable `.json` file. */
export function downloadPresets(presets: readonly ExportPreset[], name = 'scripto-presets'): void {
  const blob = new Blob([serializePresets(presets)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
