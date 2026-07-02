# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Scripto, please report it
**privately**:

- Email **info@atom.sa** with a description, reproduction steps, and
  any relevant details.
- **Do not open a public issue** for sensitive reports — public disclosure
  before a fix puts users at risk.

You can expect an **acknowledgement within 72 hours**. We'll keep you informed
as we investigate and work on a fix, and we'll credit you (if you wish) once the
issue is resolved.

## Security Model

Scripto is designed to be private by default:

- **Fully client-side.** There is no server or backend. Your documents never
  leave your browser unless you explicitly export or share them.
- **Encryption at rest (optional).** You can set a passphrase that enables
  **AES-256** encryption (via the Web Crypto API) for documents stored in the
  browser's `localStorage`.
- **Zero-knowledge.** The passphrase is **never stored or transmitted**. Because
  we hold no copy, **it cannot be recovered** — if you lose it, the encrypted
  data cannot be decrypted.
- **Bring-your-own AI key.** Any AI provider key you configure is stored locally
  and sent **only** to the provider you choose, directly from your browser. It
  is never routed through us.
