import type { UseCaseContent } from '../../types'

export const resumeToPdf: UseCaseContent = {
  slug: 'resume-to-pdf',
  meta: {
    title: 'Markdown Resume to PDF — ATS-Friendly, Free, No Signup',
    description:
      'Write your resume in Markdown and export a clean, ATS-friendly PDF in minutes. 7 resume templates, single-column skins, perfect one-page control. Free forever.',
    path: '/resume-to-pdf',
    keyword: 'markdown resume to pdf',
  },
  h1: 'Your resume, in Markdown, out as a flawless PDF.',
  intro: [
    'A resume is the one document where layout mistakes cost you interviews. Word templates drift the moment you add a line; design tools produce PDFs that applicant-tracking systems (ATS) can’t parse; and online builders hold your own resume hostage behind a subscription.',
    'Writing your resume in Markdown fixes the workflow — plain text, versionable, diffable — and Scripto fixes the output: a typeset, single-column, ATS-parseable PDF where you control exactly what fits on one page, previewed as a real page while you type.',
  ],
  howTo: {
    title: 'How to make a resume PDF from Markdown',
    steps: [
      {
        name: 'Start from a resume template',
        text: 'Pick one of seven ATS resume templates — classic, modern, software engineer, manager, new-grad, executive, career-change — and replace the placeholders with your details.',
      },
      {
        name: 'Watch the one-page boundary',
        text: 'The preview shows the actual page edge. Trim bullets or tighten spacing until everything sits on one page — no printing surprises.',
      },
      {
        name: 'Apply the Résumé skin',
        text: 'A single-column, recruiter-tested layout: clear section rules, readable 10.5–11pt type, no tables or columns that confuse ATS parsers.',
      },
      {
        name: 'Export and send',
        text: 'Export PDF and attach it. The text layer is real text (not an image), so keyword scanners read every word.',
      },
    ],
  },
  sections: [
    {
      heading: 'What makes a PDF “ATS-friendly”?',
      paragraphs: [
        'Applicant-tracking systems extract raw text from your PDF and try to reconstruct sections. Multi-column layouts, text boxes, tables and icon fonts scramble that extraction. The safe formula is boring on purpose: one column, standard headings, real text, common fonts.',
        'Scripto’s resume templates and Résumé skin implement exactly that formula — while still looking sharp to the human who reads it after the robot.',
      ],
      bullets: [
        'Single column, top-to-bottom reading order',
        'Standard section names (Experience, Education, Skills)',
        'Genuine text layer — searchable, selectable, parseable',
        'No headers/footers inside the resume body to confuse parsers',
      ],
    },
    {
      heading: 'One source, many versions',
      paragraphs: [
        'Because the resume is plain Markdown, tailoring it per application is a copy-paste, not a layout project. Keep a master document in Scripto’s library, duplicate it per role, tweak the bullets, export. The formatting never drifts between versions.',
      ],
    },
    {
      heading: 'Your resume is nobody’s data',
      paragraphs: [
        'Resume builders monetize your personal data or watermark the free tier. Scripto has no server and no account: your name, history and contact details stay in your browser’s local storage, optionally encrypted with a passphrase.',
      ],
    },
  ],
  faq: [
    {
      q: 'Will my resume really pass ATS scanners?',
      a: 'The templates follow the rules ATS vendors publish: single column, real text, standard headings, no tables. The exported PDF has a clean text layer — paste it into any “ATS checker” to verify extraction.',
    },
    {
      q: 'Can I keep it to exactly one page?',
      a: 'Yes — that is the point of the paginated preview. You see the page boundary while editing and can adjust font size, margins and spacing until it fits.',
    },
    {
      q: 'Are the resume templates free?',
      a: 'All seven are free, like everything in Scripto. No upsell at export time.',
    },
    {
      q: 'Can I write an Arabic resume?',
      a: 'Yes — combine the resume template with RTL direction and Arabic fonts. See the Arabic PDF guide for details.',
    },
    {
      q: 'PDF or DOCX for job applications?',
      a: 'PDF, unless the posting explicitly demands DOCX: PDF freezes your layout on every device. Scripto exports PDF; keep your Markdown source for quick edits.',
    },
  ],
  related: [
    { label: 'ATS resume templates', to: '/templates/ats-resume-classic' },
    { label: 'Cover letter template', to: '/templates/cover-letter' },
    { label: 'Markdown to PDF guide', to: '/markdown-to-pdf' },
    { label: 'Arabic Markdown to PDF', to: '/markdown-to-pdf-arabic' },
  ],
  templateIds: ['ats-resume-classic', 'ats-resume-swe', 'ats-resume-newgrad', 'cover-letter'],
  ctaQuery: '?template=ats-resume-classic',
  ctaLabel: 'Start from a resume template',
}
