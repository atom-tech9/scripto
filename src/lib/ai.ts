/**
 * Bring-your-own-key AI client. Talks directly to the provider from the browser
 * using the user's own API key (stored locally, never sent anywhere else and
 * never logged). No backend is involved.
 *
 * Responses are streamed (SSE) and surfaced token-by-token via `onToken` so the
 * UI can render them live; the full text is also returned when the stream ends.
 */

export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'custom'

/** Reasoning / thinking effort. 'default' lets the model decide (param omitted). */
export type AiReasoning = 'default' | 'low' | 'medium' | 'high'

export interface AiConfig {
  provider: AiProvider
  apiKey: string
  model: string
  baseUrl?: string
  /** Sampling temperature, 0–1 (clamped per provider). */
  temperature: number
  reasoning: AiReasoning
  /** Inline ghost-text autocomplete (fires a request per typing pause). */
  autocomplete?: boolean
}

/**
 * Sensible small/fast default model per provider (mid-2026). Models change
 * often — these are editable in settings and verifiable with "Test connection".
 */
export const DEFAULT_AI_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-5-mini',
  anthropic: 'claude-haiku-4-5',
  gemini: 'gemini-2.5-flash',
  openrouter: 'openai/gpt-5-mini',
  custom: '',
}

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  custom: 'Custom (OpenAI-compatible)',
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'openai',
  apiKey: '',
  model: DEFAULT_AI_MODELS.openai,
  temperature: 0.7,
  reasoning: 'default',
  autocomplete: false,
}

const MAX_TOKENS = 2000

/** Reasoning → thinking-token budgets for providers that take an explicit budget. */
const ANTHROPIC_BUDGET: Record<Exclude<AiReasoning, 'default'>, number> = {
  low: 1024,
  medium: 4000,
  high: 10000,
}
const GEMINI_BUDGET: Record<Exclude<AiReasoning, 'default'>, number> = {
  low: 1024,
  medium: 4096,
  high: 12288,
}

export interface RunOptions {
  signal?: AbortSignal
  /** Called with each incremental text chunk as it streams in. */
  onToken?: (chunk: string) => void
  /**
   * Send a minimal request: no temperature, no reasoning/thinking — just the
   * prompt. Used by the connection test so it checks auth + model + network only
   * and never trips on model-specific parameter restrictions.
   */
  bare?: boolean
}

export interface AiTestResult {
  ok: boolean
  message: string
}

/** Whether a config has the minimum needed to make a request. */
export function isAiConfigured(cfg: AiConfig): boolean {
  return cfg.apiKey.trim().length > 0 && cfg.model.trim().length > 0
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function temperatureOf(cfg: AiConfig): number {
  return clamp(typeof cfg.temperature === 'number' ? cfg.temperature : 0.7, 0, 1)
}

/**
 * Whether an OpenAI-style model accepts a custom `temperature`. GPT-5 and the
 * o-series reasoning models reject/deprecate it (they pin temperature), as does
 * anything run with an explicit reasoning effort.
 */
function openAiAcceptsTemperature(cfg: AiConfig): boolean {
  if (cfg.reasoning !== 'default') return false
  return !/(^|\/)(gpt-5|o[1-4])(\b|[-_.])/i.test(cfg.model.trim())
}

interface ProviderErrorBody {
  error?: { message?: string } | string
  message?: string
}

async function describeError(response: Response): Promise<string> {
  let detail = ''
  try {
    const body = (await response.json()) as ProviderErrorBody
    if (typeof body.error === 'string') detail = body.error
    else detail = body.error?.message ?? body.message ?? ''
  } catch {
    /* non-JSON error body */
  }
  if (response.status === 401 || response.status === 403) return 'Invalid or unauthorized API key.'
  if (response.status === 404) return 'Model or endpoint not found — check the model name.'
  if (response.status === 429) return 'Rate limit reached. Try again shortly.'
  return detail ? `AI request failed: ${detail}` : `AI request failed (${response.status}).`
}

/**
 * Read an SSE response body, invoking `onData` with the payload after each
 * `data:` line. Tolerates multi-line events and CRLF.
 */
async function readSSE(response: Response, onData: (data: string) => void): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Streaming is not supported by this response.')
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let sep: number
    // Events are separated by a blank line (\n\n), normalise CRLF first.
    buffer = buffer.replace(/\r\n/g, '\n')
    while ((sep = buffer.indexOf('\n\n')) >= 0) {
      const event = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      for (const line of event.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data:')) onData(trimmed.slice(5).trim())
      }
    }
  }
}

function openAiBaseUrl(cfg: AiConfig): string {
  const custom = cfg.baseUrl?.trim()
  if (custom) return custom.replace(/\/+$/, '')
  if (cfg.provider === 'openrouter') return 'https://openrouter.ai/api/v1'
  return 'https://api.openai.com/v1'
}

