import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format a byte count into a human-readable string. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB'] as const
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Replace embedded base64 data URLs with a short token so they don't pollute
 * word/character counts. */
export function stripDataUrls(text: string): string {
  return text.replace(/data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, 'data:…')
}

/** Count words in a block of text, ignoring markdown punctuation noise. */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** Estimate reading time in minutes (≈200 wpm). */
export function readingTime(words: number): number {
  return Math.max(1, Math.round(words / 200))
}

/** Count ATX headings in Markdown, ignoring fenced code blocks. */
export function countHeadings(markdown: string): number {
  let inFence = false
  let count = 0
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (!inFence && /^#{1,6}\s+\S/.test(line)) count += 1
  }
  return count
}

/** Escape a string for safe insertion into raw HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Read a File object as UTF-8 text. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsText(file)
  })
}

/** Read a File object as a base64 data URL (for embedding images). */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsDataURL(file)
  })
}

/** Trigger a browser download for a string blob. */
export function downloadTextFile(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/** Estimate bytes used by this app's localStorage entries (UTF-16 → ×2). */
export function estimateAppStorageBytes(): number {
  if (typeof localStorage === 'undefined') return 0
  let total = 0
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('scripto:')) continue
    const value = localStorage.getItem(key) ?? ''
    total += (key.length + value.length) * 2
  }
  return total
}

/** Whether the user is on a Mac (for keyboard shortcut display). */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad/.test(navigator.platform)
}
