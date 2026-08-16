# Code block pagination test

Some intro text so the first code block does not start at the very top of the page,
which is what makes the "jumps to the next page" behaviour visible in the first place.

## A · Wide lines (must wrap, not clip)

```nginx
# SSE / token-streaming AI endpoints — must NOT buffer.
location /api/ai/ {
    proxy_pass http://127.0.0.1:3003;
    proxy_http_version 1.1;              # chunked + keepalive (default is 1.0 pre-nginx-1.29.7)
    proxy_set_header Connection "";       # required for upstream keepalive on HTTP/1.1
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_buffering off;                  # pass response to client as-received (default: on = buffered)
    proxy_cache off;
    proxy_read_timeout 300s;              # between two successive reads — heartbeats reset it
    proxy_send_timeout 300s;
    gzip off;                             # belt-and-braces; text/event-stream isn't in gzip_types anyway
    chunked_transfer_encoding on;         # default on — do not disable
}
```

Text between the two blocks.

## B · Tall block (must split across pages, not jump)

```ts
export async function streamCompletion(req: StreamRequest): Promise<StreamHandle> {
  const controller = new AbortController()
  const signal = controller.signal
  const started = performance.now()
  const decoder = new TextDecoder()
  let buffered = ''
  let tokens = 0

  const response = await fetch(req.endpoint, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      authorization: `Bearer ${req.token}`,
    },
    body: JSON.stringify({ model: req.model, messages: req.messages, stream: true }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new StreamError(`upstream ${response.status}`, { status: response.status, detail })
  }
  if (!response.body) {
    throw new StreamError('upstream returned no body', { status: response.status })
  }

  const reader = response.body.getReader()

  async function pump(): Promise<void> {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffered += decoder.decode(value, { stream: true })

      let index = buffered.indexOf('\n\n')
      while (index !== -1) {
        const frame = buffered.slice(0, index)
        buffered = buffered.slice(index + 2)
        index = buffered.indexOf('\n\n')

        if (!frame.startsWith('data:')) continue
        const payload = frame.slice(5).trim()
        if (payload === '[DONE]') return

        try {
          const parsed = JSON.parse(payload) as StreamFrame
          tokens += 1
          req.onToken(parsed.choices[0]?.delta?.content ?? '')
        } catch (error) {
          req.onError(new StreamError('malformed frame', { cause: error }))
        }
      }
    }
  }

  await pump()
  return { tokens, elapsed: performance.now() - started, abort: () => controller.abort() }
}
```

Trailing paragraph after the tall block.
