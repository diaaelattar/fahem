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
        <div
          className="flex min-h-screen items-center justify-center bg-slate-50 p-4"
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-slate-800">
              حدث خطأ غير متوقع
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              نأسف على هذا الخطأ. لم يتم فقدان أي من إجاباتك. حاول مرة أخرى أو
              عُد للرئيسية.
            </p>
            {error.digest && (
              <p className="mb-6 rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-400">
                رمز الخطأ: {error.digest}
              </p>
            )}
            <div className="flex justify-center gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </button>
              <a
                href="/"
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Home className="h-4 w-4" />
                الرئيسية
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
