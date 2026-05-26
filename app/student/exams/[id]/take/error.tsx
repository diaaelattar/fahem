'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react'

/**
 * Error boundary specific to the exam-taking flow.
 * Shows a reassuring message that answers are NOT lost (they're auto-saved to Supabase).
 */
export default function ExamError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console for debugging (can be replaced with Sentry later)
    console.error(
      '[ExamError] Error in exam flow:',
      error.message,
      error.digest
    )
  }, [error])

  return (
    <div
      className="flex min-h-[70vh] items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-2xl border-2 border-amber-100 bg-white p-8 text-center shadow-xl">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold text-slate-800">
          حدث خطأ أثناء الاختبار
        </h2>

        {/* Reassurance message - CRITICAL for exam UX */}
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-right">
          <p className="mb-1 text-sm font-bold text-green-800">
            ✅ إجاباتك محفوظة تلقائياً
          </p>
          <p className="text-xs leading-relaxed text-green-700">
            لا تقلق — جميع إجاباتك التي أدخلتها حُفظت تلقائياً في النظام. بمجرد
            الضغط على &quot;استمرار الاختبار&quot; ستجد كل شيء كما تركته.
          </p>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          قد يكون الخطأ مؤقتاً بسبب انقطاع الإنترنت. تأكد من اتصالك ثم حاول
          مجدداً.
        </p>

        {/* Error code for support */}
        {error.digest && (
          <p className="mb-6 rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-400">
            رمز الدعم الفني: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            استمرار الاختبار
          </button>
          <a
            href="/student/exams"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للاختبارات
          </a>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          إذا استمرت المشكلة، تواصل مع الدعم الفني وأرسل رمز الدعم أعلاه
        </p>
      </div>
    </div>
  )
}
