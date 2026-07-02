import type { CSSProperties } from 'react'

/** CSSProperties extended with `--thumb-*` custom properties. */
export type ThumbStyle = CSSProperties & Record<`--thumb-${string}`, string>

/**
 * Stylized per-skin thumbnail treatments for the `.mk-skin-thumb` mock page.
 * These are honest *impressions* of each skin (font voice, accent, rules) —
 * the real skins live in src/styles/document.css and render inside the app.
 */
export const SKIN_THUMB_STYLES: Record<string, ThumbStyle> = {
  modern: { '--thumb-accent': '#6366f1' },
  classic: {
    '--thumb-font': '"Source Serif 4", Georgia, serif',
    '--thumb-rule': '3px double #1a2030',
    '--thumb-accent': '#1a2030',
    '--thumb-track': '0',
  },
  editorial: {
    '--thumb-font': '"Source Serif 4", Georgia, serif',
    '--thumb-accent': '#9f1239',
    '--thumb-title': '0.95rem',
  },
  technical: { '--thumb-accent': '#475569', '--thumb-rule': '1px solid #cbd5e1' },
  compact: { '--thumb-accent': '#0f766e', '--thumb-title': '0.7rem' },
  manuscript: {
    '--thumb-font': '"JetBrains Mono", monospace',
    '--thumb-bg': '#fbfaf6',
    '--thumb-accent': '#78716c',
    '--thumb-track': '0',
  },
  blueprint: {
    '--thumb-font': '"JetBrains Mono", monospace',
    '--thumb-bg': '#f3f7ff',
    '--thumb-ink': '#1e3a5f',
    '--thumb-accent': '#2563eb',
    '--thumb-line': '#d9e5fb',
  },
  corporate: { '--thumb-accent': '#0e7490', '--thumb-rule': '4px solid #0e7490' },
  brutalist: {
    '--thumb-rule': '3px solid #111',
    '--thumb-accent': '#111',
    '--thumb-case': 'uppercase',
    '--thumb-track': '0.02em',
  },
  notebook: { '--thumb-bg': '#fffdf2', '--thumb-accent': '#f59e0b', '--thumb-line': '#f3ecc9' },
  resume: { '--thumb-accent': '#334155', '--thumb-rule': '1px solid #cbd5e1' },
  swiss: { '--thumb-accent': '#e11d48', '--thumb-rule': '3px solid #111', '--thumb-track': '-0.04em' },
  terminal: {
    '--thumb-bg': '#0c1310',
    '--thumb-ink': '#9beab3',
    '--thumb-head': '#5df08d',
    '--thumb-line': '#1d2b23',
    '--thumb-font': '"JetBrains Mono", monospace',
    '--thumb-accent': '#34d399',
  },
  newsprint: {
    '--thumb-bg': '#f7f3e8',
    '--thumb-ink': '#2b2620',
    '--thumb-font': '"Source Serif 4", Georgia, serif',
    '--thumb-case': 'uppercase',
    '--thumb-rule': '3px double #2b2620',
    '--thumb-accent': '#2b2620',
    '--thumb-line': '#e5dfd0',
  },
  elegant: {
    '--thumb-bg': '#fffdf8',
    '--thumb-font': '"Source Serif 4", Georgia, serif',
    '--thumb-rule': '1px solid #d8d2c6',
    '--thumb-accent': '#8a7048',
    '--thumb-line': '#efeadd',
  },
  playful: { '--thumb-accent': '#ec4899', '--thumb-line': '#fde7f1', '--thumb-title': '0.85rem' },
  dark: {
    '--thumb-bg': '#111827',
    '--thumb-ink': '#e5e7eb',
    '--thumb-head': '#c7d2fe',
    '--thumb-accent': '#818cf8',
    '--thumb-line': '#1f2937',
  },
  ledger: { '--thumb-bg': '#fcfcf9', '--thumb-accent': '#166534', '--thumb-line': '#e3e8dd' },
  zen: { '--thumb-accent': 'transparent', '--thumb-line': '#f0f2f6', '--thumb-track': '0.04em' },
  memo: { '--thumb-rule': '6px solid #1e3a8a', '--thumb-accent': '#1e3a8a' },
  poster: { '--thumb-title': '1.1rem', '--thumb-accent': '#111', '--thumb-track': '-0.05em' },
}
