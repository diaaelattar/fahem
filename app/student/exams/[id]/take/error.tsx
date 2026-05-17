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
    console.error('[ExamError] Error in exam flow:', error.message, error.digest)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-amber-100">

        {/* Icon */}
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          حدث خطأ أثناء الاختبار
        </h2>

        {/* Reassurance message - CRITICAL for exam UX */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-right">
          <p className="text-green-800 font-bold text-sm mb-1">✅ إجاباتك محفوظة تلقائياً</p>
          <p className="text-green-700 text-xs leading-relaxed">
            لا تقلق — جميع إجاباتك التي أدخلتها حُفظت تلقائياً في النظام.
            بمجرد الضغط على &quot;استمرار الاختبار&quot; ستجد كل شيء كما تركته.
          </p>
        </div>

        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          قد يكون الخطأ مؤقتاً بسبب انقطاع الإنترنت. تأكد من اتصالك ثم حاول مجدداً.
        </p>

        {/* Error code for support */}
        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 bg-slate-50 px-3 py-1.5 rounded-lg font-mono">
            رمز الدعم الفني: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            استمرار الاختبار
          </button>
          <a
            href="/student/exams"
            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للاختبارات
          </a>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          إذا استمرت المشكلة، تواصل مع الدعم الفني وأرسل رمز الدعم أعلاه
        </p>
      </div>
    </div>
  )
}
