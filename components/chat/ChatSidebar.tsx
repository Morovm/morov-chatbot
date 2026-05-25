'use client'

import { Plus, Upload, MessageSquare, X } from 'lucide-react'
import { useRef } from 'react'

interface ChatSession {
  id: string
  title: string
  preview: string
  date: string
}

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  sessions: ChatSession[]
  activeSessionId: string
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onUploadDocument: (file: File) => void
}

export function ChatSidebar({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onUploadDocument,
}: ChatSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUploadDocument(file)
      e.target.value = ''
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 right-0 bottom-0 z-30 w-72 bg-sidebar border-l border-sidebar-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label="نوار کناری"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border flex-shrink-0">
          <span className="font-semibold text-sidebar-foreground text-sm">گفتگوها</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground"
            aria-label="بستن"
          >
            <X size={16} />
          </button>
        </div>

        {/* New chat */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 0 18px var(--glow)' }}
          >
            <Plus size={15} />
            گفتگوی جدید
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <MessageSquare size={22} className="opacity-30" />
              <span className="text-xs">هنوز گفتگویی وجود ندارد</span>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors ${
                      activeSessionId === session.id
                        ? 'bg-primary/10 text-sidebar-foreground border border-primary/20'
                        : 'hover:bg-sidebar-accent text-sidebar-foreground'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{session.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{session.date}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upload */}
        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
            aria-label="آپلود سند"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground text-sm hover:bg-accent hover:text-foreground hover:border-primary/30 transition-all"
          >
            <Upload size={14} />
            آپلود سند
          </button>
          <p className="text-xs text-muted-foreground/50 text-center mt-2">PDF, DOC, DOCX, TXT</p>
        </div>
      </aside>
    </>
  )
}
