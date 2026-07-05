import type { InfoPageContent } from '../types'

const features: InfoPageContent = {
  slug: 'features',
  meta: {
    title: 'Scripto Features — Paginated Markdown to PDF, In Depth',
    description:
      'Every Scripto feature: true pagination, running headers, 20+ skins, 50+ templates, KaTeX, Mermaid, Arabic/RTL, offline PWA, encrypted vault and optional AI.',
    path: '/features',
    keyword: 'markdown to pdf features',
  },
  h1: 'Everything Scripto does.',
  intro: [
    'Scripto is a single-purpose tool taken seriously: turn Markdown into documents that look professionally typeset. Here is the complete feature set — no tiers, everything free.',
  ],
  heroImage: {
    dark: '/screenshots/editor-dark.png',
    light: '/screenshots/editor-light.png',
    alt: 'The Scripto editor: Markdown source beside the live paginated PDF preview',
    width: 2940,
    height: 1536,
  },
  sections: [
    {
      heading: 'A real pagination engine',
      paragraphs: [
        'The preview pane is not a web view — it is your document laid out into actual pages by a CSS paged-media engine (Paged.js). Page size (A4, Letter and more), orientation, margins and bleed are document settings, and every change re-typesets the pages live.',
      ],
      bullets: [
        'Running headers and footers with custom text or the document title',
        'Page numbers and “Page X of Y” counters',
        'One-click cover page: title, subtitle, author, date',
        'Clickable table of contents generated from headings',
        'Widow/orphan control; headings kept with their content',
        'Manual page breaks with \\pagebreak',
        'Watermarks and per-document custom CSS',
      ],
    },
    {
      heading: 'Twenty-plus skins, fifty-plus templates',
      paragraphs: [
        'Skins restyle the whole document for print — typography, rules, spacing, code-block treatment — without touching your Markdown: Swiss grids, editorial serifs, engineering blueprints, terminal green, newsprint and more. Templates cover the documents people actually ship: resumes (seven ATS variants), invoices, proposals, RFCs, meeting notes, syllabi, press releases, and a full set of Mermaid diagram starters.',
      ],
    },
    {
      heading: 'Technical writing, fully loaded',
      paragraphs: [
        'GitHub-Flavored Markdown plus KaTeX math, Mermaid diagrams, syntax-highlighted code in dozens of languages, callout boxes, highlights, footnotes, definition lists and emoji. Import exists too: drop a .docx (converted via Mammoth) or paste rich HTML (converted via Turndown) and get clean Markdown.',
      ],
    },
    {
      heading: 'An editor that stays out of the way',
      paragraphs: [
        'CodeMirror 6 underneath: keyboard shortcuts for every formatting action, a document outline panel, zen mode, split/editor/preview layouts, autosave to a local document library, and word/character/reading-time stats in the status bar.',
      ],
    },
    {
      heading: 'Arabic and right-to-left, first-class',
      paragraphs: [
        'RTL is a document direction setting that mirrors the entire page geometry — headers, footers, page numbers, list indentation — with Arabic-optimized fonts (Cairo, Noto Naskh Arabic, Amiri) and a fully translated Arabic UI.',
      ],
    },
    {
      heading: 'Offline, installable, private',
      paragraphs: [
        'Scripto is a PWA: install it and it works with no connection — parsing, preview and PDF export are all client-side. Documents live in your browser’s local storage, and an optional passphrase lock encrypts everything at rest. Open source under MIT.',
      ],
    },
    {
      heading: 'Optional AI, your key',
      paragraphs: [
        'A built-in assistant can polish, summarize or translate — powered by your own API key, sent directly from your browser to the provider you choose. No key, no AI, no data flow: it is entirely opt-in.',
      ],
    },
  ],
  related: [
    { label: 'Getting started', to: '/getting-started' },
    { label: 'Browse skins', to: '/skins' },
    { label: 'Browse templates', to: '/templates' },
    { label: 'Privacy', to: '/privacy' },
  ],
}

const gettingStarted: InfoPageContent = {
  slug: 'getting-started',
  meta: {
    title: 'Getting Started with Scripto — First PDF in 2 Minutes',
    description:
      'From zero to a typeset PDF in three steps: pick a template, make it yours, export. Plus the keyboard shortcuts and settings worth knowing on day one.',
    path: '/getting-started',
    keyword: 'markdown to pdf tutorial',
  },
  h1: 'Your first PDF in two minutes.',
  intro: [
    'No account, no install, no configuration. Open the editor and follow the same three steps the in-app tour walks you through.',
  ],
  sections: [
    {
      heading: 'Step 1 — Start from a template',
      paragraphs: [
        'Open Templates (toolbar) and pick something close to your document — a report, a resume, meeting notes. Templates are complete, well-structured documents; deleting is faster than inventing. Starting from scratch? The sample document doubles as a tour of every feature.',
      ],
    },
    {
      heading: 'Step 2 — Make it yours',
      paragraphs: [
        'Write on the left; the right pane shows real pages as they will print. Use the toolbar or shortcuts for formatting, the outline panel to jump between sections, and the settings panel to switch skin, paper size, fonts, and headers/footers. Everything autosaves locally.',
      ],
      bullets: [
        'Bold ⌘B · Italic ⌘I · Link ⌘K',
        'Headings ⌘1–⌘3 · Code block ⌘⇧C',
        'Zen mode for distraction-free writing',
        'Document library: keep many documents, duplicate for versions',
      ],
    },
    {
      heading: 'Step 3 — Export the PDF',
      paragraphs: [
        'Click Export PDF. Optionally enable the cover page and table of contents in the export preview, then save. The file is generated in your browser — it never touches a server — and matches the preview page for page.',
      ],
    },
    {
      heading: 'Worth knowing on day one',
      paragraphs: [
        'Skins change the document’s whole personality — try Editorial or Swiss on the same text. Direction (LTR/RTL) lives in document settings for Arabic writing. The status bar shows live word counts and reading time. And if you work with sensitive documents, enable the passphrase lock: it encrypts your local library.',
      ],
    },
  ],
  faq: [
    {
      q: 'Do I need to create an account?',
      a: 'No. There are no accounts. Open the app and write; documents persist in your browser.',
    },
    {
      q: 'Where are my documents stored?',
      a: 'In your browser’s local storage on your device. Export the .md files for backup, or enable the encrypted vault for at-rest protection.',
    },
    {
      q: 'Can I use it on my phone or tablet?',
      a: 'The editor works best on desktop-class screens; the exported PDFs of course open anywhere.',
    },
    {
      q: 'How do I install it as an app?',
      a: 'Use your browser’s “Install app” action (address-bar icon in Chrome/Edge). After that Scripto launches standalone and works offline.',
    },
  ],
  related: [
    { label: 'All features', to: '/features' },
    { label: 'Markdown cheat sheet', to: '/markdown-cheat-sheet' },
    { label: 'Browse templates', to: '/templates' },
  ],
}

