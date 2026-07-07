import { track } from '@vercel/analytics'

/**
 * Custom analytics events fired from the editor SPA. Names are stable strings
 * (they become the event labels in the Vercel dashboard) — keep them in sync
 * with the marketing pages' `data-track` attributes, which fire the same
 * `window.va('event', …)` call by hand (marketing pages ship no framework JS).
 *
 * Properties must be flat and must never contain document content or other PII
 * — only structural facts (which template, which skin, which format).
 */
export type AppAnalyticsEvent =
  | 'Export PDF'
  | 'Document Exported'
  | 'Template Used'
  | 'Skin Applied'
  | 'Import'
  | 'AI Action'
  | 'Onboarding Completed'

type EventProps = Record<string, string | number | boolean>

/** Fire a custom event. No-ops off-Vercel; never throws into the app. */
export function trackEvent(name: AppAnalyticsEvent, props?: EventProps): void {
  try {
    track(name, props)
  } catch {
    /* analytics must never break the editor */
  }
}
