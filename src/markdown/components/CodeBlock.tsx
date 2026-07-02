import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { logger } from '@/lib/logger'
import { useLanguage } from '@/i18n'

interface CodeBlockProps {
  language: string
  raw: string
  children: ReactNode
}

// Header bar (language label + copy button) around the highlighted `<pre><code>`
// passed as children, so the same markup flows into the PDF.
export function CodeBlock({ language, raw, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(raw)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      logger.warn('Clipboard copy failed', err)
    }
  }

  return (
    <div className="code-block">
      <div className="code-block__header" data-pdf-hide-interactive>
        <span className="code-block__lang">{language || 'text'}</span>
        <button
          type="button"
          className="code-block__copy"
          onClick={handleCopy}
          aria-label={t('code.copyAria')}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t('code.copied') : t('code.copy')}
        </button>
      </div>
      {children}
    </div>
  )
}
