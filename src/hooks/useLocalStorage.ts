import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, logger } from '@/lib/logger'

/**
 * A typed, SSR-safe localStorage-backed state hook with cross-tab sync.
 * Always treats stored values immutably.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
): readonly [T, (value: T | ((prev: T) => T)) => void] {
  const resolveInitial = useCallback(
    (): T => (initialValue instanceof Function ? initialValue() : initialValue),
    [initialValue],
  )

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return resolveInitial()
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : resolveInitial()
    } catch (error) {
      logger.warn(`Failed to read localStorage key "${key}": ${getErrorMessage(error)}`)
      return resolveInitial()
    }
  }, [key, resolveInitial])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch (error) {
          logger.warn(`Failed to write localStorage key "${key}": ${getErrorMessage(error)}`)
          const quota =
            error instanceof DOMException &&
            (error.name === 'QuotaExceededError' || error.code === 22)
          if (quota) {
            window.dispatchEvent(new CustomEvent('scripto:quota-exceeded'))
          }
        }
        return next
      })
    },
    [key],
  )

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T)
        } catch {
          /* ignore malformed cross-tab payloads */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [storedValue, setValue] as const
}
