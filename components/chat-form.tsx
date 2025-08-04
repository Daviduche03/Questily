"use client"

import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { ArrowUpIcon, Loader2, UserCircle, Bot, Search, Command, TrendingUp, TrendingDown, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"
import React from "react"
import { format } from "date-fns"

// Types
interface SearchResult {
  title: string
  snippet: string
  source: string
}

interface StockDataPoint {
  date: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface StockData {
  symbol: string
  company_name: string
  period: string
  interval: string
  current_price: number
  change: number
  change_percent: number
  market_cap: number
  pe_ratio: string
  dividend_yield: string
  ma_20: number | null
  ma_50: number | null
  data_points: number
  chart_data: StockDataPoint[]
  chart_type: string
  last_updated: string
  data_range: {
    start: string
    end: string
  }
}

interface ToolInvocation {
  toolName: string
  toolCallId: string
  args: any
  result?: string
  state: string
  step: number
}

interface ToolPart {
  type: string
  toolCallId?: string
  state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  input?: any
  output?: any
  errorText?: string
  toolInvocation?: ToolInvocation
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  parts: (ToolPart | { type: 'text', text: string })[]
}

// Constants
const CONVERSATION_ID = "3a99f679-12f5-4776-b231-034aecc5f78c"
const FOLLOW_UP_SUGGESTIONS = [
  "Tell me more about this",
  "Can you explain it differently?",
  "Give me an example"
]

// Markdown renderer component
const MarkdownRenderer = ({ content }: { content: string }) => {
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

// Components
const SearchResultCard = ({ result, index }: { result: SearchResult; index: number }) => (
  <div
    key={index}
    className="bg-card w-[300px] flex-none rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
  >
    <h3 className="font-medium text-foreground leading-tight line-clamp-2 mb-2">
      {result.title || 'Untitled'}
    </h3>
    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
      {result.snippet || 'No description available'}
    </p>
    <span className="text-xs text-muted-foreground">
      {result.source || 'Unknown source'}
    </span>
  </div>
)

const StockChart = ({ stockData }: { stockData: StockData }) => {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`
    return `$${cap.toLocaleString()}`
  }

  const isPositive = stockData.change >= 0
  const maxPrice = Math.max(...stockData.chart_data.map(d => d.high))
  const minPrice = Math.min(...stockData.chart_data.map(d => d.low))
  const priceRange = maxPrice - minPrice

  return (
    <div className="w-full bg-card border rounded-xl p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {stockData.symbol} - {stockData.company_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {stockData.period} • {stockData.interval} intervals
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {formatPrice(stockData.current_price)}
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{formatPrice(stockData.change)} ({stockData.change_percent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="h-64 bg-muted/20 rounded-lg p-4 relative overflow-hidden">
          <svg width="100%" height="100%" className="absolute inset-0">
            {stockData.chart_data.map((dataPoint, index) => {
              const x = (index / (stockData.chart_data.length - 1)) * 100
              const bodyTop = ((maxPrice - Math.max(dataPoint.open, dataPoint.close)) / priceRange) * 100
              const bodyBottom = ((maxPrice - Math.min(dataPoint.open, dataPoint.close)) / priceRange) * 100
              const wickTop = ((maxPrice - dataPoint.high) / priceRange) * 100
              const wickBottom = ((maxPrice - dataPoint.low) / priceRange) * 100
              const isGreen = dataPoint.close >= dataPoint.open

              return (
                <g key={index}>
                  {/* Wick */}
                  <line
                    x1={`${x}%`}
                    y1={`${wickTop}%`}
                    x2={`${x}%`}
                    y2={`${wickBottom}%`}
                    stroke={isGreen ? "#22c55e" : "#ef4444"}
                    strokeWidth="1"
                  />
                  {/* Body */}
                  <rect
                    x={`${x - 1}%`}
                    y={`${bodyTop}%`}
                    width="2%"
                    height={`${Math.abs(bodyBottom - bodyTop)}%`}
                    fill={isGreen ? "#22c55e" : "#ef4444"}
                    opacity="0.8"
                  />
                </g>
              )
            })}
          </svg>

          {/* Price labels */}
          <div className="absolute left-2 top-2 text-xs text-muted-foreground">
            {formatPrice(maxPrice)}
          </div>
          <div className="absolute left-2 bottom-2 text-xs text-muted-foreground">
            {formatPrice(minPrice)}
          </div>
        </div>

        {/* Date range */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{stockData.data_range.start}</span>
          <span>{stockData.data_range.end}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Market Cap</div>
          <div className="font-medium">{formatMarketCap(stockData.market_cap)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">P/E Ratio</div>
          <div className="font-medium">{stockData.pe_ratio}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Dividend Yield</div>
          <div className="font-medium">{stockData.dividend_yield}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Data Points</div>
          <div className="font-medium">{stockData.data_points}</div>
        </div>
      </div>

      {/* Last updated */}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        Last updated: {format(new Date(stockData.last_updated), "MMM dd, yyyy 'at' h:mm a")}
      </div>
    </div>
  )
}

const LoadingIndicator = () => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
    </div>
    <span>Thinking...</span>
  </div>
)

const MessageAvatar = ({ role }: { role: 'user' | 'assistant' }) => (
  <div
    className={cn(
      "flex size-8 shrink-0 select-none items-center justify-center rounded-full border",
      role === "user"
        ? "bg-background border-border"
        : "bg-primary/10 border-primary/20"
    )}
  >
    {role === "user" ? (
      <UserCircle className="size-4 text-foreground/80" />
    ) : (
      <Bot className="size-4 text-primary" />
    )}
  </div>
)

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Ask anything..."
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (e?: React.FormEvent) => void
  isLoading: boolean
  placeholder?: string
}) => (
  <div className="relative">
    <div className="flex items-center bg-background border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
      <Search className="size-4 text-muted-foreground ml-4 flex-shrink-0" />
      <AutoResizeTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-4 py-3 focus:outline-none resize-none min-h-[48px]"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !value.trim()}
        className="size-8 mr-2 rounded-full"
        onClick={onSubmit}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowUpIcon className="size-4" />
        )}
      </Button>
    </div>
  </div>
)

export function ChatForm({ className }: { className?: string }) {
  const [input, setInput] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const { messages, handleInputChange: chatHandleInputChange, handleSubmit: chatHandleSubmit, isLoading } = useChat({
    api: "http://127.0.0.1:8000/api/search/stream",
    maxSteps: 5,
    body: {
      query: input,
      model: "gpt-4o",
      search_provider: "auto",
      max_results: 10,
      stream: true,
      conversation_id: CONVERSATION_ID
    },
    onResponse() {
      // Response handler - can be extended as needed
    },
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "search_web") {
        return "Search results updated"
      }
      return ""
    }
  })

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    setInput("")
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Event handlers
  const handleInputValueChange = React.useCallback((value: string) => {
    console.log("Input value changed:", value)
    setInput(value)
  }, [])

  const handleSubmit = React.useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    // setInput("") // Clear input immediately
    chatHandleInputChange({ target: { value: input } } as React.ChangeEvent<HTMLTextAreaElement>)
    chatHandleSubmit(e as React.FormEvent)
  }, [input, isLoading, chatHandleInputChange, chatHandleSubmit])

  const handleSuggestionClick = React.useCallback((suggestion: string) => {
    if (isLoading) return
    setInput("")
    chatHandleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLTextAreaElement>)
    chatHandleSubmit({} as React.FormEvent)
  }, [chatHandleInputChange, chatHandleSubmit, isLoading])

  // Render functions
  const renderSearchResults = (searchResults: { results: SearchResult[] }) => {
    // Validate search results structure
    if (!searchResults?.results || !Array.isArray(searchResults.results) || searchResults.results.length === 0) {
      return (
        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-border/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>No search results found</span>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full mb-6">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Results ({searchResults.results.length})
          </h4>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {searchResults.results.map((result, i) => (
              <SearchResultCard key={i} result={result} index={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderToolPart = React.useCallback((part: ToolPart) => {
    switch (part.type) {
      case 'step-start':
        return null

      case 'tool-invocation': {
        if (!part.toolInvocation) return null

        const { toolName, result, state } = part.toolInvocation

        switch (toolName) {
          case 'search_web': {
            if (state === 'streaming') {
              return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg border border-border/30">
                  <Search className="w-4 h-4 animate-pulse" />
                  <span>Searching the web...</span>
                </div>
              )
            }

            if (!result) return null

            // Handle different result formats
            try {
              // Try to parse as JSON first
              const searchResults = JSON.parse(result)
              if (searchResults && searchResults.results && Array.isArray(searchResults.results)) {
                return renderSearchResults(searchResults)
              }
            } catch (error) {
              // If JSON parsing fails, check if it's a plain text response
              console.warn('Search result is not valid JSON, treating as text:', result)
            }

            // Fallback: display as plain text if not valid JSON
            return (
              <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-border/30 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 mt-0.5 text-primary/70" />
                  <span className="leading-relaxed">{result}</span>
                </div>
              </div>
            )
          }

          case 'get_stock_data': {
            if (state === 'streaming') {
              return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg border border-border/30">
                  <TrendingUp className="w-4 h-4 animate-pulse" />
                  <span>Fetching stock data...</span>
                </div>
              )
            }

            if (!result) return null

            try {
              const stockData: StockData = JSON.parse(result)
              return <StockChart stockData={stockData} />
            } catch (error) {
              console.error('Failed to parse stock data:', error)
              return (
                <div className="text-sm text-red-500 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 mt-0.5" />
                    <span>Error parsing stock data</span>
                  </div>
                </div>
              )
            }
          }

          default:
            return (
              <pre className="text-sm text-muted-foreground overflow-x-auto">
                {JSON.stringify(part.toolInvocation, null, 2)}
              </pre>
            )
        }
      }

      case 'text':
        return <MarkdownRenderer content={(part as any).text} />

      default:
        return null
    }
  }, [])

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-16">
        <div className="mb-8">
          <Command className="size-12 text-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            AI Search
          </h1>
          <p className="text-muted-foreground">
            Ask me anything and I'll search for answers
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full">
        <SearchInput
          value={input}
          onChange={(value) => {
            handleInputValueChange(value)
            chatHandleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)
          }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Ask anything..."
        />
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="rounded border px-1.5 py-0.5 text-xs bg-muted">Enter</kbd> to search
          </p>
        </div>
      </form>
    </div>
  )

  // Render message
  const renderMessage = (message: ChatMessage, index: number) => {
    const isLastAssistantMessage = message.role === 'assistant' && index === messages.length - 1
    const showLoading = isLastAssistantMessage && isLoading

    return (
      <div key={message.id} className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div
          className={cn(
            "flex items-start gap-4 py-6",
            message.role === "user"
              ? "border-b border-border/20"
              : "ml-14 bg-muted/10 rounded-lg px-4 py-4 -mx-2"
          )}
        >
          <MessageAvatar role={message.role} />
          <div className="flex-1 min-w-0">
            <div className={cn(
              "prose prose-neutral dark:prose-invert max-w-none",
              message.role === "user"
                ? "font-medium text-foreground"
                : "text-foreground/90"
            )}>
              {message.parts?.map((part, partIndex) => {
                if ('text' in part) {
                  return (
                    <div key={partIndex} className="leading-relaxed">
                      <MarkdownRenderer content={part.text} />
                    </div>
                  )
                } else {
                  return <div key={partIndex} className="my-3">{renderToolPart(part as ToolPart)}</div>
                }
              })}

              {/* Show loading indicator within the assistant message if it's the last one and loading */}
              {showLoading && (
                <div className="mt-3">
                  <LoadingIndicator />
                </div>
              )}
            </div>

            {/* Only show timestamp for assistant messages, no suggestions here */}
            {message.role === "assistant" && !showLoading && (
              <time className="mt-3 block text-xs text-muted-foreground">
                {format(new Date(), "h:mm a")}
              </time>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render loading state - integrated into the last assistant message
  const renderLoadingState = () => {
    const lastMessage = messages[messages.length - 1]

    // If the last message is from assistant and we're loading, show loading in that message
    if (lastMessage && lastMessage.role === 'assistant') {
      return null // Loading will be shown within the message
    }

    // Otherwise show a separate loading message
    return (
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="flex items-start gap-4 py-8 px-2 ml-14 bg-gradient-to-r from-transparent via-muted/20 to-transparent rounded-2xl -mx-2">
          <MessageAvatar role="assistant" />
          <div className="flex-1">
            <LoadingIndicator />
          </div>
        </div>
      </div>
    )
  }

  // Render suggestions at the end of conversation
  const renderSuggestions = () => {
    const lastMessage = messages[messages.length - 1]
    const shouldShowSuggestions = lastMessage && lastMessage.role === 'assistant' && !isLoading

    if (!shouldShowSuggestions) return null

    return (
      <div className="w-full max-w-3xl mx-auto px-4 mb-8">
        <div className="ml-14 px-4">
          <div className="flex flex-wrap gap-2">
            {FOLLOW_UP_SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="text-xs hover:bg-primary/5 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render chat messages
  const renderChatMessages = () => (
    <>
      <div className="w-full max-w-3xl mx-auto px-4 pb-32 pt-8">
        <div className="space-y-1">
          {(messages as ChatMessage[]).map((message, index) => renderMessage(message, index))}
          {isLoading && renderLoadingState()}
        </div>

        {/* Suggestions appear at the end of the conversation */}
        {renderSuggestions()}

        {/* Invisible div for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/20">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mx-auto p-4"
        >
          <SearchInput
            value={input}
            onChange={(value) => {
              handleInputValueChange(value)
              chatHandleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Ask a follow-up question..."
          />
        </form>
      </div>
    </>
  )

  return (
    <div className={cn("relative", className)}>
      {messages.length === 0 ? renderEmptyState() : renderChatMessages()}
    </div>
  )
}
