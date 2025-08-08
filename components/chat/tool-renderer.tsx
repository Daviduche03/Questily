"use client"

import React from "react"
import { Search, TrendingUp, TrendingDown, Bot } from "lucide-react"
import { SearchResults } from "@/components/search-results"
import { StockChart, StockData } from "@/components/stock-chart"
import { MarkdownRenderer } from "@/components/markdown-renderer"

export interface ToolInvocation {
  toolName: string
  toolCallId: string
  args: Record<string, unknown>
  result?: string
  state: string
  step: number
}

export interface ToolPart {
  type: string
  toolCallId?: string
  state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  errorText?: string
  toolInvocation?: ToolInvocation
  text?: string
}

interface ToolRendererProps {
  part: ToolPart
}

export const ToolRenderer = ({ part }: ToolRendererProps) => {
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
              return <SearchResults results={searchResults.results} />
            }
          } catch {
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
      return <MarkdownRenderer content={part.text || ''} />

    default:
      return null
  }
}