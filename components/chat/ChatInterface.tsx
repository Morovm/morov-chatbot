'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChatHeader } from './ChatHeader'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessage, TypingIndicator } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { ChevronDown } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

type ChatRole = 'user' | 'assistant'
type ChatPart = { type: 'text'; text: string }
type ChatMessageItem = {
  id: string
  role: ChatRole
  parts: ChatPart[]
}

interface ChatSession {
  id: string
  title: string
  preview: string
  date: string
  messages?: ChatMessageItem[]
}

function toPersianDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('default')
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (isNearBottom) scrollToBottom()
  }, [messages, scrollToBottom])

  // Show/hide scroll-to-bottom button
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const handler = () => {
      const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      setShowScrollBtn(distFromBottom > 160)
    }
    container.addEventListener('scroll', handler, { passive: true })
    return () => container.removeEventListener('scroll', handler)
  }, [])

  // Update sessions when messages change
  useEffect(() => {
    if (messages.length === 0) return
    const firstUserMsg = messages.find((m) => m.role === 'user')
    const firstText = firstUserMsg?.parts?.map((p) => p.text).join('') ?? 'گفتگو'

    setSessions((prev) => {
      const existing = prev.find((s) => s.id === activeSessionId)
      if (existing) {
        return prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title: firstText.slice(0, 30), preview: firstText.slice(0, 50), messages }
            : s
        )
      }
      return [
        {
          id: activeSessionId,
          title: firstText.slice(0, 30),
          preview: firstText.slice(0, 50),
          date: toPersianDate(new Date()),
          messages,
        },
        ...prev,
      ]
    })
  }, [messages, activeSessionId])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/history`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.sessions)) {
        const normalized = data.sessions.map((s: ChatSession) => ({
          id: s.id,
          title: s.title,
          preview: s.preview,
          date: toPersianDate(new Date(s.date)),
        }))
        setSessions(normalized)
      }
    } catch {
      // Keep sidebar functional even if history endpoint fails.
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`
    setActiveSessionId(newId)
    setMessages([])
    setInput('')
    setHasError(false)
    setSidebarOpen(false)
  }

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id)
    const session = sessions.find((s) => s.id === id)
    if (session?.messages) {
      setMessages(session.messages)
    } else {
      setMessages([])
    }
    setHasError(false)
    setSidebarOpen(false)
  }

  const handleUploadDocument = async (file: File) => {
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_BASE_URL}/ingest`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('upload_failed')
      setUploadedFile(file.name)
      setTimeout(() => setUploadedFile(null), 4000)
    } catch {
      setHasError(true)
    } finally {
      setSidebarOpen(false)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userText = input.trim()
    const userMessage: ChatMessageItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: userText }],
    }
    const assistantMessageId = `a-${Date.now()}`
    const assistantMessage: ChatMessageItem = {
      id: assistantMessageId,
      role: 'assistant',
      parts: [{ type: 'text', text: '' }],
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setHasError(false)
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, session_id: activeSessionId }),
      })
      if (!res.ok || !res.body) throw new Error('chat_failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finished = false

      while (!finished) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          const lines = event.split('\n')
          const dataLine = lines.find((line) => line.startsWith('data: '))
          if (!dataLine) continue
          const payload = JSON.parse(dataLine.slice(6)) as { type: string; content?: string }
          if (payload.type === 'token' && payload.content) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      parts: [{ type: 'text', text: `${msg.parts[0]?.text ?? ''}${payload.content}` }],
                    }
                  : msg
              )
            )
          }
          if (payload.type === 'done') {
            finished = true
            break
          }
        }
      }
      await fetchHistory()
    } catch {
      setHasError(true)
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir="rtl">
      {/* Header */}
      <ChatHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onUploadDocument={handleUploadDocument}
      />

      {/* Main content */}
      <main
        className="flex-1 overflow-hidden pt-14 pb-[88px]"
        aria-label="ناحیه گفتگو"
      >
        {/* Uploaded file toast */}
        {uploadedFile && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            سند «{uploadedFile}» با موفقیت آپلود شد
          </div>
        )}

        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto overscroll-contain"
        >
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="h-[calc(100vh-200px)]">
                <EmptyState />
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {isLoading && (
                  <TypingIndicator />
                )}

                {hasError && (
                  <ErrorState onRetry={() => setHasError(false)} />
                )}

                <div ref={messagesEndRef} className="h-1" />
              </div>
            )}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="scroll-btn-appear fixed bottom-24 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
            aria-label="پایین صفحه"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </main>

      {/* Input */}
      <ChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
