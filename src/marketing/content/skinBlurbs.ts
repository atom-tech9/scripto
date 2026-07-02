/**
 * Editorial blurbs for each document skin's dedicated page (/skins/:id).
 * Two sentences: personality, then when to reach for it.
 */
export const SKIN_BLURBS: Record<string, { voice: string; bestFor: string }> = {
  modern: {
    voice: 'Clean sans-serif typography, balanced spacing and a quiet indigo accent — the default that never embarrasses you.',
    bestFor: 'Reports, proposals, product docs and anything a client will read tomorrow morning.',
  },
  classic: {
    voice: 'Centered headings over ruled lines with bookish serif body text — formal without being stiff.',
    bestFor: 'Letters, academic hand-ins, official statements and documents with signatures at the bottom.',
  },
  editorial: {
    voice: 'Magazine DNA: a drop cap, confident serif headlines and generous leading.',
    bestFor: 'Essays, long-form articles, newsletters and anything meant to be read for pleasure.',
  },
  technical: {
    voice: 'Side-bar headings, boxed code blocks and a no-nonsense grid — reads like excellent API documentation.',
    bestFor: 'READMEs, API references, runbooks, engineering handbooks.',
  },
  compact: {
    voice: 'Dense but disciplined: smaller type, tighter rhythm, maximum signal per page.',
    bestFor: 'Cheat sheets, one-pagers, exam notes and handouts that must fit one sheet.',
  },
  manuscript: {
    voice: 'Typewriter texture with indented paragraphs — the working draft aesthetic, dignified.',
    bestFor: 'Fiction drafts, screenplays-adjacent notes, submission manuscripts.',
  },
  blueprint: {
    voice: 'Monospaced accents on a faint engineering grid, cool blue ink.',
    bestFor: 'Architecture docs, RFCs, system designs, anything with diagrams.',
  },
  corporate: {
    voice: 'Filled heading bands, card-like callouts, confident brand-blue structure.',
    bestFor: 'Business reports, quarterly reviews, client deliverables with a logo on the cover.',
  },
  brutalist: {
    voice: 'Heavy borders, hard shadows, uppercase headings — typography with elbows.',
    bestFor: 'Zines, manifestos, portfolio pieces and documents meant to be noticed.',
  },
  notebook: {
    voice: 'Highlighter marks and dashed rules — a well-kept notebook, not a slick brochure.',
    bestFor: 'Study notes, workshop handouts, personal knowledge dumps.',
  },
  resume: {
    voice: 'Single column, crisp section rules, recruiter-tested restraint.',
    bestFor: 'Resumes and cover letters that must survive ATS parsers and human skimmers alike.',
  },
  swiss: {
    voice: 'International Typographic Style: strict grid, bold rules, red accent, zero decoration.',
    bestFor: 'Design-literate audiences, portfolios, statements of work.',
  },
  terminal: {
    voice: 'Dark ground, phosphor-green mono type — the console, typeset.',
    bestFor: 'Dev culture docs, incident postmortems, hacker-flavored handouts.',
  },
  newsprint: {
    voice: 'Newspaper serif with kickers and double rules — reads like the Sunday edition.',
    bestFor: 'Newsletters, digests, announcement one-pagers.',
  },
  elegant: {
    voice: 'High-contrast serif over hairline rules with warm paper tones.',
    bestFor: 'Invitations, menus, certificates, brand documents with taste.',
  },
  playful: {
    voice: 'Rounded pill headings and friendly color — serious content, warm delivery.',
    bestFor: 'Onboarding guides, community docs, education for younger readers.',
  },
  dark: {
    voice: 'Light text on dark surface, tuned so it still prints legibly.',
    bestFor: 'Screen-first PDFs: pitch leave-behinds, tech one-pagers, gamer-adjacent anything.',
  },
  ledger: {
    voice: 'Tabular numerals, ruled rows, bookkeeping calm.',
    bestFor: 'Invoices, pricing sheets, financial summaries and anything with numbers in columns.',
  },
  zen: {
    voice: 'Ultra-minimal and centered, with whitespace doing the talking.',
    bestFor: 'Poetry, statements, single-idea documents, title pages.',
  },
  memo: {
    voice: 'A corporate header band and compact body — the interoffice memo, modernized.',
    bestFor: 'Internal memos, briefs, decision records.',
  },
  poster: {
    voice: 'Oversized display headings that treat the page like a billboard.',
    bestFor: 'Event flyers, announcements, section dividers, cover pages.',
  },
}
