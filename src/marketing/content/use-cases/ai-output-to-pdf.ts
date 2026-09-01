import type { UseCaseContent } from '../../types'

export const aiOutputToPdf: UseCaseContent = {
  slug: 'ai-output-to-pdf',
  meta: {
    title: 'ChatGPT or Claude Output to PDF — Free, In Your Browser',
    description:
      'Paste an AI answer and get a properly typeset PDF. Headings, tables, code and math survive the paste. Free, client-side, nothing uploaded.',
    path: '/ai-output-to-pdf',
    keyword: 'chatgpt to pdf',
  },
  h1: 'Paste an AI answer. Get a document.',
  intro: [
    'Assistants write in Markdown, and every surface that receives their output throws the formatting away. Paste a ChatGPT answer into Word and the headings become bold paragraphs, the table becomes tab-separated text, and the code block loses its indentation. Print it from the chat window and you get the chat window — sidebar, avatars, "Regenerate" button and all.',
    'Scripto reads the Markdown the assistant actually wrote. Paste it and the headings are headings, the table is a table, the fenced code keeps its highlighting, and `$...$` math typesets. Then it paginates into real pages with numbers and a running header, and exports the PDF from your browser. Nothing is uploaded, which matters when the answer contains something you would not paste into a stranger’s converter.',
  ],
  howTo: {
    title: 'How to turn an AI answer into a PDF',
    steps: [
      {
        name: 'Copy the answer',
        text: 'Select the assistant’s reply and copy it. ChatGPT, Claude, Gemini, Copilot, Perplexity — they all emit Markdown, and the copy carries it.',
      },
      {
        name: 'Paste into Scripto',
        text: 'Open the editor and paste. Rich text pasted from a chat window is converted back to Markdown automatically, so you get structure rather than a wall of styled spans.',
      },
      {
        name: 'Pick a skin',
        text: 'Technical for engineering answers, Academic for research, Report for anything going to a colleague. The preview is the PDF, so what you see is what saves.',
      },
      {
        name: 'Export PDF',
        text: 'One click. Add a cover page and a table of contents first if the answer is long enough to need them.',
      },
    ],
  },
  sections: [
    {
      heading: 'Why pasting into Word loses the formatting',
      paragraphs: [
        'An assistant’s answer is Markdown: `##` for a heading, pipes for a table, backticks for code. A chat window renders that to HTML for display. When you copy, you get the rendered HTML — and Word imports it as styled text, not as structure. The visual hierarchy survives the first paste and collapses the moment you change a font or a margin.',
        'Scripto goes the other way. A rich-text paste is converted back to Markdown first, so the document has real headings and real tables underneath. Change the skin, the paper size or the type scale afterwards and everything reflows correctly, because the structure was never thrown away.',
      ],
    },
    {
      heading: 'Code, tables and math all survive',
      paragraphs: [
        'Fenced code keeps its language label and syntax highlighting, and long blocks break at line boundaries across pages rather than mid-character. Tables repeat their header row when they cross a page. LaTeX between dollar signs typesets through KaTeX. Mermaid fences become diagrams. These are exactly the parts an assistant produces most and every other route mangles worst.',
      ],
    },
    {
      heading: 'Long answers become documents, not printouts',
      paragraphs: [
        'A research answer that runs to twelve pages needs a cover, a contents list and page numbers to be usable. Scripto adds all three from the same settings panel, numbers the headings if you want them numbered, and lets you place page breaks visually over the paginated preview so a section never starts one line from the bottom of a page.',
      ],
    },
    {
      heading: 'Nothing leaves your browser',
      paragraphs: [
        'The conversion, the pagination and the PDF all happen locally. There is no upload step and no server copy, which is the practical difference between "I can send this to a converter" and "I can send this to a converter that has my employer’s internal architecture in it".',
      ],
    },
  ],
  faq: [
    {
      q: 'Does this work with Claude, Gemini and Copilot too?',
      a: 'Yes. They all write Markdown, and Scripto reads Markdown. Nothing about the paste is tied to a particular assistant.',
    },
    {
      q: 'The answer had a table. Will it stay a table?',
      a: 'Yes — a real table, with column alignment preserved and the header row repeated if it crosses a page break.',
    },
    {
      q: 'What about LaTeX in the answer?',
      a: 'Inline `$x^2$` and display `$$...$$` both typeset through KaTeX and export as crisp vector math.',
    },
    {
      q: 'Can I paste several answers into one document?',
      a: 'Yes. Paste them one after another, add a cover and a table of contents, and export the whole thing as one PDF.',
    },
    {
      q: 'Is any of this uploaded?',
      a: 'No. Everything runs in your browser. Nothing is sent anywhere, and there is no account.',
    },
    {
      q: 'The assistant used emoji and checkboxes. Do those survive?',
      a: 'Yes. Emoji render, and `- [ ]` task lists keep their checkboxes in the PDF.',
    },
  ],
  related: [
    { label: 'Markdown to PDF — the full guide', to: '/markdown-to-pdf' },
    { label: 'Math and LaTeX to PDF', to: '/markdown-to-pdf-with-math' },
    { label: 'Mermaid diagrams to PDF', to: '/markdown-to-pdf-with-mermaid' },
    { label: 'Report template', to: '/templates/report' },
    { label: 'Scripto vs Pandoc', to: '/vs/pandoc' },
  ],
  templateIds: ['report', 'meeting-notes', 'research-summary', 'api-docs'],
  ctaQuery: '?template=report',
  ctaLabel: 'Paste an answer and export',
}

