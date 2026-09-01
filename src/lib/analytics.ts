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
  // The activation funnel. Without these there is no way to tell where a
  // first-time user is lost: they arrive, and either a PDF comes out or it
  // does not, and nothing in between was ever measured.
  | 'Export Dialog Opened'
  | 'Print Dialog Reached'
  | 'Time To First Export'
  | 'Paste Detected'
  | 'Page Break Inserted'
  | 'Stage Viewed'
  | 'Skin Previewed'
  | 'Mobile Export Attempted'

type EventProps = Record<string, string | number | boolean>

/**
 * The two numbers this funnel exists to move:
 *
 *   Activation — a first export within the first session. Target: above 35%.
 *   North star — weekly returning exporters.
 *
 * Everything else here is diagnostic: it exists to explain a change in those
 * two, not to be watched on its own.
 */

/** Fire a custom event. No-ops off-Vercel; never throws into the app. */
export function trackEvent(name: AppAnalyticsEvent, props?: EventProps): void {
  try {
    track(name, props)
  } catch {
    /* analytics must never break the editor */
  }
}
