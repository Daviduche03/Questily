"use client"

import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { Command, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import React from "react"
import { format } from "date-fns"

// Components
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { MessageAvatar } from "@/components/chat/message-avatar"
import { LoadingIndicator } from "@/components/chat/loading-indicator"
import { SearchInput } from "@/components/chat/search-input"
import { ToolRenderer, ToolPart } from "@/components/chat/tool-renderer"

// Types
import { ChatMessage, CONVERSATION_ID, FOLLOW_UP_SUGGESTIONS } from "@/types/chat"



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
  const renderToolPart = React.useCallback((part: ToolPart) => {
    return <ToolRenderer part={part} />
  }, [])

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-4xl mx-auto px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Hero section */}
      <div className="text-center mb-12 relative z-10">
        <div className="mb-8">
          {/* Enhanced icon with gradient background */}
          {/* <div className="relative mb-6 animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl scale-150 animate-pulse-slow" />
            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Command className="size-8 text-primary-foreground" strokeWidth={1.5} />
            </div>
          </div> */}
          
          {/* Enhanced title with gradient text */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent mb-4">
            Questily
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Ask me anything and I&apos;ll search the web for comprehensive answers
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 hover:border-border/70 transition-all duration-200 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Search className="size-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Real-time Search</p>
              <p className="text-xs text-muted-foreground">Live web results</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 hover:border-border/70 transition-all duration-200 group">
            <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Command className="size-4 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">AI Powered</p>
              <p className="text-xs text-muted-foreground">Smart analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/70 hover:border-border/70 transition-all duration-200 group">
            <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
              <svg className="size-4 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Instant Results</p>
              <p className="text-xs text-muted-foreground">Fast responses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced search form */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl z-10">
        <div className="relative">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl scale-105 opacity-50" />
          <div className="relative">
            <SearchInput
              value={input}
              onChange={(value) => {
                handleInputValueChange(value)
                chatHandleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)
              }}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              placeholder="Ask anything... Try 'What's the weather like today?' or 'Explain quantum computing'"
            />
          </div>
        </div>
        
        {/* Enhanced help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Press <kbd className="rounded-lg border border-border/50 px-2 py-1 text-xs bg-muted/50 font-mono shadow-sm">Enter</kbd> to search or <kbd className="rounded-lg border border-border/50 px-2 py-1 text-xs bg-muted/50 font-mono shadow-sm">Shift + Enter</kbd> for new line
          </p>
          
          {/* Example queries */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {[
              "Latest tech news",
              "How to cook pasta",
              "Stock market today",
              "Weather forecast"
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setInput(example)
                  chatHandleInputChange({ target: { value: example } } as React.ChangeEvent<HTMLTextAreaElement>)
                  chatHandleSubmit({} as React.FormEvent)
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60"
              >
                {example}
              </button>
            ))}
          </div>
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
                      <MarkdownRenderer content={part.text || ''} />
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