export const aiOutputToPdfAr: UseCaseContent = {
  slug: 'ai-output-to-pdf',
  meta: {
    title: 'تحويل إجابة ChatGPT أو Claude إلى PDF — مجانًا في متصفحك',
    description:
      'الصق إجابة الذكاء الاصطناعي واحصل على ملف PDF منسّق. العناوين والجداول والشيفرة والمعادلات تبقى كما هي. مجاني، داخل المتصفح، بلا رفع.',
    path: '/ar/ai-output-to-pdf',
    keyword: 'تحويل ChatGPT إلى PDF',
  },
  h1: 'الصق إجابة الذكاء الاصطناعي. احصل على مستند.',
  intro: [
    'تكتب المساعدات الذكية بصيغة ماركداون، ومعظم البرامج تتخلص من هذا التنسيق عند اللصق. الصق إجابة في Word فتتحول العناوين إلى نص عريض، والجدول إلى سطور مفصولة بمسافات، وتفقد الشيفرة محاذاتها. اطبع الصفحة من نافذة المحادثة فتحصل على نافذة المحادثة نفسها بأزرارها وقوائمها.',
    'يقرأ سكربتو الماركداون الذي كتبه المساعد فعلًا. تلصق النص فتبقى العناوين عناوين، والجدول جدولًا، وتحتفظ الشيفرة بتلوينها، وتُنسَّق المعادلات. ثم يُقسَّم المستند إلى صفحات حقيقية بأرقام وترويسة، ويُصدَّر ملف PDF من متصفحك مباشرة دون رفع أي شيء.',
  ],
  howTo: {
    title: 'كيف تحوّل إجابة ذكاء اصطناعي إلى PDF',
    steps: [
      {
        name: 'انسخ الإجابة',
        text: 'حدّد رد المساعد وانسخه. ChatGPT وClaude وGemini وCopilot جميعها تكتب ماركداون، والنسخ ينقله معه.',
      },
      {
        name: 'الصقه في سكربتو',
        text: 'افتح المحرر والصق. يُحوَّل النص المنسّق تلقائيًا إلى ماركداون، فتحصل على بنية حقيقية لا على نص ملوّن.',
      },
      {
        name: 'اختر نمطًا',
        text: 'تقني للإجابات الهندسية، أكاديمي للبحث، تقرير لما سيصل إلى زميل. المعاينة هي الملف نفسه.',
      },
      {
        name: 'صدّر PDF',
        text: 'بنقرة واحدة. أضف غلافًا وجدول محتويات أولًا إن كانت الإجابة طويلة.',
      },
    ],
  },
  sections: [
    {
      heading: 'لماذا يضيع التنسيق عند اللصق في Word',
      paragraphs: [
        'إجابة المساعد مكتوبة بالماركداون: علامات # للعناوين، وخطوط عمودية للجداول، وعلامات اقتباس مائلة للشيفرة. تعرض نافذة المحادثة ذلك بصيغة HTML، وعند النسخ تحصل على HTML المعروض — فيستورده Word كنص منسّق لا كبنية. يبدو الشكل سليمًا أول مرة ثم ينهار عند أول تغيير في الخط أو الهامش.',
        'يسير سكربتو في الاتجاه المعاكس: يحوّل النص الملصوق إلى ماركداون أولًا، فتبقى العناوين والجداول بنية حقيقية. غيّر النمط أو حجم الورق أو مقاس الخط بعد ذلك وسيُعاد التنسيق بشكل صحيح لأن البنية لم تُفقد أصلًا.',
      ],
    },
    {
      heading: 'الشيفرة والجداول والمعادلات تبقى سليمة',
      paragraphs: [
        'تحتفظ الشيفرة باسم لغتها وتلوينها، وتنقسم الكتل الطويلة عند حدود الأسطر لا في منتصف الحرف. تكرّر الجداول صف العنوان عند انتقالها بين الصفحات. تُنسَّق معادلات LaTeX عبر KaTeX، وتتحول مخططات Mermaid إلى رسوم. هذه تحديدًا أكثر ما تنتجه المساعدات وأكثر ما تفسده الطرق الأخرى.',
      ],
    },
    {
      heading: 'الإجابات الطويلة تصبح مستندات',
      paragraphs: [
        'الإجابة البحثية التي تمتد اثنتي عشرة صفحة تحتاج غلافًا وجدول محتويات وأرقام صفحات لتكون صالحة للاستخدام. يضيف سكربتو الثلاثة من اللوحة نفسها، ويرقّم العناوين بالأرقام العربية، ويتيح لك وضع فواصل الصفحات بصريًا فوق المعاينة حتى لا يبدأ قسم في آخر سطر من الصفحة.',
      ],
    },
    {
      heading: 'لا شيء يغادر متصفحك',
      paragraphs: [
        'التحويل والتقسيم وإنشاء الملف كلها تجري محليًا. لا خطوة رفع ولا نسخة على خادم — وهذا هو الفارق العملي بين «يمكنني إرسال هذا إلى محوّل» و«يمكنني إرسال بنية شركتي الداخلية إلى محوّل».',
      ],
    },
  ],
  faq: [
    {
      q: 'هل يعمل مع Claude وGemini وCopilot أيضًا؟',
      a: 'نعم. جميعها تكتب ماركداون، وسكربتو يقرأ الماركداون. لا شيء مرتبط بمساعد بعينه.',
    },
    {
      q: 'الإجابة تحتوي جدولًا. هل يبقى جدولًا؟',
      a: 'نعم — جدول حقيقي بمحاذاة أعمدة صحيحة، ويتكرر صف العنوان عند انتقاله بين الصفحات.',
    },
    {
      q: 'ماذا عن معادلات LaTeX؟',
      a: 'تُنسَّق المعادلات داخل السطر والمعادلات المستقلة عبر KaTeX وتُصدَّر رسومًا متجهة واضحة.',
    },
    {
      q: 'هل ألصق عدة إجابات في مستند واحد؟',
      a: 'نعم. الصقها تباعًا، وأضف غلافًا وجدول محتويات، وصدّرها ملفًا واحدًا.',
    },
    {
      q: 'هل يُرفع أي شيء؟',
      a: 'لا. كل شيء يجري داخل متصفحك، بلا حساب وبلا إرسال.',
    },
    {
      q: 'هل تبقى الرموز التعبيرية وقوائم المهام؟',
      a: 'نعم. تظهر الرموز التعبيرية، وتحتفظ قوائم المهام بمربعات الاختيار في ملف PDF.',
    },
  ],
  related: [
    { label: 'ماركداون إلى PDF — الدليل الكامل', to: '/ar/markdown-to-pdf-arabic' },
    { label: 'قالب تقرير', to: '/templates/report' },
  ],
  templateIds: ['report', 'meeting-notes'],
  ctaQuery: '?template=report',
  ctaLabel: 'الصق إجابة وصدّرها',
}
