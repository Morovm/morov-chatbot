'use client'

import { Send } from 'lucide-react'
import { useRef, useEffect, KeyboardEvent } from 'react'

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading && !disabled) {
        onSubmit()
      }
    }
  }

  const canSend = input.trim().length > 0 && !isLoading && !disabled

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-md border-t border-border px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-card rounded-[12px] border border-border shadow-sm px-3 py-2 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          {/* Send button (right side for RTL) */}
          <button
            type="button"
            onClick={() => canSend && onSubmit()}
            disabled={!canSend}
            aria-label="ارسال پیام"
            className={`
              flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
              ${canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-sm'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} className="rtl:rotate-180" />
            )}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            dir="rtl"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="پیام خود را بنویسید..."
            rows={1}
            disabled={isLoading || disabled}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed py-1.5 max-h-40 min-h-[36px] font-sans disabled:opacity-50"
            aria-label="پیام شما"
          />
        </div>
        <p className="text-xs text-muted-foreground/60 text-center mt-2">
          Enter برای ارسال &nbsp;·&nbsp; Shift+Enter برای خط جدید
        </p>
      </div>
    </div>
  )
}
