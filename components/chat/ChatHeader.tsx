'use client'

import { Menu } from 'lucide-react'

interface ChatHeaderProps {
  onToggleSidebar: () => void
}

export function ChatHeader({ onToggleSidebar }: ChatHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-background/90 backdrop-blur-xl border-b border-border flex items-center justify-between px-5">

      {/* Left: online status */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-xs text-muted-foreground tracking-wide">آنلاین</span>
      </div>

      {/* Center: brand */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 select-none">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm"
          style={{ background: 'var(--primary)', boxShadow: '0 0 14px var(--glow)' }}
        >
          M
        </div>
        <span className="font-semibold text-foreground text-[15px] tracking-tight">
          Morov Chatbot
        </span>
      </div>

      {/* Right: sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        aria-label="نمایش منو"
      >
        <Menu size={19} />
      </button>
    </header>
  )
}
