import type { UseCaseContent } from '../../types'

export const markdownToPdfArabic: UseCaseContent = {
  slug: 'markdown-to-pdf-arabic',
  meta: {
    title: 'Arabic Markdown to PDF — True RTL Pagination, Free',
    description:
      'Convert Arabic Markdown to PDF with real right-to-left pagination, Arabic fonts (Cairo, Naskh, Amiri) and mirrored headers & page numbers. Free and client-side.',
    path: '/markdown-to-pdf-arabic',
    keyword: 'arabic markdown to pdf',
  },
  h1: 'Arabic Markdown to PDF, done right — at last.',
  intro: [
    'Arabic is where most Markdown-to-PDF pipelines quietly fall apart: LaTeX needs a specialist setup, browser printing breaks letter joining in odd places, and “RTL support” usually means text-align: right and a prayer. Numbers flip, punctuation jumps to the wrong side, and page furniture stays stubbornly left-to-right.',
    'Scripto treats Arabic as a first-class citizen. Direction is a document setting, not a hack: paragraphs flow right-to-left, headers, footers and page numbers mirror correctly, lists indent on the right side, and the bundled Arabic fonts — Cairo, Noto Naskh Arabic, Amiri — are chosen and sized for print.',
  ],
  howTo: {
    title: 'How to convert Arabic Markdown to PDF',
    steps: [
      {
        name: 'Open Scripto and switch direction to RTL',
        text: 'Set the document direction to right-to-left in the document settings (or use the Arabic UI — the whole editor is translated).',
      },
      {
        name: 'Pick an Arabic font',
        text: 'Choose the Arabic font stack: Cairo for a modern look, Noto Naskh for body-text tradition, Amiri for a classical serif voice.',
      },
      {
        name: 'Write or paste your Arabic Markdown',
        text: 'Headings, lists, tables, quotes — everything mirrors correctly in the paginated preview, including mixed Arabic/English lines.',
      },
      {
        name: 'Export the PDF',
        text: 'Headers, footers and page numbers come out mirrored and correctly ordered. What you previewed is what prints.',
      },
    ],
  },
  sections: [
    {
      heading: 'What “true RTL” actually requires',
      paragraphs: [
        'Right-to-left documents are not reversed left-to-right documents. Correct Arabic typesetting needs the Unicode bidirectional algorithm applied per paragraph (so embedded Latin words and numbers read correctly), mirrored page geometry (margins, headers, list indentation), and fonts with proper contextual letter forms.',
        'Scripto inherits all of this from the browser’s world-class text engine and adds the paged layer on top — so the hard parts (shaping, bidi, joining) are done by the same engine that renders Arabic for millions of websites, and the pagination respects direction end to end.',
      ],
      bullets: [
        'Mirrored running headers, footers and page-number positions',
        'Bidi-correct mixed Arabic/English/number lines',
        'Arabic-aware fonts at print sizes: Cairo, Noto Naskh Arabic, Amiri',
        'Fully translated Arabic UI (سكربتو) with RTL editor layout',
      ],
    },
    {
      heading: 'Reports, contracts, resumes — بالعربية',
      paragraphs: [
        'Combine RTL direction with any template: a weekly status report for a Saudi client, a contract draft, an Arabic resume, lecture notes with English technical terms embedded mid-sentence. Skins work in both directions, so an Arabic document can be Swiss-grid minimal or newsprint-classic just like an English one.',
      ],
    },
    {
      heading: 'Why not Word or Google Docs for Arabic PDFs?',
      paragraphs: [
        'They handle Arabic text well but not Markdown workflows: no plain-text source, no code blocks, no diffable versions, and their PDF export flattens heading structure. If your source is Markdown — engineering docs, AI output, notes — converting through Scripto keeps the source clean and the output typeset.',
      ],
    },
  ],
  faq: [
    {
      q: 'Does Scripto support mixed Arabic and English text?',
      a: 'Yes. The Unicode bidirectional algorithm handles mixed-direction lines correctly — Latin terms, numbers and code spans keep their order inside Arabic sentences.',
    },
    {
      q: 'Which Arabic fonts are included?',
      a: 'Cairo (modern sans), Noto Naskh Arabic (readable body naskh) and Amiri (classical serif). All three are loaded automatically and embedded correctly in the PDF.',
    },
    {
      q: 'Do page numbers use Arabic-Indic digits?',
      a: 'Page numbers follow the document font and locale conventions; Arabic-Indic digits (١٢٣) inside your text render exactly as written.',
    },
    {
      q: 'Is the interface available in Arabic?',
      a: 'Yes — the entire editor UI ships in Arabic with an RTL layout. Switch language from the toolbar.',
    },
    {
      q: 'Can I write Urdu, Persian or Hebrew documents?',
      a: 'RTL direction plus the browser’s text shaping supports other RTL scripts; the bundled font presets are Arabic-optimized, and you can point custom CSS at any font you load.',
    },
  ],
  related: [
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Resume to PDF', to: '/resume-to-pdf' },
    { label: 'Document skins', to: '/skins' },
    { label: 'الدليل بالعربية', to: '/ar/markdown-to-pdf-arabic' },
  ],
  templateIds: ['report', 'letter', 'invoice', 'meeting'],
}

