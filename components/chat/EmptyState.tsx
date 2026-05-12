export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-6 select-none">

      {/* Brand mark */}
      <div className="relative">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-4xl"
          style={{
            background: 'var(--primary)',
            boxShadow: '0 0 40px var(--glow), 0 0 80px var(--glow)',
          }}
        >
          M
        </div>
        <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--primary-foreground)" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </span>
      </div>

      {/* Title & subtitle */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground tracking-tight text-balance">
          Morov Chatbot
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed text-balance max-w-[260px]">
          دستیار هوشمند سازمانی شما.<br />هر سوالی دارید بپرسید.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs" dir="rtl">
        {[
          'اطلاعات سازمانی',
          'گزارش‌دهی',
          'جستجو در اسناد',
          'چطور می‌توانم کمکتان کنم؟',
        ].map((chip) => (
          <span
            key={chip}
            className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent transition-all cursor-pointer"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}
