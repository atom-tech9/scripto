import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSection,
} from '@codemirror/autocomplete'
import type { EditorView } from '@codemirror/view'
import type { TranslationKey } from '@/lib/i18n'
import type { AiToolbarAction } from './EditorToolbar'

/** Translator injected by the host component (CodeMirror has no React context). */
export type Translate = (key: TranslationKey) => string

export interface SlashHandlers {
  /** Run an AI action (the `/` token is removed first). */
  onAi: (action: AiToolbarAction) => void
  /** Open the formatting guide / shortcuts help. */
  onHelp?: () => void
}

/** Section ranks; the display name is resolved from `titleKey` (or `title`). */
interface SlashSection {
  titleKey?: TranslationKey
  /** Plain-text title used when no translation key is set. */
  title?: string
  rank: number
}

interface SlashItem {
  /** English source name; used as a fallback when no `labelKey` is set. */
  label: string
  /** English source hint; used as a fallback when no `detailKey` is set. */
  detail: string
  /** English source explanation; used as a fallback when no `descKey` is set. */
  info: string
  /** Translation key for the menu label: `slash.<id>.label`. */
  labelKey?: TranslationKey
  /** Translation key for the right-aligned hint: `slash.<id>.detail`. */
  detailKey?: TranslationKey
  /** Translation key for the explanation popup: `slash.<id>.desc`. */
  descKey?: TranslationKey
  section: SlashSection
  /** Markdown to insert in place of the `/token` (block/snippet commands). */
  insert?: string
  /** Place the cursor this many characters back from the end of `insert`. */
  cursorBack?: number
  /** Select this character range within the inserted text (overrides cursorBack). */
  select?: [number, number]
  /** AI action to run instead of inserting text. */
  ai?: AiToolbarAction
  /** Open the formatting help instead of inserting. */
  help?: boolean
}

// Ordered sections so related commands group together in the menu.
const S_AI: SlashSection = { titleKey: 'slash.section.ai', rank: 0 }
const S_TEXT: SlashSection = { titleKey: 'slash.section.text', rank: 1 }
const S_LISTS: SlashSection = { titleKey: 'slash.section.lists', rank: 2 }
const S_INSERT: SlashSection = { titleKey: 'slash.section.insert', rank: 3 }
const S_DIAGRAM: SlashSection = { titleKey: 'slash.section.diagram', title: 'Diagrams', rank: 3.5 }
const S_CALLOUT: SlashSection = { titleKey: 'slash.section.callout', rank: 4 }
const S_TEMPLATE: SlashSection = { titleKey: 'slash.section.template', rank: 5 }
const S_HELP: SlashSection = { titleKey: 'slash.section.help', rank: 6 }

