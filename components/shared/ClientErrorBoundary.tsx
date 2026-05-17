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
        <div className="min-h-[50vh] flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-amber-100">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-2">
              {isExam ? 'حدث خطأ في واجهة الاختبار' : 'حدث خطأ في هذا القسم'}
            </h2>

            {isExam && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-right">
                <p className="text-green-800 font-bold text-sm mb-1">✅ إجاباتك محفوظة تلقائياً</p>
                <p className="text-green-700 text-xs leading-relaxed">
                  جميع إجاباتك حُفظت في النظام. بمجرد الضغط على &quot;إعادة المحاولة&quot; ستجد كل شيء كما تركته.
                </p>
              </div>
            )}

            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              {isExam
                ? 'قد يكون الخطأ مؤقتاً. تأكد من اتصالك بالإنترنت ثم حاول مجدداً.'
                : 'حدث خطأ غير متوقع. يمكنك إعادة المحاولة.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorMessage && (
              <details className="mb-5 text-left">
                <summary className="text-xs text-slate-400 cursor-pointer mb-1">تفاصيل الخطأ (للمطورين)</summary>
                <pre className="text-xs bg-red-50 text-red-700 p-3 rounded-lg overflow-auto max-h-40 text-left">
                  {this.state.errorMessage}
                  {'\n\n'}
                  {this.state.errorStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
              <a
                href={isExam ? '/student/exams' : '/student/dashboard'}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
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
