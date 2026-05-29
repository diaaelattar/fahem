'use client'
// app/exam/[token]/take/page.tsx
// صفحة حل الاختبار للضيف — Client Component
// تقرأ البيانات من sessionStorage وتستخدم GuestExamInterface

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { GuestExamInterface } from '@/components/teacher/GuestExamInterface'
import { Loader2, AlertCircle } from 'lucide-react'

interface ExamData {
  id: string
  title: string
  duration_minutes: number
  total_points: number
  passing_score: number
  instructions?: string
  subject?: string
  grade?: string
}

interface SessionData {
  guestName: string
  exam: ExamData
  questions: any[]
}

export default function GuestTakeExamPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = params.token as string
  const attemptId = searchParams.get('attemptId')

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // قراءة بيانات الجلسة من sessionStorage
  useEffect(() => {
    if (!attemptId) {
      router.replace(`/exam/${token}`)
      return
    }

    const stored = sessionStorage.getItem(`guest_exam_${attemptId}`)
    if (!stored) {
      setError('انتهت جلسة الاختبار. يرجى البدء من جديد.')
      setLoading(false)
      return
    }

    try {
      const data = JSON.parse(stored) as SessionData
      setSessionData(data)
    } catch {
      setError('حدث خطأ في تحميل بيانات الاختبار.')
    } finally {
      setLoading(false)
    }
  }, [attemptId, token, router])

  // تسليم الاختبار
  const handleSubmit = async (answers: Record<string, string>) => {
    if (!attemptId || isSubmitting) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/exam/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          attemptId,
          answers,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'فشل تسليم الاختبار')

      // حفظ نتيجة التسليم للصفحة القادمة
      sessionStorage.setItem(
        `guest_result_${attemptId}`,
        JSON.stringify({
          result: data.result,
          questionsReview: data.questionsReview,
          guestName: sessionData?.guestName,
        })
      )

      // تنظيف بيانات الجلسة
      sessionStorage.removeItem(`guest_exam_${attemptId}`)

      // توجيه لصفحة النتيجة
      router.push(`/exam/${token}/result/${attemptId}`)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسليم')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-500" />
          <p className="font-bold text-slate-600">جاري تحميل الاختبار...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" dir="rtl">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-800">
            {error || 'خطأ في التحميل'}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            يرجى العودة للرابط الأصلي والمحاولة مرة أخرى
          </p>
          <a
            href={`/exam/${token}`}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
          >
            العودة وإعادة المحاولة
          </a>
        </div>
      </div>
    )
  }

  return (
    <GuestExamInterface
      attemptId={attemptId!}
      examTitle={sessionData.exam.title}
      durationMinutes={sessionData.exam.duration_minutes}
      questions={sessionData.questions}
      guestName={sessionData.guestName}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
