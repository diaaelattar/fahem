'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, BookOpen } from 'lucide-react'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[StudentError]', error)
  }, [error])

  return (
    <div
      className="flex min-h-[60vh] items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <AlertTriangle className="h-8 w-8 text-orange-500" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-slate-800">
          حدث خطأ في هذه الصفحة
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          لم يتم فقدان تقدمك. يمكنك المحاولة مرة أخرى أو العودة للوحة التحكم.
        </p>
        {error.digest && (
          <p className="mb-5 rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-400">
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
            href="/student/dashboard"
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <BookOpen className="h-4 w-4" />
            لوحة التحكم
          </a>
        </div>
      </div>
    </div>
  )
}