export const markdownToPdfArabicAr: UseCaseContent = {
  slug: 'markdown-to-pdf-arabic',
  meta: {
    title: 'تحويل ماركداون عربي إلى PDF — تقسيم صفحات RTL حقيقي',
    description:
      'حوِّل ماركداون بالعربية إلى PDF بتقسيم صفحات حقيقي من اليمين إلى اليسار، بخطوط عربية (القاهرة، نسخ، أميري) وترويسات وأرقام صفحات معكوسة صحيحة. مجاني ويعمل في متصفحك.',
    path: '/markdown-to-pdf-arabic',
    keyword: 'تحويل ماركداون إلى PDF عربي',
  },
  h1: 'ماركداون بالعربية إلى PDF — بإتقانٍ أخيرًا.',
  intro: [
    'العربية هي النقطة التي تنهار عندها معظم أدوات تحويل ماركداون إلى PDF: فـLaTeX يحتاج إعدادًا متخصصًا، وطباعة المتصفح تكسر اتصال الحروف في مواضع غريبة، و«دعم RTL» يعني عادةً محاذاة لليمين ودعاءً بأن تصح النتيجة. الأرقام تنقلب، وعلامات الترقيم تقفز إلى الجهة الخطأ، وترويسات الصفحات تبقى بعناد من اليسار إلى اليمين.',
    'سكربتو يعامل العربية مواطنًا من الدرجة الأولى. الاتجاه إعدادٌ في المستند لا حيلة تقنية: الفقرات تتدفق من اليمين إلى اليسار، والترويسات والتذييلات وأرقام الصفحات تنعكس بشكل صحيح، والقوائم تنزاح من جهة اليمين، والخطوط العربية المرفقة — القاهرة ونسخ نوتو وأميري — مُنتقاة ومُعايَرة للطباعة.',
  ],
  howTo: {
    title: 'كيف تحوِّل ماركداون عربيًا إلى PDF',
    steps: [
      {
        name: 'افتح سكربتو وبدِّل الاتجاه إلى RTL',
        text: 'اضبط اتجاه المستند من اليمين إلى اليسار في إعدادات المستند (أو استخدم الواجهة العربية — المحرر معرَّب بالكامل).',
      },
      {
        name: 'اختر خطًا عربيًا',
        text: 'اختر حزمة الخط العربي: «القاهرة» لمظهر عصري، و«نسخ نوتو» لنص أساسي مريح، و«أميري» لصوتٍ سيريفي كلاسيكي.',
      },
      {
        name: 'اكتب أو الصق نص الماركداون العربي',
        text: 'العناوين والقوائم والجداول والاقتباسات — كلها تنعكس بشكل صحيح في المعاينة المقسَّمة صفحات، حتى الأسطر المختلطة عربي/إنجليزي.',
      },
      {
        name: 'صدِّر ملف الـPDF',
        text: 'تخرج الترويسات والتذييلات وأرقام الصفحات معكوسة ومرتبة ترتيبًا صحيحًا. ما رأيته في المعاينة هو ما يُطبع.',
      },
    ],
  },
  sections: [
    {
      heading: 'ماذا يتطلب «RTL حقيقي» فعلًا؟',
      paragraphs: [
        'المستند من اليمين إلى اليسار ليس مستندًا معكوسًا من اليسار إلى اليمين. الطباعة العربية الصحيحة تحتاج خوارزمية يونيكود ثنائية الاتجاه مطبقة على مستوى الفقرة (لتُقرأ الكلمات اللاتينية والأرقام المدمجة قراءة صحيحة)، وهندسة صفحات معكوسة (هوامش وترويسات وإزاحة قوائم)، وخطوطًا بأشكال حروف سياقية سليمة.',
        'سكربتو يرث كل ذلك من محرك النصوص العالمي في متصفحك ويضيف فوقه طبقة تقسيم الصفحات — فالأجزاء الصعبة (تشكيل الحروف واتصالها وثنائية الاتجاه) ينجزها المحرك نفسه الذي يعرض العربية لملايين المواقع، بينما يحترم التقسيمُ الاتجاهَ من أول الصفحة إلى آخرها.',
      ],
      bullets: [
        'ترويسات وتذييلات وأرقام صفحات معكوسة في مواضعها الصحيحة',
        'أسطر مختلطة عربي/إنجليزي/أرقام بترتيب سليم',
        'خطوط عربية بمقاسات طباعة: القاهرة، نسخ نوتو، أميري',
        'واجهة معرَّبة بالكامل (سكربتو) بتخطيط محرر من اليمين إلى اليسار',
      ],
    },
    {
      heading: 'تقارير وعقود وسِيَر ذاتية — بالعربية',
      paragraphs: [
        'اجمع اتجاه RTL مع أي قالب: تقرير أسبوعي لعميل سعودي، مسودة عقد، سيرة ذاتية عربية، ملاحظات محاضرات تتخللها مصطلحات إنجليزية في منتصف الجملة. التصاميم تعمل في الاتجاهين، فيمكن للمستند العربي أن يكون بشبكةٍ سويسرية صارمة أو بروحِ صحيفةٍ كلاسيكية تمامًا كالمستند الإنجليزي.',
      ],
    },
    {
      heading: 'لماذا لا يكفي Word أو مستندات Google؟',
      paragraphs: [
        'كلاهما يجيد النص العربي لكنه لا يجيد سير عمل ماركداون: لا مصدر نصيًا خامًا، ولا كتل شيفرة، ولا نسخًا قابلة للمقارنة، وتصديرهما إلى PDF يفقد بنية العناوين. إن كان مصدرك ماركداون — وثائق هندسية أو مخرجات ذكاء اصطناعي أو ملاحظات — فالتحويل عبر سكربتو يُبقي المصدر نظيفًا والمخرجات مطبوعة بإتقان.',
      ],
    },
  ],
  faq: [
    {
      q: 'هل يدعم سكربتو النص المختلط عربي/إنجليزي؟',
      a: 'نعم. تعالج خوارزمية يونيكود ثنائية الاتجاه الأسطر المختلطة معالجة صحيحة — فالمصطلحات اللاتينية والأرقام ومقاطع الشيفرة تحافظ على ترتيبها داخل الجمل العربية.',
    },
    {
      q: 'ما الخطوط العربية المرفقة؟',
      a: 'القاهرة (سانس عصري)، نسخ نوتو العربي (نسخ مريح للنص الأساسي)، وأميري (سيريف كلاسيكي). تُحمَّل الثلاثة تلقائيًا وتُضمَّن في ملف الـPDF بشكل صحيح.',
    },
    {
      q: 'هل تظهر أرقام الصفحات بالأرقام الهندية (١٢٣)؟',
      a: 'تتبع أرقامُ الصفحات خطَّ المستند وأعرافه، أما الأرقام الهندية داخل نصك فتُعرض تمامًا كما كتبتها.',
    },
    {
      q: 'هل الواجهة متوفرة بالعربية؟',
      a: 'نعم — واجهة المحرر كاملة بالعربية وبتخطيط من اليمين إلى اليسار. بدِّل اللغة من شريط الأدوات.',
    },
    {
      q: 'هل أستطيع الكتابة بالأوردو أو الفارسية أو العبرية؟',
      a: 'اتجاه RTL مع تشكيل النصوص في المتصفح يدعم بقية لغات اليمين-لليسار؛ إعدادات الخطوط الجاهزة محسَّنة للعربية، ويمكنك عبر CSS مخصص استخدام أي خط تحمِّله.',
    },
  ],
  related: [
    { label: 'الدليل الإنجليزي الكامل', to: '/markdown-to-pdf' },
    { label: 'السيرة الذاتية إلى PDF', to: '/resume-to-pdf' },
    { label: 'تصاميم المستندات', to: '/skins' },
    { label: 'English guide', to: '/markdown-to-pdf-arabic' },
  ],
  templateIds: ['report', 'letter', 'invoice', 'meeting'],
}