const ITEMS: SlashItem[] = [
  // ---- AI help ----
  {
    label: 'Write with AI',
    detail: 'AI',
    labelKey: 'slash.write.label',
    detailKey: 'slash.detail.ai',
    descKey: 'slash.write.desc',
    section: S_AI,
    info: 'Describe what you want in plain words and AI drafts it for you, inserted right here.',
    ai: 'generate',
  },
  {
    label: 'Improve writing',
    detail: 'AI',
    labelKey: 'slash.improve.label',
    detailKey: 'slash.detail.ai',
    descKey: 'slash.improve.desc',
    section: S_AI,
    info: 'Polishes the current paragraph (or your selection) for clarity and flow.',
    ai: 'improve',
  },
  {
    label: 'Fix spelling & grammar',
    detail: 'AI',
    labelKey: 'slash.grammar.label',
    detailKey: 'slash.detail.ai',
    descKey: 'slash.grammar.desc',
    section: S_AI,
    info: 'Corrects mistakes without changing your meaning.',
    ai: 'grammar',
  },
  {
    label: 'Summarize',
    detail: 'AI',
    labelKey: 'slash.summarize.label',
    detailKey: 'slash.detail.ai',
    descKey: 'slash.summarize.desc',
    section: S_AI,
    info: 'Turns the current text into a short summary.',
    ai: 'summarize',
  },
  {
    label: 'Translate',
    detail: 'AI',
    labelKey: 'slash.translate.label',
    detailKey: 'slash.detail.ai',
    descKey: 'slash.translate.desc',
    section: S_AI,
    info: 'Translates the current text into another language you choose.',
    ai: 'translate',
  },

  // ---- Text blocks ----
  {
    label: 'Heading (big title)',
    detail: 'Title',
    labelKey: 'slash.heading.label',
    detailKey: 'slash.detail.title',
    descKey: 'slash.heading.desc',
    section: S_TEXT,
    info: 'A large section title. Markdown: a line starting with "# ".',
    insert: '# ',
  },
  {
    label: 'Subheading',
    detail: 'Title',
    labelKey: 'slash.subheading.label',
    detailKey: 'slash.detail.title',
    descKey: 'slash.subheading.desc',
    section: S_TEXT,
    info: 'A medium title under a heading. Markdown: "## ".',
    insert: '## ',
  },
  {
    label: 'Small heading',
    detail: 'Title',
    labelKey: 'slash.smallHeading.label',
    detailKey: 'slash.detail.title',
    descKey: 'slash.smallHeading.desc',
    section: S_TEXT,
    info: 'A small title. Markdown: "### ".',
    insert: '### ',
  },
  {
    label: 'Quote',
    detail: 'Block',
    labelKey: 'slash.quote.label',
    detailKey: 'slash.detail.block',
    descKey: 'slash.quote.desc',
    section: S_TEXT,
    info: 'A quoted passage, shown indented with a bar. Markdown: a line starting with "> ".',
    insert: '> ',
  },
  {
    label: 'Divider line',
    detail: 'Block',
    labelKey: 'slash.divider.label',
    detailKey: 'slash.detail.block',
    descKey: 'slash.divider.desc',
    section: S_TEXT,
    info: 'A horizontal line to separate sections. Markdown: "---".',
    insert: '---\n',
  },

  // ---- Lists ----
  {
    label: 'Bulleted list',
    detail: 'List',
    labelKey: 'slash.bulleted.label',
    detailKey: 'slash.detail.list',
    descKey: 'slash.bulleted.desc',
    section: S_LISTS,
    info: 'A list with dots. Each line starts with "- ".',
    insert: '- ',
  },
  {
    label: 'Numbered list',
    detail: 'List',
    labelKey: 'slash.numbered.label',
    detailKey: 'slash.detail.list',
    descKey: 'slash.numbered.desc',
    section: S_LISTS,
    info: 'A list with 1, 2, 3… Each line starts with "1. ".',
    insert: '1. ',
  },
  {
    label: 'Checklist (to-do)',
    detail: 'List',
    labelKey: 'slash.checklist.label',
    detailKey: 'slash.detail.list',
    descKey: 'slash.checklist.desc',
    section: S_LISTS,
    info: 'A list of checkboxes you can tick. Markdown: "- [ ] task".',
    insert: '- [ ] First task\n- [ ] Second task\n',
    select: [6, 16],
  },

  // ---- Insert ----
  {
    label: 'Link',
    detail: 'Insert',
    labelKey: 'slash.link.label',
    detailKey: 'slash.detail.insert',
    descKey: 'slash.link.desc',
    section: S_INSERT,
    info: 'A clickable link. The text in [brackets] is what readers see; the URL goes in (parentheses).',
    insert: '[link text](https://)',
    select: [1, 10],
  },
  {
    label: 'Image',
    detail: 'Insert',
    labelKey: 'slash.image.label',
    detailKey: 'slash.detail.insert',
    descKey: 'slash.image.desc',
    section: S_INSERT,
    info: 'Show a picture from a web address. You can also just paste or drag an image into the editor.',
    insert: '![description](https://)',
    select: [2, 13],
  },
  {
    label: 'Table',
    detail: 'Insert',
    labelKey: 'slash.table.label',
    detailKey: 'slash.detail.insert',
    descKey: 'slash.table.desc',
    section: S_INSERT,
    info: 'A grid of rows and columns. Edit the cells between the | bars.',
    insert: '| Column A | Column B |\n| --- | --- |\n| Cell | Cell |\n',
    select: [2, 10],
  },
  {
    label: 'Code block',
    detail: 'Insert',
    labelKey: 'slash.code.label',
    detailKey: 'slash.detail.insert',
    descKey: 'slash.code.desc',
    section: S_INSERT,
    info: 'Monospaced code with syntax colours. Type the language after the opening ``` if you like.',
    insert: '```\n\n```\n',
    cursorBack: 5,
  },
  {
    label: 'Math formula',
    detail: 'Insert',
    labelKey: 'slash.math.label',
    detailKey: 'slash.detail.insert',
    descKey: 'slash.math.desc',
    section: S_INSERT,
    info: 'A centred mathematical equation written in LaTeX between $$.',
    insert: '$$\n\n$$\n',
    cursorBack: 4,
  },
  {
    label: 'Footnote',
    detail: 'Insert',
    labelKey: 'slash.footnote.label',
    detailKey: 'slash.detail.insert',
    descKey: 'slash.footnote.desc',
    section: S_INSERT,
    info: 'A small reference marker with a note at the bottom of the page.',
    insert: 'Here is a statement.[^1]\n\n[^1]: Add the footnote text here.\n',
    select: [0, 20],
  },

  // ---- Diagrams (Mermaid) ----
  {
    label: 'Flowchart',
    detail: 'Diagram',
    info: 'A process or decision flow with boxes and arrows (Mermaid).',
    labelKey: 'slash.flowchart.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.flowchart.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\nflowchart TD\n  A[Start] --> B{Approved?}\n  B -- Yes --> C[Ship it]\n  B -- No --> D[Request changes] --> A\n```\n',
  },
  {
    label: 'Sequence diagram',
    detail: 'Diagram',
    info: 'Messages exchanged between participants over time (Mermaid).',
    labelKey: 'slash.sequence.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.sequence.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\nsequenceDiagram\n  participant U as User\n  participant A as App\n  participant S as Server\n  U->>A: Request\n  A->>S: Query\n  S-->>A: Result\n  A-->>U: Response\n```\n',
  },
  {
    label: 'Class diagram',
    detail: 'Diagram',
    info: 'Object-oriented classes and their relationships (Mermaid).',
    labelKey: 'slash.classDiagram.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.classDiagram.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\nclassDiagram\n  class User {\n    +id: string\n    +login()\n  }\n  class Order {\n    +id: string\n    +total: number\n  }\n  User "1" --> "*" Order : places\n```\n',
  },
  {
    label: 'State diagram',
    detail: 'Diagram',
    info: 'A lifecycle / state machine with transitions (Mermaid).',
    labelKey: 'slash.stateDiagram.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.stateDiagram.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\nstateDiagram-v2\n  [*] --> Draft\n  Draft --> Review: submit\n  Review --> Published: approve\n  Review --> Draft: reject\n  Published --> [*]\n```\n',
  },
  {
    label: 'ER diagram',
    detail: 'Diagram',
    info: 'A database schema: entities and their relationships (Mermaid).',
    labelKey: 'slash.erDiagram.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.erDiagram.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\nerDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE_ITEM : contains\n  PRODUCT ||--o{ LINE_ITEM : "ordered in"\n```\n',
  },
  {
    label: 'Gantt chart',
    detail: 'Diagram',
    info: 'A project timeline with tasks and milestones (Mermaid).',
    labelKey: 'slash.gantt.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.gantt.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\ngantt\n  title Project Plan\n  dateFormat YYYY-MM-DD\n  section Build\n  Design       :a1, 2026-01-01, 7d\n  Development  :a2, after a1, 14d\n  section Launch\n  QA           :a3, after a2, 5d\n  Release      :milestone, after a3, 0d\n```\n',
  },
  {
    label: 'Pie chart',
    detail: 'Diagram',
    info: 'A proportional breakdown of parts of a whole (Mermaid).',
    labelKey: 'slash.pie.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.pie.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\npie title Budget allocation\n  "Engineering" : 45\n  "Design" : 25\n  "Marketing" : 30\n```\n',
  },
  {
    label: 'Mindmap',
    detail: 'Diagram',
    info: 'A branching brainstorm around a central idea (Mermaid).',
    labelKey: 'slash.mindmap.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.mindmap.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\nmindmap\n  root((Product))\n    Growth\n      SEO\n      Referrals\n    Retention\n      Onboarding\n      Notifications\n```\n',
  },
  {
    label: 'Git graph',
    detail: 'Diagram',
    info: 'A branching / release history of commits (Mermaid).',
    labelKey: 'slash.gitgraph.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.gitgraph.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\ngitGraph\n  commit\n  branch develop\n  commit\n  checkout main\n  merge develop\n  commit tag: "v1.0"\n```\n',
  },
  {
    label: 'User journey',
    detail: 'Diagram',
    info: 'An experience map scoring each step of a journey (Mermaid).',
    labelKey: 'slash.journey.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.journey.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\njourney\n  title Checkout experience\n  section Browse\n    Find product: 4: User\n    Add to cart: 5: User\n  section Pay\n    Enter details: 3: User\n    Confirm: 5: User\n```\n',
  },
  {
    label: 'Timeline',
    detail: 'Diagram',
    info: 'A chronological sequence of events (Mermaid).',
    labelKey: 'slash.timeline.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.timeline.desc',
    section: S_DIAGRAM,
    insert:
      '```mermaid\ntimeline\n  title Product history\n  2021 : Founded\n  2023 : Public launch\n  2026 : 1M users\n```\n',
  },
  {
    label: 'Diagram (ASCII)',
    detail: 'Diagram',
    info: 'A text-drawn box diagram, rendered as a crisp auto-fitted figure. Pasted ASCII art is detected automatically.',
    labelKey: 'slash.asciiDiagram.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.asciiDiagram.desc',
    section: S_DIAGRAM,
    insert:
      '```ascii title="Architecture"\n┌──────────┐      ┌──────────┐\n│  Client  │ ───► │  Server  │\n└──────────┘      └──────────┘\n```\n',
  },
  {
    label: 'Folder tree (ASCII)',
    detail: 'Diagram',
    info: 'A project or folder layout drawn with tree characters.',
    labelKey: 'slash.asciiTree.label',
    detailKey: 'slash.detail.diagram',
    descKey: 'slash.asciiTree.desc',
    section: S_DIAGRAM,
    insert:
      '```ascii title="Project layout"\nsrc/\n├── components/\n│   ├── App.tsx\n│   └── Button.tsx\n└── index.ts\n```\n',
  },

  // ---- Highlight boxes (callouts) ----
  {
    label: 'Tip box',
    detail: 'Callout',
    labelKey: 'slash.tip.label',
    detailKey: 'slash.detail.callout',
    descKey: 'slash.tip.desc',
    section: S_CALLOUT,
    info: 'A green highlighted box for helpful tips.',
    insert: ':::tip\nYour tip here.\n:::\n',
    select: [7, 20],
  },
  {
    label: 'Info box',
    detail: 'Callout',
    labelKey: 'slash.infoBox.label',
    detailKey: 'slash.detail.callout',
    descKey: 'slash.infoBox.desc',
    section: S_CALLOUT,
    info: 'A blue highlighted box for useful information.',
    insert: ':::info\nGood to know.\n:::\n',
    select: [8, 20],
  },
  {
    label: 'Warning box',
    detail: 'Callout',
    labelKey: 'slash.warning.label',
    detailKey: 'slash.detail.callout',
    descKey: 'slash.warning.desc',
    section: S_CALLOUT,
    info: 'An amber highlighted box to call out something to be careful about.',
    insert: ':::warning\nBe careful here.\n:::\n',
    select: [11, 26],
  },

  // ---- Quick templates (ready-made structures) ----
  {
    label: 'Meeting notes',
    detail: 'Template',
    labelKey: 'slash.meeting.label',
    detailKey: 'slash.detail.template',
    descKey: 'slash.meeting.desc',
    section: S_TEMPLATE,
    info: 'A ready-made layout for capturing a meeting: agenda, decisions, and action items.',
    insert:
      '## Meeting notes\n\n**Date:** \n**Attendees:** \n\n### Agenda\n- \n\n### Decisions\n- \n\n### Action items\n- [ ] \n',
  },
  {
    label: 'Pros and cons',
    detail: 'Template',
    labelKey: 'slash.prosCons.label',
    detailKey: 'slash.detail.template',
    descKey: 'slash.prosCons.desc',
    section: S_TEMPLATE,
    info: 'A simple two-part list to weigh something up.',
    insert: '**Pros**\n- \n- \n\n**Cons**\n- \n- \n',
  },
  {
    label: 'Step-by-step guide',
    detail: 'Template',
    labelKey: 'slash.stepGuide.label',
    detailKey: 'slash.detail.template',
    descKey: 'slash.stepGuide.desc',
    section: S_TEMPLATE,
    info: 'A numbered how-to structure with a title.',
    insert: '### How to …\n\n1. \n2. \n3. \n',
  },

  // ---- Learn ----
  {
    label: 'Formatting help',
    detail: 'Guide',
    labelKey: 'slash.help.label',
    detailKey: 'slash.detail.guide',
    descKey: 'slash.help.desc',
    section: S_HELP,
    info: 'Open the cheatsheet of formatting shortcuts and tips.',
    help: true,
  },
]

