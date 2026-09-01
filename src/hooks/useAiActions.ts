import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { EditorView } from '@codemirror/view'
import { selectionOrParagraph } from '@/components/editor/editorCommands'
import type { AiToolbarAction } from '@/components/editor/EditorToolbar'
import type { AiSuggestionState } from '@/components/editor/AiSuggestionCard'
import type { AiInputRequest } from '@/components/layout/AiInputDialog'
import { AI_PROMPTS } from '@/lib/aiPrompts'
import { isAiConfigured, runAi, type AiConfig } from '@/lib/ai'
import { getErrorMessage } from '@/lib/logger'
import { trackEvent } from '@/lib/analytics'
import { useLanguage } from '@/i18n'

interface UseAiActionsOptions {
  /** The CodeMirror editor, once ready. */
  readonly view: EditorView | null
  readonly aiConfig: AiConfig
  /** Called when an action needs an API key that isn't configured yet. */
  readonly onNeedsSettings: () => void
}

export interface AiActionsApi {
  /** The staged suggestion currently streaming/awaiting a decision. */
  readonly suggestion: AiSuggestionState | null
  /** The prompt dialog request, when an action needs extra input. */
  readonly inputRequest: AiInputRequest | null
  readonly submitInput: (value: string) => void
  readonly closeInput: () => void
  readonly handleAction: (action: AiToolbarAction) => void
  readonly accept: () => void
  readonly reject: () => void
  readonly regenerate: () => void
  /** Inline ghost-text completion source (only wire when autocomplete is on). */
  readonly ghostComplete: (prefix: string, signal: AbortSignal) => Promise<string>
}

/**
 * All AI-assist behaviour for the editor: resolving the target range, streaming
 * a staged suggestion, and the prompt-driven actions (tone / translate /
 * generate). The document is never mutated until the user accepts.
 */
