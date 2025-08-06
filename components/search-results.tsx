"use client"

import React from "react"
import { Search } from "lucide-react"

export interface SearchResult {
  title: string
  snippet: string
  source: string
}

interface SearchResultCardProps {
  result: SearchResult
  index: number
}

const SearchResultCard = ({ result, index }: SearchResultCardProps) => (
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

interface SearchResultsProps {
  results: SearchResult[]
}

export const SearchResults = ({ results }: SearchResultsProps) => {
  if (!results || results.length === 0) {
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
          Search Results ({results.length})
        </h4>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {results.map((result, i) => (
            <SearchResultCard key={i} result={result} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}