"use client"

import React from "react"

export const LoadingIndicator = () => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
    </div>
    <span>Thinking...</span>
  </div>
)