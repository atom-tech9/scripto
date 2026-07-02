import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * quiet. Keeps the preview from re-rendering on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 180): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(handle)
  }, [value, delay])

  return debounced
}
