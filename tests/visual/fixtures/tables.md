# Wide tables & raw HTML

## 1 · Seven columns (the reported shape)

| Platform | Gate | Owner | Started | Status | Approved on | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Instagram | Business Verification | Aashir Haris | 2026-07-02 | ✅ Approved | 2026-07-19 | Took 17 days; CR in Arabic + English matched exactly. |
| Facebook Pages | App Review | Platform Team | 2026-07-04 | ⏳ In review | — | Screencast re-recorded at 1080p after first rejection. |
| Threads | App Review | Platform Team | 2026-07-21 | 🚫 Rejected | — | `threads_manage_insights` needs a separate app; resubmitting. |
| WhatsApp | Business Verification | Finance | 2026-06-28 | ✅ Approved | 2026-07-05 | Reused the portfolio verification from Instagram. |
| TikTok | Content Posting API | Growth | 2026-08-01 | ⏳ In review | — | Sandbox tenant provisioned, awaiting production scope. |

## 2 · Nine columns

| ID | Platform | Gate | Owner | Started | Status | Approved | Retries | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Instagram | Business Verification | Aashir | 2026-07-02 | Approved | 2026-07-19 | 0 | Clean first pass |
| 2 | Facebook | App Review | Platform | 2026-07-04 | In review | — | 1 | Screencast redone |
| 3 | Threads | App Review | Platform | 2026-07-21 | Rejected | — | 2 | Separate app needed |

## 3 · Five columns (must stay at the current density)

| Permission | Scope | Route | Required | Notes |
| --- | --- | --- | --- | --- |
| `instagram_basic` | Read | IG w/ FB Login | Yes | Baseline for every call |
| `instagram_content_publish` | Write | IG w/ FB Login | Yes | Publishing only |

## 4 · Long unbreakable content inside cells

| Endpoint | Docs |
| --- | --- |
| `POST /v26.0/{ig-user-id}/media_publish` | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/content-publishing |

## 5 · Raw HTML passthrough

<div style="border:1px solid #ccc;padding:8px;border-radius:6px">
  A raw <strong>HTML block</strong> with an inline <code>code_token</code> and a
  <a href="https://example.com">link</a>.
</div>

<table>
  <thead><tr><th>Raw</th><th>HTML</th><th>Table</th></tr></thead>
  <tbody><tr><td>one</td><td>two</td><td>three</td></tr></tbody>
</table>

## 6 · Malformed Markdown

| Broken | Table |
| --- |
| missing a cell |
| too | many | cells |

Unclosed emphasis **like this and a stray pipe | in text.

```ts
const unclosed = "this fence never closes"
