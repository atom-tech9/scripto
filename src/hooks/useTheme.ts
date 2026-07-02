import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'
import { useLocalStorage } from './useLocalStorage'
import type { ResolvedTheme, ThemeMode } from '@/types'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Manages the app theme (light/dark/system), resolves the effective theme,
 * reacts to OS preference changes, and applies the `.dark` class to <html>.
 */
export function useTheme() {
  const [mode, setMode] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, 'system')
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => setSystemTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const resolvedTheme: ResolvedTheme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const cycleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'))
  }, [setMode])

  return useMemo(
    () => ({ mode, setMode, resolvedTheme, cycleTheme }),
    [mode, setMode, resolvedTheme, cycleTheme],
  )
}
