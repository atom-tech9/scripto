import type { FaqItem, MarketingLang, SeoMeta } from '../types'

interface LandingFeature {
  icon: string
  title: string
  text: string
}

interface LandingCard {
  title: string
  text: string
  to: string
}

export interface LandingContent {
  meta: SeoMeta
  eyebrow: string
  h1Top: string
  h1Gradient: string
  sub: string
  ctaPrimary: string
  ctaSecondary: string
  trustLine: string
  editorFileName: string
  moat: { title: string; lead: string; cards: { title: string; text: string }[] }
  features: { title: string; lead: string; items: LandingFeature[] }
  skins: { title: string; lead: string; linkLabel: string }
  templates: { title: string; lead: string; linkLabel: string }
  useCases: { title: string; lead: string; cards: LandingCard[] }
  privacy: { title: string; lead: string; points: string[] }
  faq: { title: string; items: FaqItem[] }
  finalCta: { title: string; lead: string }
}

const EN: LandingContent = {
  meta: {
    title: 'Scripto — Free Markdown to PDF Converter with Real Pagination',
    description:
      'Turn Markdown into pixel-perfect, paginated PDFs — headers, footers, page numbers, cover & TOC. 20+ skins, math, Mermaid, Arabic/RTL. Free, open source, 100% in your browser.',
    path: '/',
    keyword: 'markdown to pdf',
  },
  eyebrow: 'Free · Open source · No signup',
  h1Top: 'Markdown in.',
  h1Gradient: 'Pixel-perfect PDF out.',
  sub: 'Scripto is a Markdown → PDF studio with real pagination: running headers and footers, page numbers, cover pages and a clickable table of contents. What you see in the preview is exactly what prints.',
  ctaPrimary: 'Open Scripto — it’s free',
  ctaSecondary: 'Star on GitHub',
  trustLine: 'No signup · No upload · Your files never leave your device',
  editorFileName: 'q3-report.md',
  moat: {
    title: 'The preview is the PDF.',
    lead: 'Most “Markdown to PDF” tools print a web page and hope for the best. Scripto paginates your document with a real print engine, so page breaks, margins and headers land exactly where you saw them.',
    cards: [
      {
        title: 'True pagination',
        text: 'A CSS paged-media engine (Paged.js) lays your document out into real pages — A4, Letter, or custom — before you ever hit Export.',
      },
      {
        title: 'Running headers & footers',
        text: 'Document title, chapter names, dates and page numbers repeat on every page, exactly like a professionally typeset report.',
      },
      {
        title: 'Print-grade typography',
        text: 'Hyphenation-aware line lengths, widow and orphan control, and skins tuned for paper — not for screens pretending to be paper.',
      },
    ],
  },
  features: {
    title: 'Everything a document needs. Nothing you have to install.',
    lead: 'One tab replaces a LaTeX toolchain, a Word template and a PDF printer.',
    items: [
      { icon: '📄', title: 'Cover page & TOC', text: 'One-click cover page and a clickable table of contents generated from your headings.' },
      { icon: '🎨', title: '20+ document skins', text: 'From Swiss grids to editorial serifs to terminal green — restyle the whole PDF without touching your Markdown.' },
      { icon: '🧩', title: '50+ templates', text: 'Resumes, invoices, RFCs, proposals, meeting notes, syllabi — start from a document that already looks right.' },
      { icon: '∑', title: 'KaTeX math', text: 'Inline and display math rendered with KaTeX, perfectly reproduced in the exported PDF.' },
      { icon: '📊', title: 'Mermaid diagrams', text: 'Flowcharts, sequence diagrams, Gantt charts and more — drawn from fenced code blocks.' },
      { icon: '🌍', title: 'Arabic & RTL', text: 'First-class right-to-left documents with Arabic-optimized fonts and a fully translated UI.' },
      { icon: '⚡', title: 'Offline PWA', text: 'Install it like an app. Write and export PDFs on a plane — everything runs locally.' },
      { icon: '🔒', title: 'Zero-knowledge privacy', text: 'No server, no upload, no tracking of your content. Optionally encrypt local data with a passphrase.' },
    ],
  },
  skins: {
    title: 'One document. Twenty faces.',
    lead: 'Skins restyle typography, rules and rhythm for print. Pick one, or ship your own CSS.',
    linkLabel: 'Browse all skins',
  },
  templates: {
    title: 'Start from something great.',
    lead: 'Battle-tested templates for the documents people actually need to ship.',
    linkLabel: 'Browse all templates',
  },
  useCases: {
    title: 'Built for the PDFs you actually make',
    lead: 'Deep guides for the most common Markdown → PDF jobs.',
    cards: [
      { title: 'Markdown → PDF', text: 'The complete guide to converting Markdown into a paginated, professional PDF.', to: '/markdown-to-pdf' },
      { title: 'README → PDF', text: 'Turn a GitHub README into a shareable document with code blocks that don’t break.', to: '/readme-to-pdf' },
      { title: 'Resume → PDF', text: 'Write your resume in Markdown, export an ATS-friendly single-page PDF.', to: '/resume-to-pdf' },
      { title: 'Arabic PDF', text: 'True RTL pagination with Arabic fonts — the hardest PDF job, done right.', to: '/markdown-to-pdf-arabic' },
      { title: 'Math & LaTeX', text: 'Export lecture notes and papers with KaTeX equations that stay crisp in print.', to: '/markdown-to-pdf-with-math' },
      { title: 'Mermaid diagrams', text: 'Ship architecture docs where the diagrams render inside the PDF.', to: '/markdown-to-pdf-with-mermaid' },
    ],
  },
  privacy: {
    title: 'Your words never leave your machine.',
    lead: 'Scripto has no backend. The editor, the renderer and the PDF engine all run in your browser tab.',
    points: [
      'Documents live in your browser’s local storage — export or delete them anytime.',
      'Optional passphrase lock encrypts everything at rest (zero-knowledge vault).',
      'Open source under MIT — audit every line that touches your writing.',
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'Is Scripto really free?',
        a: 'Yes. Scripto is free and open source (MIT). There is no paid tier, no locked features and no watermark forced on your documents.',
      },
      {
        q: 'How is this different from printing a web page to PDF?',
        a: 'Browser printing reflows your page and guesses at breaks. Scripto uses a paged-media engine so your document is laid out into real pages with running headers, footers and page numbers — and the live preview shows those exact pages before you export.',
      },
      {
        q: 'Do my files get uploaded anywhere?',
        a: 'No. There is no server. Parsing, preview and PDF generation all happen locally in your browser, and documents are stored in local storage on your device.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. Scripto is an installable PWA. After the first visit, the editor and PDF export work without a connection.',
      },
      {
        q: 'Can I write PDFs in Arabic or other RTL languages?',
        a: 'Yes — this is a core feature, not an afterthought. Scripto supports right-to-left pagination, Arabic-optimized fonts (Cairo, Noto Naskh, Amiri) and a fully translated Arabic UI.',
      },
      {
        q: 'What Markdown features are supported?',
        a: 'GitHub-Flavored Markdown (tables, task lists, footnotes), KaTeX math, Mermaid diagrams, callouts, highlights, definition lists, emoji shortcodes and raw HTML when you need it.',
      },
    ],
  },
  finalCta: {
    title: 'Your next PDF is one paste away.',
    lead: 'Paste your Markdown, pick a skin, export. No account, no install, no watermark.',
  },
}

