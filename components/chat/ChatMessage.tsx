'use client'

import { User } from 'lucide-react'

type RenderableMessage = {
  id: string
  role: 'user' | 'assistant'
  parts?: Array<{ type: 'text'; text: string }>
}

interface ChatMessageProps {
  message: RenderableMessage
}

function getMessageText(message: RenderableMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

function toPersianTime(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const text = getMessageText(message)
  const time = toPersianTime(new Date())

  return (
    <div className={`message-appear flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>

      {/* Avatar */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
          <User size={14} />
        </div>
      ) : (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-primary-foreground"
          style={{ background: 'var(--primary)', boxShadow: '0 0 10px var(--glow)' }}
        >
          M
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          max-w-[76%] px-4 py-3
          ${isUser
            ? 'bg-secondary text-foreground border border-border rounded-[18px_4px_18px_18px]'
            : 'bg-card text-card-foreground border border-border rounded-[4px_18px_18px_18px]'
          }
        `}
        dir="rtl"
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
        <div className="text-[11px] mt-1.5 text-muted-foreground" aria-label={`ارسال شده در ${time}`}>
          {time}
        </div>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="message-appear flex gap-3 items-end flex-row">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-primary-foreground"
        style={{ background: 'var(--primary)', boxShadow: '0 0 10px var(--glow)' }}
      >
        M
      </div>
      <div className="bg-card border border-border rounded-[4px_18px_18px_18px] px-4 py-3">
        <div className="flex items-center gap-1.5 h-4">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        </div>
      </div>
    </div>
  )
}