async function runOpenAiCompatible(
  cfg: AiConfig,
  system: string,
  user: string,
  opts: RunOptions,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    stream: true,
  }
  if (!opts.bare && openAiAcceptsTemperature(cfg)) body.temperature = temperatureOf(cfg)
  if (!opts.bare && cfg.reasoning !== 'default') {
    // OpenRouter uses a unified `reasoning` object (which it maps to each
    // upstream provider's native format, e.g. Anthropic thinking budgets);
    // OpenAI/compatible endpoints use the flat `reasoning_effort` field.
    if (cfg.provider === 'openrouter') body.reasoning = { effort: cfg.reasoning }
    else body.reasoning_effort = cfg.reasoning
  }

  const response = await fetch(`${openAiBaseUrl(cfg)}/chat/completions`, {
    method: 'POST',
    signal: opts.signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(await describeError(response))

  let full = ''
  await readSSE(response, (data) => {
    if (data === '[DONE]') return
    try {
      const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> }
      const delta = json.choices?.[0]?.delta?.content
      if (typeof delta === 'string' && delta) {
        full += delta
        opts.onToken?.(delta)
      }
    } catch {
      /* ignore keep-alive / partial lines */
    }
  })
  return full
}

async function runAnthropic(
  cfg: AiConfig,
  system: string,
  user: string,
  opts: RunOptions,
): Promise<string> {
  const base = cfg.baseUrl?.trim()?.replace(/\/+$/, '') ?? 'https://api.anthropic.com'
  const body: Record<string, unknown> = {
    model: cfg.model,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: user }],
    stream: true,
  }
  if (!opts.bare) {
    if (cfg.reasoning !== 'default') {
      const budget = ANTHROPIC_BUDGET[cfg.reasoning]
      body.thinking = { type: 'enabled', budget_tokens: budget }
      body.max_tokens = budget + MAX_TOKENS // output budget must exceed thinking budget
    } else {
      body.temperature = temperatureOf(cfg)
    }
  }

  const response = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      // Required for direct browser (CORS) access to the Anthropic API.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(await describeError(response))

  let full = ''
  await readSSE(response, (data) => {
    try {
      const json = JSON.parse(data) as { type?: string; delta?: { type?: string; text?: string } }
      if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
        const text = json.delta.text ?? ''
        if (text) {
          full += text
          opts.onToken?.(text)
        }
      }
    } catch {
      /* ignore */
    }
  })
  return full
}

interface GeminiPart {
  text?: string
}
interface GeminiStreamChunk {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
}

async function runGemini(
  cfg: AiConfig,
  system: string,
  user: string,
  opts: RunOptions,
): Promise<string> {
  const base = cfg.baseUrl?.trim()?.replace(/\/+$/, '') ?? 'https://generativelanguage.googleapis.com'
  const generationConfig: Record<string, unknown> = {}
  if (!opts.bare) {
    generationConfig.temperature = temperatureOf(cfg)
    if (cfg.reasoning !== 'default') {
      generationConfig.thinkingConfig = { thinkingBudget: GEMINI_BUDGET[cfg.reasoning] }
    }
  }

  const response = await fetch(
    `${base}/v1beta/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      signal: opts.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig,
      }),
    },
  )
  if (!response.ok) throw new Error(await describeError(response))

  let full = ''
  await readSSE(response, (data) => {
    try {
      const json = JSON.parse(data) as GeminiStreamChunk
      const parts = json.candidates?.[0]?.content?.parts ?? []
      for (const part of parts) {
        if (typeof part.text === 'string' && part.text) {
          full += part.text
          opts.onToken?.(part.text)
        }
      }
    } catch {
      /* ignore */
    }
  })
  return full
}

/**
 * Run a single system+user prompt against the configured provider, streaming the
 * result. Returns the full text. Never logs the key. Supports `AbortSignal`.
 */
export async function runAi(
  cfg: AiConfig,
  system: string,
  user: string,
  opts: RunOptions = {},
): Promise<string> {
  if (!isAiConfigured(cfg)) throw new Error('Add your API key in AI settings first.')
  switch (cfg.provider) {
    case 'anthropic':
      return runAnthropic(cfg, system, user, opts)
    case 'gemini':
      return runGemini(cfg, system, user, opts)
    default:
      return runOpenAiCompatible(cfg, system, user, opts)
  }
}

/**
 * Lightweight connectivity check: sends a tiny prompt and verifies a reply.
 * Returns a friendly result rather than throwing.
 */
export async function testAiConnection(cfg: AiConfig, signal?: AbortSignal): Promise<AiTestResult> {
  if (!isAiConfigured(cfg)) return { ok: false, message: 'Add an API key and model first.' }
  try {
    const reply = await runAi(
      cfg,
      'You are a connectivity test. Reply with the single word: OK.',
      'ping',
      { signal, bare: true },
    )
    if (reply.trim().length === 0) return { ok: false, message: 'Connected, but the model returned no text.' }
    return { ok: true, message: `Connected — ${PROVIDER_LABELS[cfg.provider]} · ${cfg.model} responded.` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Connection failed.' }
  }
}