const privacy: InfoPageContent = {
  slug: 'privacy',
  meta: {
    title: 'Privacy — Scripto Has No Server to Trust',
    description:
      'Scripto’s privacy model in plain language: your documents never leave your device, there are no accounts, and the only analytics are cookieless page counts on this site.',
    path: '/privacy',
    keyword: 'private markdown editor',
  },
  h1: 'Privacy, in plain language.',
  intro: [
    'The honest summary: Scripto is designed so that we could not read your documents even if we wanted to. There is no server component, no account system, and no transmission of your writing.',
  ],
  sections: [
    {
      heading: 'Your documents',
      paragraphs: [
        'Everything you write is processed inside your browser tab — parsing, preview, PDF generation — and stored in your browser’s local storage on your device. Nothing is uploaded, synced or backed up by us. Deleting your browser data deletes your documents; export .md files for your own backups.',
        'The optional passphrase lock encrypts your entire local library (AES, key derived from your passphrase). We cannot recover a forgotten passphrase — that is the point.',
      ],
    },
    {
      heading: 'The optional AI assistant',
      paragraphs: [
        'The AI features are off until you paste your own API key. When you invoke them, the selected text is sent directly from your browser to the provider you configured (e.g. Anthropic or OpenAI) under their privacy terms — never through any Scripto server. Your key is stored locally alongside your other settings.',
      ],
    },
    {
      heading: 'This website’s analytics',
      paragraphs: [
        'We count page views with Vercel Web Analytics — served first-party by our host, cookieless, with no personal identifiers, fingerprinting or cross-site tracking. It cannot see your documents: analytics record that the editor page was opened, never what you write in it.',
      ],
    },
    {
      heading: 'Third-party resources',
      paragraphs: [
        'Fonts load from Google Fonts’ CDN (subject to Google’s privacy policy); after the first visit the PWA caches them locally. There are no ad networks, no tracking pixels, and no social embeds anywhere on the site.',
      ],
    },
    {
      heading: 'Open source, auditable',
      paragraphs: [
        'The entire application is open source under the MIT license. Every claim on this page can be verified by reading the code — the strongest privacy guarantee software can offer.',
      ],
    },
  ],
  related: [
    { label: 'About Scripto', to: '/about' },
    { label: 'All features', to: '/features' },
  ],
}

const about: InfoPageContent = {
  slug: 'about',
  meta: {
    title: 'About Scripto — Built by Atom',
    description:
      'Scripto is a free, open-source Markdown → PDF studio built by Atom. The story, the principles and the technology behind it.',
    path: '/about',
    keyword: 'about scripto',
  },
  h1: 'About Scripto.',
  intro: [
    'Scripto exists because turning Markdown into a genuinely well-typeset PDF was still harder than it had any right to be: LaTeX asks for a toolchain, exporters print web pages, and online converters ask you to upload your documents to strangers.',
  ],
  sections: [
    {
      heading: 'The principle: the preview is the PDF',
      paragraphs: [
        'One decision shaped everything else: the editor should show real pages, laid out by the same engine that produces the export. From there, running headers, cover pages, skins and RTL support are features of one honest pipeline instead of promises about a hidden one.',
      ],
    },
    {
      heading: 'Built by Atom',
      paragraphs: [
        'Scripto is designed and built by Atom, a software studio crafting focused, privacy-respecting tools. Arabic and RTL support is not a checkbox for us — it is a founding requirement, built and tested from day one.',
      ],
    },
    {
      heading: 'The technology',
      paragraphs: [
        'React + TypeScript + Vite; CodeMirror 6 for editing; remark/rehype for Markdown; KaTeX and Mermaid for math and diagrams; Paged.js for CSS paged-media layout; a service worker for full offline operation. Open source under MIT — issues and pull requests welcome.',
      ],
    },
    {
      heading: 'Free means free',
      paragraphs: [
        'No tiers, no locked exports, no watermarks, no accounts. The optional AI assistant uses your own API key. If Scripto saves you an afternoon, a GitHub star is the only currency we take.',
      ],
    },
  ],
  related: [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Getting started', to: '/getting-started' },
    { label: 'All features', to: '/features' },
  ],
}

export const INFO_PAGES: InfoPageContent[] = [features, gettingStarted, privacy, about]

export const findInfoPage = (slug: string): InfoPageContent | undefined =>
  INFO_PAGES.find((page) => page.slug === slug)
