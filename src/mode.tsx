import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

/** App-level editing mode: `simple` is an assistive beginner layer; `standard` is unchanged. */
export type EditingMode = 'standard' | 'simple'

interface ModeContextValue {
  mode: EditingMode
  isSimple: boolean
  setMode: (mode: EditingMode) => void
  toggle: () => void
}

const ModeContext = createContext<ModeContextValue | null>(null)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useLocalStorage<EditingMode>('scripto:mode', 'standard')

  const toggle = useCallback(
    () => setMode((prev) => (prev === 'simple' ? 'standard' : 'simple')),
    [setMode],
  )

  const value = useMemo(
    () => ({ mode, isSimple: mode === 'simple', setMode, toggle }),
    [mode, setMode, toggle],
  )

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within a ModeProvider')
  return ctx
}
