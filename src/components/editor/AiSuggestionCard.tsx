import { useLayoutEffect, useState, type RefObject } from 'react'
import { Check, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import type { EditorView } from '@codemirror/view'
import { useLanguage } from '@/i18n'
import { pointAt } from './overlayGeometry'

export interface AiSuggestionState {
  /** Range the suggestion will replace (from === to for an insertion). */
  from: number
  to: number
  kind: 'replace' | 'insert'
  /** Human label for the running action, e.g. "Improving writing…". */
  label: string
  /** Accumulated / final suggestion text. */
  text: string
  status: 'streaming' | 'done' | 'error'
  error?: string
  /** Stored so the suggestion can be regenerated. */
  system: string
  source: string
}

interface AiSuggestionCardProps {
  view: EditorView | null
  wrapperRef: RefObject<HTMLElement | null>
  tick: number
  suggestion: AiSuggestionState
  onAccept: () => void
  onReject: () => void
  onRegenerate: () => void
}

const CARD_WIDTH = 380

/**
 * Floating card anchored under the target range that shows an AI edit streaming
 * in live, then lets the user accept, reject, or regenerate it. The document is
 * left untouched until the edit is accepted.
 */
export function AiSuggestionCard({
  view,
  wrapperRef,
  tick,
  suggestion,
  onAccept,
  onReject,
  onRegenerate,
}: AiSuggestionCardProps) {
  const { t, dir } = useLanguage()
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!view || !wrapper) {
      setPos(null)
      return
    }
    const point = pointAt(view, suggestion.to, wrapper, dir)
    if (!point) {
      setPos(null)
      return
    }
    // Under RTL the card grows toward the logical start (leftward), so anchor its
    // right edge to the point; otherwise anchor the left edge as before.
    const anchored = dir === 'rtl' ? point.left - CARD_WIDTH : point.left
    const maxLeft = Math.max(8, wrapper.clientWidth - CARD_WIDTH - 8)
    setPos({ top: point.top + 8, left: Math.min(Math.max(8, anchored), maxLeft) })
  }, [view, wrapperRef, tick, suggestion.to, suggestion.text, dir])

  const streaming = suggestion.status === 'streaming'
  const errored = suggestion.status === 'error'

  return (
    <div
      role="dialog"
      aria-label={t('editor.suggestion.title')}
      onMouseDown={(e) => e.preventDefault()}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: CARD_WIDTH, visibility: pos ? 'visible' : 'hidden' }}
      className="absolute z-40 flex max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-pop-in"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Sparkles size={14} className="text-primary" />
        <span className="flex-1 truncate text-xs font-semibold text-foreground">
          {suggestion.label.replace(/…$/, '')}
          {suggestion.kind === 'insert'
            ? ` (${t('editor.suggestion.insert')})`
            : ` (${t('editor.suggestion.replaceSelection')})`}
        </span>
        {streaming && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
      </div>

      <div className="scrollbar-thin max-h-48 overflow-y-auto whitespace-pre-wrap px-3 py-2 text-sm leading-relaxed text-foreground">
        {errored ? (
          <span className="text-destructive">{suggestion.error}</span>
        ) : suggestion.text ? (
          suggestion.text
        ) : (
          <span className="text-muted-foreground">{t('editor.suggestion.thinking')}</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 border-t border-border bg-muted/30 px-3 py-2">
        {streaming ? (
          <button
            type="button"
            onClick={onReject}
            className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={13} /> {t('editor.suggestion.cancel')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onReject}
              className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={13} /> {t('editor.suggestion.discard')}
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RefreshCw size={13} /> {t('editor.suggestion.regenerate')}
            </button>
            {!errored && (
              <button
                type="button"
                onClick={onAccept}
                className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:brightness-110"
              >
                <Check size={13} /> {t('editor.suggestion.accept')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
