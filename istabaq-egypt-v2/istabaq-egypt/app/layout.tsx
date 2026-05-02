import type { Metadata } from 'next'
import { Cairo, Tajawal } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'استباق مصر | منصة التعليم الذكي',
  description: 'منصة تعليمية ذكية مخصصة للمنهج المصري - توليد الأسئلة التفاعلية بالذكاء الاصطناعي',
  keywords: ['تعليم', 'مصر', 'اختبارات', 'ذكاء اصطناعي', 'منصة تعليمية'],
  authors: [{ name: 'Istabaq Egypt' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
