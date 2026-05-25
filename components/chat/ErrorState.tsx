'use client'

import { RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  onRetry: () => void
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="message-appear flex gap-3 items-end flex-row">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-primary-foreground"
        style={{ background: 'var(--primary)' }}
      >
        M
      </div>
      <div className="bg-destructive/10 border border-destructive/25 rounded-[4px_18px_18px_18px] px-4 py-3 flex items-center gap-3" dir="rtl">
        <div>
          <p className="text-sm text-destructive font-medium">خطا در دریافت پاسخ</p>
          <p className="text-xs text-muted-foreground mt-0.5">مشکلی در ارتباط با سرور پیش آمد.</p>
        </div>
        <button
          onClick={onRetry}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/30 transition-colors"
          aria-label="تلاش مجدد"
        >
          <RefreshCw size={12} />
          تلاش مجدد
        </button>
      </div>
    </div>
  )
}