function makeSource(handlers: SlashHandlers, t: Translate) {
  // Resolve each section's localized title once per source build.
  const sectionFor = (section: SlashSection): CompletionSection => ({
    name: section.titleKey ? t(section.titleKey) : section.title ?? '',
    rank: section.rank,
  })

  return (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/\/[\w &-]*/)
    if (!match) return null
    if (match.from === match.to && !context.explicit) return null

    // Only trigger when the slash starts a line or follows whitespace, so it
    // doesn't fire inside URLs, paths, or fractions.
    const line = context.state.doc.lineAt(match.from)
    if (match.from > line.from) {
      const before = context.state.sliceDoc(match.from - 1, match.from)
      if (!/\s/.test(before)) return null
    }

    const options: Completion[] = ITEMS.map((item) => {
      const label = item.labelKey ? t(item.labelKey) : item.label
      return {
      label: `/${label}`,
      displayLabel: label,
      detail: item.detailKey ? t(item.detailKey) : item.detail,
      info: item.descKey ? t(item.descKey) : item.info,
      section: sectionFor(item.section),
      type: item.ai ? 'keyword' : item.help ? 'namespace' : 'text',
      apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
        if (item.help) {
          view.dispatch({ changes: { from, to, insert: '' }, selection: { anchor: from } })
          handlers.onHelp?.()
          return
        }
        if (item.ai) {
          view.dispatch({ changes: { from, to, insert: '' }, selection: { anchor: from } })
          handlers.onAi(item.ai)
          return
        }
        const insert = item.insert ?? ''
        const selection = item.select
          ? { anchor: from + item.select[0], head: from + item.select[1] }
          : { anchor: from + insert.length - (item.cursorBack ?? 0) }
        view.dispatch({ changes: { from, to, insert }, selection })
        view.focus()
      },
      }
    })

    return { from: match.from, options, filter: true }
  }
}

/**
 * Notion-style slash menu that doubles as a guide for people new to Markdown:
 * type `/` (at a line start or after a space) to open a grouped, filterable menu
 * of AI helpers, building blocks, ready-made templates, and a formatting guide —
 * each with a plain-English explanation. Native keyboard navigation included.
 */
export function slashCommands(handlers: SlashHandlers, t: Translate) {
  return autocompletion({
    override: [makeSource(handlers, t)],
    icons: false,
    activateOnTyping: true,
    closeOnBlur: true,
  })
}
