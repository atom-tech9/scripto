/**
 * Minimal environment-aware logger. Production code must not call `console.log`
 * directly — route through this so logging can be muted or redirected centrally.
 */

const isDev = import.meta.env.DEV

type LogArgs = readonly unknown[]

export const logger = {
  debug(...args: LogArgs): void {
    if (isDev) console.debug('[scripto]', ...args)
  },
  info(...args: LogArgs): void {
    if (isDev) console.info('[scripto]', ...args)
  },
  warn(...args: LogArgs): void {
    console.warn('[scripto]', ...args)
  },
  error(message: string, error?: unknown): void {
    console.error('[scripto]', message, error ?? '')
  },
}

/** Normalise an unknown thrown value into a readable message. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}
