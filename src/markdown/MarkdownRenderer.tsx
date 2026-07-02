import { memo, useMemo, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkDirective from 'remark-directive'
import remarkGemoji from 'remark-gemoji'
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypePrismPlus from 'rehype-prism-plus'
import { remarkCallouts } from './plugins/remarkCallouts'
import { remarkMarks } from './plugins/remarkMarks'
import { CodeBlock } from './components/CodeBlock'
import { Mermaid } from './components/Mermaid'
import type { ResolvedTheme } from '@/types'

interface MarkdownRendererProps {
  content: string
  resolvedTheme: ResolvedTheme
}

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: { className?: string[] | string }
  children?: HastNode[]
}

/** Allow embedded image data URLs (drawings, pasted/dropped images) while
 * still sanitizing every other URL the default (safe) way. */
function urlTransform(url: string): string {
  if (url.startsWith('data:image/')) return url
  return defaultUrlTransform(url)
}

function hastToText(node: HastNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  if (!node.children) return ''
  return node.children.map(hastToText).join('')
}

function languageFromClass(className?: string[] | string): string {
  if (!className) return ''
  const list = Array.isArray(className) ? className : className.split(' ')
  const match = list.find((c) => c.startsWith('language-'))
  return match ? match.replace('language-', '') : ''
}

const remarkPlugins = [
  [remarkGfm, { singleTilde: false }],
  remarkMath,
  remarkDirective,
  remarkCallouts,
  remarkDefinitionList,
  remarkMarks,
  remarkGemoji,
] as const

const rehypePlugins = [
  rehypeRaw,
  rehypeKatex,
  rehypeSlug,
  [rehypePrismPlus, { showLineNumbers: true, ignoreMissing: true }],
] as const

/**
 * The single source of truth for rendering Markdown to HTML. The output is used
 * verbatim by both the live preview and the PDF export engine.
 */
function MarkdownRendererImpl({ content, resolvedTheme }: MarkdownRendererProps) {
  const components = useMemo<Components>(() => {
    return {
      pre({ node, children }) {
        const codeChild = (node as HastNode | undefined)?.children?.find(
          (c) => c.tagName === 'code',
        )
        const language = languageFromClass(codeChild?.properties?.className)
        const raw = hastToText(codeChild)

        if (language === 'mermaid') {
          return <Mermaid code={raw} resolvedTheme={resolvedTheme} />
        }
        return (
          <CodeBlock language={language} raw={raw}>
            <pre className={`language-${language || 'text'}`}>{children}</pre>
          </CodeBlock>
        )
      },
      code({ className, children }) {
        const isBlock = typeof className === 'string' && /language-|code-highlight/.test(className)
        if (isBlock) {
          return <code className={className}>{children}</code>
        }
        return <code>{children}</code>
      },
      table({ children }) {
        return (
          <div className="table-wrap" role="region" aria-label="Table" tabIndex={0}>
            <table>{children}</table>
          </div>
        )
      },
      a({ href, children }) {
        const isExternal = typeof href === 'string' && /^https?:\/\//.test(href)
        return (
          <a
            href={href}
            {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
          >
            {children as ReactNode}
          </a>
        )
      },
      img({ src, alt }) {
        return <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} loading="lazy" decoding="async" />
      },
      input({ type, checked, onChange: _onChange, ...rest }: ComponentPropsWithoutRef<'input'>) {
        if (type === 'checkbox') {
          return <input {...rest} type="checkbox" checked={Boolean(checked)} readOnly disabled />
        }
        return <input {...rest} type={type} />
      },
    }
  }, [resolvedTheme])

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins as never}
      rehypePlugins={rehypePlugins as never}
      remarkRehypeOptions={{ handlers: defListHastHandlers }}
      urlTransform={urlTransform}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}

export const MarkdownRenderer = memo(MarkdownRendererImpl)
