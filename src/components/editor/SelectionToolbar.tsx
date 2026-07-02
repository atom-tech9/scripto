import { useLayoutEffect, useState, type RefObject } from 'react'
import {
  Expand,
  Languages,
  ScissorsLineDashed,
  Sparkles,
  SpellCheck,
  Wand2,
  WrapText,
  type LucideIcon,
} from 'lucide-react'
import type { EditorView } from '@codemirror/view'
import { useLanguage } from '@/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { selectionBox } from './overlayGeometry'
import type { AiToolbarAction } from './EditorToolbar'

interface SelectionToolbarProps {
  view: EditorView | null
  wrapperRef: RefObject<HTMLElement | null>
  /** Bump this to recompute position (selection / scroll / geometry changes). */
  tick: number
  /** Hidden while a suggestion preview is open or AI is mid-run. */
  suppressed: boolean
  onAction: (action: AiToolbarAction) => void
}

const ACTIONS: Array<{ action: AiToolbarAction; labelKey: TranslationKey; icon: LucideIcon }> = [
  { action: 'improve', labelKey: 'editor.ai.improve', icon: Sparkles },
  { action: 'grammar', labelKey: 'editor.ai.grammar', icon: SpellCheck },
  { action: 'concise', labelKey: 'editor.ai.concise', icon: ScissorsLineDashed },
  { action: 'expand', labelKey: 'editor.ai.expand', icon: Expand },
  { action: 'summarize', labelKey: 'editor.ai.summarize', icon: WrapText },
  { action: 'tone', labelKey: 'editor.selection.tone', icon: Wand2 },
  { action: 'translate', labelKey: 'editor.selection.translate', icon: Languages },
]

const TOOLBAR_HEIGHT = 40

/**
 * A compact action bar that floats just above the current text selection, giving
 * one-click access to the AI edits without leaving the editor.
 */
export function SelectionToolbar({
  view,
  wrapperRef,
  tick,
  suppressed,
  onAction,
}: SelectionToolbarProps) {
  const { t, dir } = useLanguage()
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!view || !wrapper || suppressed) {
      setPos(null)
      return
    }
    const box = selectionBox(view, wrapper, dir)
    if (!box) {
      setPos(null)
      return
    }
    // Prefer above the selection; flip below if there's no room.
    const above = box.top - TOOLBAR_HEIGHT - 6
    const top = above < 4 ? box.bottom + 6 : above
    // Clamp the centre within the wrapper so the bar stays on-screen in both directions.
    const left = Math.min(Math.max(8, box.centerX), Math.max(8, wrapper.clientWidth - 8))
    setPos({ top, left })
  }, [view, wrapperRef, tick, suppressed, dir])

  if (!pos) return null

  return (
    <div
      role="toolbar"
      aria-label={t('editor.selection.quickActions')}
      // Keep the editor selection alive when interacting with the bar.
      onMouseDown={(e) => e.preventDefault()}
      style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
      className="absolute z-30 flex items-center gap-0.5 rounded-lg border border-border bg-surface/95 p-1 shadow-lg backdrop-blur animate-pop-in"
    >
      <span className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-primary">
        <Sparkles size={13} /> {t('editor.ai.badge')}
      </span>
      <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
      {ACTIONS.map(({ action, labelKey, icon: Icon }) => {
        const label = t(labelKey)
        return (
        <button
          key={action}
          type="button"
          title={label}
          aria-label={label}
          onClick={() => onAction(action)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon size={15} />
        </button>
        )
      })}
    </div>
  )
}
