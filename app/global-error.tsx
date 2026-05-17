'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              نأسف على هذا الخطأ. لم يتم فقدان أي من إجاباتك. حاول مرة أخرى أو عُد للرئيسية.
            </p>
            {error.digest && (
              <p className="text-xs text-slate-400 mb-6 bg-slate-50 px-3 py-1.5 rounded-lg font-mono">
                رمز الخطأ: {error.digest}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
              <a
                href="/"
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