const AR: LandingContent = {
  meta: {
    title: 'سكربتو — حوِّل ماركداون إلى PDF مقسَّم صفحات باحتراف، مجانًا',
    description:
      'حوِّل ماركداون إلى PDF متقن الصفحات: ترويسات وتذييلات وأرقام صفحات وغلاف وفهرس. أكثر من ٢٠ تصميمًا، معادلات ومخططات، ودعم كامل للعربية — مجاني ومفتوح المصدر ويعمل في متصفحك.',
    path: '/',
    keyword: 'تحويل ماركداون إلى PDF',
  },
  eyebrow: 'مجاني · مفتوح المصدر · بلا تسجيل',
  h1Top: 'ماركداون يدخل.',
  h1Gradient: 'PDF متقن يخرج.',
  sub: 'سكربتو استوديو لتحويل ماركداون إلى PDF بتقسيم صفحات حقيقي: ترويسات وتذييلات متكررة، أرقام صفحات، صفحة غلاف، وفهرس قابل للنقر. ما تراه في المعاينة هو تمامًا ما يُطبع.',
  ctaPrimary: 'افتح سكربتو — مجانًا',
  ctaSecondary: 'قيِّمنا على GitHub',
  trustLine: 'بلا تسجيل · بلا رفع ملفات · ملفاتك لا تغادر جهازك أبدًا',
  editorFileName: 'تقرير-الربع-الثالث.md',
  moat: {
    title: 'المعاينة هي ملف الـPDF نفسه.',
    lead: 'معظم أدوات «تحويل ماركداون إلى PDF» تطبع صفحة ويب وتأمل أن تصح النتيجة. سكربتو يُقسِّم مستندك بمحرك طباعة حقيقي، فتقع فواصل الصفحات والهوامش والترويسات حيث رأيتها تمامًا.',
    cards: [
      {
        title: 'تقسيم صفحات حقيقي',
        text: 'محرك وسائط مطبوعة (Paged.js) يُخرج مستندك صفحاتٍ فعلية — A4 أو Letter أو مقاس مخصص — قبل أن تضغط «تصدير».',
      },
      {
        title: 'ترويسات وتذييلات متكررة',
        text: 'عنوان المستند وأسماء الفصول والتواريخ وأرقام الصفحات تتكرر في كل صفحة، كأنها من مطبعة محترفة.',
      },
      {
        title: 'طباعة بجودة المطابع',
        text: 'أسطر مضبوطة الطول، وتحكم في الأسطر اليتيمة، وتصاميم مُعايَرة للورق — لا لشاشاتٍ تتظاهر بأنها ورق.',
      },
    ],
  },
  features: {
    title: 'كل ما يحتاجه المستند. من دون أي تثبيت.',
    lead: 'تبويب واحد يغنيك عن أدوات LaTeX وقوالب Word وطابعات PDF.',
    items: [
      { icon: '📄', title: 'غلاف وفهرس', text: 'صفحة غلاف بنقرة واحدة وفهرس محتويات قابل للنقر يُبنى من عناوينك.' },
      { icon: '🎨', title: 'أكثر من ٢٠ تصميمًا', text: 'من الشبكة السويسرية إلى السيريف الصحفي إلى شاشة الطرفية — غيِّر مظهر الـPDF كاملًا دون لمس النص.' },
      { icon: '🧩', title: 'أكثر من ٥٠ قالبًا', text: 'سِيَر ذاتية وفواتير ومقترحات ومحاضر اجتماعات ومناهج — ابدأ من مستند مصمم أصلًا.' },
      { icon: '∑', title: 'معادلات KaTeX', text: 'معادلات ضمن السطر أو منفصلة تُعرض بـKaTeX وتظهر بدقة كاملة في ملف الـPDF.' },
      { icon: '📊', title: 'مخططات Mermaid', text: 'مخططات انسيابية وتسلسلية وجانت وغيرها — تُرسم من كتل شيفرة بسيطة.' },
      { icon: '🌍', title: 'العربية والكتابة من اليمين', text: 'مستندات من اليمين إلى اليسار بخطوط عربية مُحسَّنة وواجهة معرَّبة بالكامل.' },
      { icon: '⚡', title: 'يعمل دون اتصال', text: 'ثبِّته كتطبيق. اكتب وصدِّر PDF في الطائرة — كل شيء يعمل محليًا.' },
      { icon: '🔒', title: 'خصوصية مطلقة', text: 'لا خادم، لا رفع، لا تتبع لمحتواك. ويمكنك تشفير بياناتك المحلية بعبارة مرور.' },
    ],
  },
  skins: {
    title: 'مستند واحد. عشرون وجهًا.',
    lead: 'التصاميم تعيد ضبط الخطوط والفواصل والإيقاع للطباعة. اختر واحدًا أو أضف CSS خاصًا بك.',
    linkLabel: 'تصفَّح كل التصاميم',
  },
  templates: {
    title: 'ابدأ من شيء متقن.',
    lead: 'قوالب مجرَّبة للمستندات التي يحتاج الناس فعلًا إلى إنجازها.',
    linkLabel: 'تصفَّح كل القوالب',
  },
  useCases: {
    title: 'مصمَّم لملفات الـPDF التي تنجزها فعلًا',
    lead: 'أدلة معمَّقة لأشهر مهام التحويل من ماركداون إلى PDF.',
    cards: [
      { title: 'ماركداون → PDF', text: 'الدليل الكامل لتحويل ماركداون إلى PDF مقسَّم صفحات باحتراف.', to: '/markdown-to-pdf' },
      { title: 'README → PDF', text: 'حوِّل ملف README من GitHub إلى مستند قابل للمشاركة بكتل شيفرة لا تنكسر.', to: '/readme-to-pdf' },
      { title: 'سيرة ذاتية → PDF', text: 'اكتب سيرتك بماركداون وصدِّرها PDF بصفحة واحدة صديقة لأنظمة التوظيف.', to: '/resume-to-pdf' },
      { title: 'PDF بالعربية', text: 'تقسيم صفحات حقيقي من اليمين إلى اليسار بخطوط عربية — أصعب مهمة PDF، منجزة بإتقان.', to: '/markdown-to-pdf-arabic' },
      { title: 'رياضيات وLaTeX', text: 'صدِّر محاضرات وأوراقًا علمية بمعادلات KaTeX تبقى حادة الوضوح في الطباعة.', to: '/markdown-to-pdf-with-math' },
      { title: 'مخططات Mermaid', text: 'وثائق معمارية تُعرض مخططاتها داخل ملف الـPDF نفسه.', to: '/markdown-to-pdf-with-mermaid' },
    ],
  },
  privacy: {
    title: 'كلماتك لا تغادر جهازك.',
    lead: 'سكربتو بلا خادم إطلاقًا. المحرر والمعاينة ومحرك الـPDF كلها تعمل داخل تبويب متصفحك.',
    points: [
      'مستنداتك محفوظة في التخزين المحلي لمتصفحك — صدِّرها أو احذفها متى شئت.',
      'قفل اختياري بعبارة مرور يشفِّر كل شيء (خزنة معرفة-صفرية).',
      'مفتوح المصدر برخصة MIT — راجع كل سطر يلمس كتابتك.',
    ],
  },
  faq: {
    title: 'أسئلة شائعة',
    items: [
      {
        q: 'هل سكربتو مجاني فعلًا؟',
        a: 'نعم. سكربتو مجاني ومفتوح المصدر (رخصة MIT). لا باقات مدفوعة، ولا مزايا مقفلة، ولا علامة مائية تُفرض على مستنداتك.',
      },
      {
        q: 'ما الفرق بينه وبين طباعة صفحة الويب إلى PDF؟',
        a: 'طباعة المتصفح تعيد تدفق الصفحة وتخمِّن مواضع الفواصل. سكربتو يستخدم محرك وسائط مطبوعة يُخرج مستندك صفحاتٍ حقيقية بترويسات وتذييلات وأرقام صفحات — والمعاينة تعرض هذه الصفحات نفسها قبل التصدير.',
      },
      {
        q: 'هل تُرفع ملفاتي إلى أي مكان؟',
        a: 'لا. لا يوجد خادم أصلًا. التحليل والمعاينة وتوليد الـPDF تحدث محليًا في متصفحك، وتُحفظ المستندات في التخزين المحلي على جهازك.',
      },
      {
        q: 'هل يعمل دون اتصال بالإنترنت؟',
        a: 'نعم. سكربتو تطبيق ويب تقدمي قابل للتثبيت. بعد الزيارة الأولى يعمل المحرر وتصدير الـPDF دون اتصال.',
      },
      {
        q: 'هل أستطيع كتابة PDF بالعربية؟',
        a: 'نعم — وهي ميزة أساسية لا إضافة لاحقة. يدعم سكربتو تقسيم الصفحات من اليمين إلى اليسار وخطوطًا عربية محسَّنة (القاهرة، نسخ، أميري) وواجهة معرَّبة بالكامل.',
      },
      {
        q: 'ما ميزات ماركداون المدعومة؟',
        a: 'ماركداون بنكهة GitHub (جداول وقوائم مهام وحواشٍ)، ومعادلات KaTeX، ومخططات Mermaid، وتنبيهات، وتظليل نص، وقوائم تعريفات، ورموز إيموجي، وHTML خام عند الحاجة.',
      },
    ],
  },
  finalCta: {
    title: 'ملف الـPDF التالي يبعد عنك لصقة واحدة.',
    lead: 'الصق نص ماركداون، اختر تصميمًا، وصدِّر. بلا حساب، بلا تثبيت، بلا علامة مائية.',
  },
}

export const LANDING: Record<MarketingLang, LandingContent> = { en: EN, ar: AR }
