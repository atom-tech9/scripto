# Changelog

All notable changes to **Scripto** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [1.0.0] - 2026-07-01

### Added

- **Editor** — CodeMirror 6 with Markdown highlighting, line numbers, word-wrap, and undo/redo; formatting toolbar and shortcuts (`⌘B` / `⌘I` / `⌘E` / `⌘K`, lists, quotes); find & replace (`⌘F`); autosave to `localStorage` with cross-tab sync; command palette (`⌘K`); live outline navigator; slash commands; and optional bring-your-own-key AI assist (requests go straight from the browser to the provider).
- **Rich Markdown** — GitHub-Flavored Markdown, tables, task lists, footnotes, definition lists, emoji (`:rocket:`), `==highlight==`, `~sub~`, `^super^`, callouts/admonitions (`:::tip … :::`), syntax-highlighted code (Prism, 4 themes, copy button), math (KaTeX), Mermaid diagrams, and HTML passthrough.
- **PDF export** — real CSS Paged Media pagination via Paged.js: A4/Letter/Legal/A3/A5/custom page sizes, portrait & landscape, margin presets and custom margins, running headers (from the H1) and footers, page numbers (`x / y`), a table of contents with real page numbers, cover page, watermark, repeating table headers, and rows that never split across pages. The live preview matches the exported PDF exactly.
- **Design** — 21 document skins, one-click theme presets, a visual theme gallery, and a custom accent color plus custom CSS injected into the preview and the exported output.
- **Import** — Markdown, Word (`.docx`), HTML, and GitHub README (paste a repo URL).
- **Export** — PDF, Word (`.doc`), self-contained HTML, and Markdown.
- **Privacy & security** — no server; everything stays in the browser. Optional passphrase lock encrypts documents at rest with AES-256 (Web Crypto), zero-knowledge (the passphrase is never stored or sent), plus auto-lock on inactivity.
- **Internationalization & RTL** — full English and Arabic UI with correct right-to-left layout and Arabic fonts (Cairo); configurable document direction.
- **PWA** — installable and fully functional offline after first load.

[Unreleased]: https://github.com/your-org/scripto/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/scripto/releases/tag/v1.0.0
