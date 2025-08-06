"use client"

import React from "react"
import { Search, ArrowUpIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e?: React.FormEvent) => void
  isLoading: boolean
  placeholder?: string
}

export const SearchInput = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Ask anything..."
}: SearchInputProps) => (
  <div className="relative">
    <div className="flex items-center bg-background/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-lg hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/60 transition-all duration-200">
      <div className="pl-5 pr-2">
        <Search className="size-5 text-muted-foreground/70" />
      </div>
      <AutoResizeTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-2 py-4 focus:outline-none resize-none min-h-[56px] text-base placeholder:text-muted-foreground/60"
      />
      <div className="pr-3">
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !value.trim()}
          className="size-10 rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSubmit}
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ArrowUpIcon className="size-5" />
          )}
        </Button>
      </div>
    </div>
  </div>
)