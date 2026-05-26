'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional: hint shown in error message to tell user what section crashed */
  sectionName?: string
}

interface State {
  hasError: boolean
  errorMessage: string
  errorStack?: string
}

/**
 * React Class-based Error Boundary for wrapping Client Components
 * that cannot use Next.js error.tsx (which only catches server errors
 * and needs a page boundary).
 *
 * Use this to wrap ExamInterface, MathRenderer, or any component that
 * processes untrusted data (AI-generated text, LaTeX strings, etc.)
 */
export class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'خطأ غير معروف',
      errorStack: error.stack,
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for debugging — replace with Sentry when ready
    console.error('[ClientErrorBoundary] Caught error:', {
      message: error.message,
      section: this.props.sectionName,
      componentStack: info.componentStack,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: undefined })
  }

  render() {
    if (this.state.hasError) {
      const isExam = this.props.sectionName === 'exam'

      return (
        <div
          className="flex min-h-[50vh] items-center justify-center p-4"
          dir="rtl"
        >
          <div className="w-full max-w-lg rounded-2xl border-2 border-amber-100 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            <h2 className="mb-2 text-lg font-bold text-slate-800">
              {isExam ? 'حدث خطأ في واجهة الاختبار' : 'حدث خطأ في هذا القسم'}
            </h2>

            {isExam && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-right">
                <p className="mb-1 text-sm font-bold text-green-800">
                  ✅ إجاباتك محفوظة تلقائياً
                </p>
                <p className="text-xs leading-relaxed text-green-700">
                  جميع إجاباتك حُفظت في النظام. بمجرد الضغط على &quot;إعادة
                  المحاولة&quot; ستجد كل شيء كما تركته.
                </p>
              </div>
            )}

            <p className="mb-5 text-sm leading-relaxed text-slate-500">
              {isExam
                ? 'قد يكون الخطأ مؤقتاً. تأكد من اتصالك بالإنترنت ثم حاول مجدداً.'
                : 'حدث خطأ غير متوقع. يمكنك إعادة المحاولة.'}
            </p>

            {process.env.NODE_ENV === 'development' &&
              this.state.errorMessage && (
                <details className="mb-5 text-left">
                  <summary className="mb-1 cursor-pointer text-xs text-slate-400">
                    تفاصيل الخطأ (للمطورين)
                  </summary>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">
                    {this.state.errorMessage}
                    {'\n\n'}
                    {this.state.errorStack}
                  </pre>
                </details>
              )}

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </button>
              <a
                href={isExam ? '/student/exams' : '/student/dashboard'}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <ArrowRight className="h-4 w-4" />
                {isExam ? 'العودة للاختبارات' : 'لوحة التحكم'}
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
