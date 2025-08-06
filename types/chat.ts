import { ToolPart } from "@/components/chat/tool-renderer"

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  parts: (ToolPart | { type: 'text', text: string })[]
}

export const CONVERSATION_ID = "3a99f679-12f5-4776-b231-034aecc5f78c"

export const FOLLOW_UP_SUGGESTIONS = [
  "Tell me more about this",
  "Can you explain it differently?",
  "Give me an example"
]