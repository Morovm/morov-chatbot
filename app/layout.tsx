import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Morov Chatbot',
  description: 'دستیار سازمانی هوشمند Morov',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="bg-background">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