export function useAiActions({ view, aiConfig, onNeedsSettings }: UseAiActionsOptions): AiActionsApi {
  const { t } = useLanguage()
  const [suggestion, setSuggestion] = useState<AiSuggestionState | null>(null)
  const [input, setInput] = useState<{
    request: AiInputRequest
    run: (value: string) => void
  } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Never leave a request in flight behind us (navigation, lock, unmount).
  useEffect(() => () => abortRef.current?.abort(), [])

  /**
   * Resolve the text an AI action should operate on: the selection if there is
   * one, otherwise the paragraph around the cursor (so users aren't blocked by
   * having to select first). Also makes that range the active selection so the
   * result visibly replaces it. Routes to settings when no key is configured.
   */
  const requireSelection = useCallback((): {
    from: number
    to: number
    text: string
  } | null => {
    if (!view) {
      toast.error(t('toast.openEditorForAi'))
      return null
    }
    const target = selectionOrParagraph(view)
    if (!target) {
      toast.error(t('toast.addTextFirst'))
      return null
    }
    if (!isAiConfigured(aiConfig)) {
      toast.error(t('toast.addApiKeyFirst'))
      onNeedsSettings()
      return null
    }
    view.dispatch({ selection: { anchor: target.from, head: target.to } })
    return { from: target.from, to: target.to, text: target.text }
  }, [view, aiConfig, onNeedsSettings, t])

  /**
   * Stream an AI edit into a staged suggestion the document shows live; the user
   * then accepts, rejects, or regenerates it. The doc isn't changed until accept.
   */
  const runStaged = useCallback(
    (params: {
      system: string
      source: string
      kind: 'replace' | 'insert'
      from: number
      to: number
      label: string
    }) => {
      const { system, source, kind, from, to, label } = params
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setSuggestion({ from, to, kind, label, text: '', status: 'streaming', system, source })
      void (async () => {
        try {
          const full = await runAi(aiConfig, system, source, {
            signal: controller.signal,
            onToken: (chunk) =>
              setSuggestion((prev) =>
                prev && prev.status === 'streaming' ? { ...prev, text: prev.text + chunk } : prev,
              ),
          })
          if (controller.signal.aborted) return
          setSuggestion((prev) =>
            prev ? { ...prev, text: full.trim() || prev.text, status: 'done' } : prev,
          )
        } catch (error) {
          if (controller.signal.aborted) return
          setSuggestion((prev) =>
            prev ? { ...prev, status: 'error', error: getErrorMessage(error) } : prev,
          )
        }
      })()
    },
    [aiConfig],
  )

  const accept = useCallback(() => {
    if (!suggestion || !view || suggestion.status === 'streaming') return
    const { from, to, text } = suggestion
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from, head: from + text.length },
    })
    view.focus()
    setSuggestion(null)
    toast.success(t('toast.aiEditApplied'))
  }, [suggestion, view, t])

  const reject = useCallback(() => {
    abortRef.current?.abort()
    setSuggestion(null)
    view?.focus()
  }, [view])

  const regenerate = useCallback(() => {
    if (!suggestion) return
    const { system, source, kind, from, to, label } = suggestion
    runStaged({ system, source, kind, from, to, label })
  }, [suggestion, runStaged])

  const ghostComplete = useCallback(
    (prefix: string, signal: AbortSignal): Promise<string> =>
      runAi(aiConfig, AI_PROMPTS.autocomplete, prefix, { signal, bare: true }),
    [aiConfig],
  )

  const runSelectionTransform = useCallback(
    (system: string, label: string) => {
      const sel = requireSelection()
      if (!sel) return
      runStaged({ system, source: sel.text, kind: 'replace', from: sel.from, to: sel.to, label })
    },
    [requireSelection, runStaged],
  )

  const startGenerate = useCallback(() => {
    if (!view) {
      toast.error(t('toast.openEditorForAi'))
      return
    }
    if (!isAiConfigured(aiConfig)) {
      toast.error(t('toast.addApiKeyFirst'))
      onNeedsSettings()
      return
    }
    const pos = view.state.selection.main.head
    setInput({
      request: {
        title: t('ai.generate.title'),
        description: t('ai.generate.desc'),
        label: t('ai.generate.label'),
        placeholder: t('ai.generate.placeholder'),
        multiline: true,
        submitLabel: t('ai.generate.submit'),
      },
      run: (prompt) =>
        runStaged({
          system: AI_PROMPTS.generate,
          source: prompt,
          kind: 'insert',
          from: pos,
          to: pos,
          label: t('ai.generating'),
        }),
    })
  }, [view, aiConfig, runStaged, onNeedsSettings, t])

  const startTone = useCallback(() => {
    const sel = requireSelection()
    if (!sel) return
    setInput({
      request: {
        title: t('ai.tone.title'),
        label: t('ai.tone.label'),
        placeholder: t('ai.tone.placeholder'),
        submitLabel: t('ai.tone.submit'),
      },
      run: (tone) =>
        runStaged({
          system: AI_PROMPTS.tone(tone),
          source: sel.text,
          kind: 'replace',
          from: sel.from,
          to: sel.to,
          label: t('ai.rewriting'),
        }),
    })
  }, [requireSelection, runStaged, t])

  const startTranslate = useCallback(() => {
    const sel = requireSelection()
    if (!sel) return
    setInput({
      request: {
        title: t('ai.translate.title'),
        label: t('ai.translate.label'),
        placeholder: t('ai.translate.placeholder'),
        submitLabel: t('ai.translate.submit'),
      },
      run: (language) =>
        runStaged({
          system: AI_PROMPTS.translate(language),
          source: sel.text,
          kind: 'replace',
          from: sel.from,
          to: sel.to,
          label: t('ai.translating'),
        }),
    })
  }, [requireSelection, runStaged, t])

  const handleAction = useCallback(
    (action: AiToolbarAction) => {
      if (action !== 'settings') trackEvent('AI Action', { action })
      switch (action) {
        case 'improve':
          return runSelectionTransform(AI_PROMPTS.improve, t('ai.improving'))
        case 'grammar':
          return runSelectionTransform(AI_PROMPTS.grammar, t('ai.fixingGrammar'))
        case 'concise':
          return runSelectionTransform(AI_PROMPTS.concise, t('ai.makingConcise'))
        case 'expand':
          return runSelectionTransform(AI_PROMPTS.expand, t('ai.expanding'))
        case 'summarize':
          return runSelectionTransform(AI_PROMPTS.summarize, t('ai.summarizing'))
        case 'tone':
          return startTone()
        case 'translate':
          return startTranslate()
        case 'generate':
          return startGenerate()
        case 'settings':
          return onNeedsSettings()
      }
    },
    [runSelectionTransform, startTone, startTranslate, startGenerate, onNeedsSettings, t],
  )

  const submitInput = useCallback((value: string) => input?.run(value), [input])
  const closeInput = useCallback(() => setInput(null), [])

  return useMemo(
    () => ({
      suggestion,
      inputRequest: input?.request ?? null,
      submitInput,
      closeInput,
      handleAction,
      accept,
      reject,
      regenerate,
      ghostComplete,
    }),
    [suggestion, input, submitInput, closeInput, handleAction, accept, reject, regenerate, ghostComplete],
  )
}
