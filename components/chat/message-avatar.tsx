"use client"

import React from "react"
import { UserCircle, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageAvatarProps {
  role: 'user' | 'assistant'
}

export const MessageAvatar = ({ role }: MessageAvatarProps) => (
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