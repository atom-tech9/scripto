import { useCallback, useMemo, useReducer } from 'react'

/**
 * Every boolean overlay/chrome flag the app orchestrator owns. Collecting them
 * behind one reducer keeps `App.tsx` from accumulating a `useState` per dialog
 * and gives every consumer identity-stable open/close callbacks.
 */
export type DialogName =
  | 'config'
  | 'outline'
  | 'templates'
  | 'gallery'
  | 'github'
  | 'aiSettings'
  | 'aiDashboard'
  | 'shortcuts'
  | 'formattingHelp'
  | 'palette'
  | 'print'
  | 'docs'
  | 'security'
  | 'stats'
  | 'zen'

const DIALOG_NAMES: readonly DialogName[] = [
  'config',
  'outline',
  'templates',
  'gallery',
  'github',
  'aiSettings',
  'aiDashboard',
  'shortcuts',
  'formattingHelp',
  'palette',
  'print',
  'docs',
  'security',
  'stats',
  'zen',
]

export type DialogsState = Readonly<Record<DialogName, boolean>>

const INITIAL_STATE: DialogsState = Object.freeze(
  DIALOG_NAMES.reduce<Record<DialogName, boolean>>(
    (acc, name) => {
      acc[name] = false
      return acc
    },
    {} as Record<DialogName, boolean>,
  ),
)

type DialogAction =
  | { readonly type: 'open'; readonly name: DialogName }
  | { readonly type: 'close'; readonly name: DialogName }
  | { readonly type: 'toggle'; readonly name: DialogName }
  | { readonly type: 'set'; readonly name: DialogName; readonly value: boolean }

function reducer(state: DialogsState, action: DialogAction): DialogsState {
  const next =
    action.type === 'toggle'
      ? !state[action.name]
      : action.type === 'set'
        ? action.value
        : action.type === 'open'
  // Identity-stable when nothing actually changed, so consumers don't re-render.
  return state[action.name] === next ? state : { ...state, [action.name]: next }
}

export interface DialogsApi {
  /** Current open/closed flag for every overlay. */
  readonly state: DialogsState
  readonly isOpen: (name: DialogName) => boolean
  readonly open: (name: DialogName) => void
  readonly close: (name: DialogName) => void
  readonly toggle: (name: DialogName) => void
  readonly set: (name: DialogName, value: boolean) => void
  /** `() => open(name)` memoised per name — safe to pass straight to a prop. */
  readonly opener: (name: DialogName) => () => void
  /** `() => close(name)` memoised per name. */
  readonly closer: (name: DialogName) => () => void
  /** `() => toggle(name)` memoised per name. */
  readonly toggler: (name: DialogName) => () => void
}

/**
 * One reducer for all overlay state. The `opener`/`closer`/`toggler` helpers
 * hand back cached, identity-stable thunks so passing them as props never
 * defeats `memo` or re-triggers effects.
 */
export function useDialogs(): DialogsApi {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const open = useCallback((name: DialogName) => dispatch({ type: 'open', name }), [])
  const close = useCallback((name: DialogName) => dispatch({ type: 'close', name }), [])
  const toggle = useCallback((name: DialogName) => dispatch({ type: 'toggle', name }), [])
  const set = useCallback(
    (name: DialogName, value: boolean) => dispatch({ type: 'set', name, value }),
    [],
  )

  // Pre-built thunks: created once, so prop identity never changes.
  const thunks = useMemo(() => {
    const build = (run: (name: DialogName) => void): Record<DialogName, () => void> =>
      DIALOG_NAMES.reduce<Record<DialogName, () => void>>(
        (acc, name) => {
          acc[name] = () => run(name)
          return acc
        },
        {} as Record<DialogName, () => void>,
      )
    return { open: build(open), close: build(close), toggle: build(toggle) }
  }, [open, close, toggle])

  const isOpen = useCallback((name: DialogName) => state[name], [state])

  // These lookups are identity-stable for the life of the hook, so consumers can
  // list them in effect/memo deps without re-running on every dialog toggle.
  const opener = useCallback((name: DialogName) => thunks.open[name], [thunks])
  const closer = useCallback((name: DialogName) => thunks.close[name], [thunks])
  const toggler = useCallback((name: DialogName) => thunks.toggle[name], [thunks])

  return useMemo(
    () => ({ state, isOpen, open, close, toggle, set, opener, closer, toggler }),
    [state, isOpen, open, close, toggle, set, opener, closer, toggler],
  )
}
