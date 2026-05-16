import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'
import { Toaster } from 'sonner'

export const viewport: Viewport = {
  themeColor: '#1B4F72',
}

export const metadata: Metadata = {
  title: 'استباق مصر | منصة التدريب والتحديات الذكي',
  description: 'تدرب، تحد، وتفوق في المنهج المصري. أسئلة ذكية + تحديات مباشرة + لوحة الشرف الوطنية',
  keywords: ['تعليم', 'مصر', 'اختبارات', 'ذكاء اصطناعي', 'إعدادي', 'منصة تعليمية', 'تحدي', 'لغة عربية'],
  authors: [{ name: 'Istabaq Egypt' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'استباق' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="google-site-verification" content="zqZ6-Q1PFmR2Kv8oKfm_-OFt54IiZclnALL2o44lE6o" />
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
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          richColors
          closeButton
          duration={3500}
          toastOptions={{
            style: { fontFamily: 'Calibri, Arial, sans-serif', fontSize: '14px' },
          }}
        />
      </body>
    </html>
  )
}