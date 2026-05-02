import type { Metadata } from 'next'
import { Cairo, Tajawal } from 'next/font/google'
import './globals.css'
import 'katex/dist/katex.min.css'
import { ToastProvider } from '@/components/ui/Toaster'

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
  title: 'استباق مصر | منصة التدريب والتحديات الذكي',
  description: 'تدرب، تحد، وتفوق في المنهج المصري. أسئلة ذكية + تحديات مباشرة + لوحة الشرف الوطنية',
  keywords: ['تعليم', 'مصر', 'اختبارات', 'ذكاء اصطناعي', 'إعدادي', 'منصة تعليمية', 'تحدي', 'لغة عربية'],
  authors: [{ name: 'Istabaq Egypt' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'استباق' },
  themeColor: '#1B4F72',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="استباق" />
        <meta name="theme-color" content="#1B4F72" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}