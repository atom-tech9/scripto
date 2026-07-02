import type { ReactNode } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { useLanguage } from '@/i18n'
import type { TranslationKey } from '@/lib/i18n'

interface FormattingHelpDialogProps {
  open: boolean
  onClose: () => void
}

interface FormatRow {
  labelKey: TranslationKey
  /** The Markdown a user types — always shown left-to-right, monospaced. */
  syntax: string
  /** A live preview of what that Markdown produces. */
  sample: ReactNode
}

// Markdown examples stay in English (literal syntax); row labels and chrome are translated.
const ROWS: FormatRow[] = [
  { labelKey: 'formatHelp.row.heading', syntax: '# Big heading', sample: <span className="text-xl font-bold">Big heading</span> },
  { labelKey: 'formatHelp.row.subheading', syntax: '## Subheading', sample: <span className="text-lg font-semibold">Subheading</span> },
  { labelKey: 'formatHelp.row.bold', syntax: '**bold**', sample: <strong>bold</strong> },
  { labelKey: 'formatHelp.row.italic', syntax: '*italic*', sample: <em>italic</em> },
  {
    labelKey: 'formatHelp.row.bulletedList',
    syntax: '- First\n- Second',
    sample: (
      <ul className="list-disc space-y-0.5 ps-5">
        <li>First</li>
        <li>Second</li>
      </ul>
    ),
  },
  {
    labelKey: 'formatHelp.row.checklist',
    syntax: '- [ ] To do\n- [x] Done',
    sample: (
      <ul className="space-y-0.5">
        <li className="flex items-center gap-2">
          <input type="checkbox" disabled className="accent-primary" /> To do
        </li>
        <li className="flex items-center gap-2">
          <input type="checkbox" checked disabled className="accent-primary" /> Done
        </li>
      </ul>
    ),
  },
  {
    labelKey: 'formatHelp.row.link',
    syntax: '[Scripto](https://…)',
    sample: <span className="text-primary underline">Scripto</span>,
  },
  {
    labelKey: 'formatHelp.row.image',
    syntax: '![alt](image.png)',
    sample: (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
        🖼️ image
      </span>
    ),
  },
  {
    labelKey: 'formatHelp.row.quote',
    syntax: '> A quote',
    sample: (
      <blockquote className="border-s-2 border-border ps-2 italic text-muted-foreground">
        A quote
      </blockquote>
    ),
  },
  {
    labelKey: 'formatHelp.row.inlineCode',
    syntax: '`code`',
    sample: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">code</code>,
  },
  {
    labelKey: 'formatHelp.row.codeBlock',
    syntax: '```\ncode block\n```',
    sample: (
      <pre className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
        <code>code block</code>
      </pre>
    ),
  },
  {
    labelKey: 'formatHelp.row.table',
    syntax: '| A | B |\n| - | - |\n| 1 | 2 |',
    sample: (
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-border px-2 py-0.5">A</th>
            <th className="border border-border px-2 py-0.5">B</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-border px-2 py-0.5">1</td>
            <td className="border border-border px-2 py-0.5">2</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    labelKey: 'formatHelp.row.callout',
    syntax: ':::tip\nHelpful note\n:::',
    sample: (
      <div className="rounded-md border-s-2 border-emerald-500 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
        Helpful note
      </div>
    ),
  },
  {
    labelKey: 'formatHelp.row.math',
    syntax: '$$E = mc^2$$',
    sample: (
      <span className="font-serif italic">
        E = mc<sup>2</sup>
      </span>
    ),
  },
]

/** Beginner cheat-sheet showing "you type" (Markdown) → "you get" (a live preview). */
export function FormattingHelpDialog({ open, onClose }: FormattingHelpDialogProps) {
  const { t } = useLanguage()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('formatHelp.title')}
      description={t('formatHelp.subtitle')}
      size="lg"
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_1.1fr_1fr] gap-px bg-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="bg-surface px-3 py-2">{t('formatHelp.col.what')}</div>
          <div className="bg-surface px-3 py-2">{t('formatHelp.col.youType')}</div>
          <div className="bg-surface px-3 py-2">{t('formatHelp.col.youGet')}</div>
        </div>
        <div className="grid grid-cols-[1fr_1.1fr_1fr] gap-px bg-border">
          {ROWS.map((row) => (
            <div key={row.labelKey} className="contents">
              <div className="bg-surface px-3 py-2.5 text-sm font-medium text-foreground">
                {t(row.labelKey)}
              </div>
              <div className="bg-surface px-3 py-2.5" dir="ltr">
                <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {row.syntax}
                </pre>
              </div>
              <div className="flex items-center bg-surface px-3 py-2.5 text-sm text-foreground">
                {row.sample}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
