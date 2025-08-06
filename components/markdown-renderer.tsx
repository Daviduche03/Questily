"use client"

import React from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MarkdownRendererProps {
  content: string
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Code blocks (```)
      if (line.trim().startsWith('```')) {
        const language = line.trim().slice(3).trim()
        const codeLines: string[] = []
        i++
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        
        const codeContent = codeLines.join('\n')
        const codeId = `code-${elements.length}`
        
        elements.push(
          <div key={elements.length} className="my-3 rounded-lg border bg-muted/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
              <span className="text-xs font-medium text-muted-foreground">
                {language || 'code'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => copyToClipboard(codeContent, codeId)}
              >
                {copiedCode === codeId ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{codeContent}</code>
            </pre>
          </div>
        )
        i++
        continue
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={elements.length} className="text-xl font-bold mt-4 mb-2 text-foreground">
            {line.slice(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={elements.length} className="text-lg font-semibold mt-3 mb-1 text-foreground">
            {line.slice(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={elements.length} className="text-base font-semibold mt-2 mb-1 text-foreground">
            {line.slice(4)}
          </h3>
        )
      }
      // Lists
      else if (line.match(/^[\s]*[-*+]\s/)) {
        const listItems: string[] = []
        while (i < lines.length && lines[i].match(/^[\s]*[-*+]\s/)) {
          listItems.push(lines[i].replace(/^[\s]*[-*+]\s/, ''))
          i++
        }
        i-- // Back up one since we'll increment at the end
        
        elements.push(
          <ul key={elements.length} className="my-2 ml-4 space-y-0.5">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-foreground rounded-full mt-2 flex-shrink-0" />
                <span>{renderInlineMarkdown(item)}</span>
              </li>
            ))}
          </ul>
        )
      }
      // Numbered lists
      else if (line.match(/^[\s]*\d+\.\s/)) {
        const listItems: string[] = []
        while (i < lines.length && lines[i].match(/^[\s]*\d+\.\s/)) {
          listItems.push(lines[i].replace(/^[\s]*\d+\.\s/, ''))
          i++
        }
        i-- // Back up one since we'll increment at the end
        
        elements.push(
          <ol key={elements.length} className="my-2 ml-4 space-y-0.5">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[1.5rem]">
                  {idx + 1}.
                </span>
                <span>{renderInlineMarkdown(item)}</span>
              </li>
            ))}
          </ol>
        )
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        const quoteLines: string[] = []
        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].slice(2))
          i++
        }
        i-- // Back up one since we'll increment at the end
        
        elements.push(
          <blockquote key={elements.length} className="my-2 pl-3 border-l-2 border-primary/30 bg-muted/20 py-1 rounded-r">
            <div className="text-muted-foreground italic text-sm">
              {quoteLines.map((quoteLine, idx) => (
                <p key={idx} className="my-0">{renderInlineMarkdown(quoteLine)}</p>
              ))}
            </div>
          </blockquote>
        )
      }
      // Regular paragraphs
      else if (line.trim()) {
        elements.push(
          <p key={elements.length} className="mb-1 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        )
      }
      // Empty lines - only add spacing if the next line has content
      else if (i < lines.length - 1 && lines[i + 1]?.trim()) {
        elements.push(<div key={elements.length} className="h-2" />)
      }

      i++
    }

    return elements
  }

  const renderInlineMarkdown = (text: string) => {
    // Bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')

    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  return <div className="markdown-content">{renderMarkdown(content)}</div>
}