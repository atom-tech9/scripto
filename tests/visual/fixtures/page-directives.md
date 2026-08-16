# Page layout directives

Text on the first page, before any forced break.

::page-break

## After a forced break

This heading must start a new page because of the `::page-break` above it.

:::keep-together
### A run that must not split

- [ ] first item
- [ ] second item
- [ ] third item

| Step | Owner |
| --- | --- |
| Draft | Platform |
| Review | Legal |
:::

::page-break

## Landscape

:::landscape
### A table that needs the extra width

| ID | Platform | Gate | Owner | Started | Status | Approved | Retries | Escalated | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Instagram | Business Verification | Aashir Haris | 2026-07-02 | Approved | 2026-07-19 | 0 | No | Clean first pass, no follow-up needed |
| 2 | Facebook Pages | App Review | Platform Team | 2026-07-04 | In review | — | 1 | No | Screencast re-recorded at 1080p |
| 3 | Threads | App Review | Platform Team | 2026-07-21 | Rejected | — | 2 | Yes | Needs a separate app registration |
:::

Back to portrait after the landscape section.
