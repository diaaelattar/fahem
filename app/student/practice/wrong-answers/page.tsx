// app/student/practice/wrong-answers/page.tsx
// بنك مراجعة الإجابات الخاطئة — Server Component

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { WrongAnswersClient } from '@/components/student/WrongAnswersClient'

export default async function WrongAnswersPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // جلب كل الإجابات الخاطئة مع بيانات الأسئلة
  // (إذا الجدول غير موجود بعد، يُرجع مصفوفة فارغة بهدوء)
  let wrongItems: any[] = []
  try {
    const { data, error } = await supabase
      .from('wrong_answers_bank')
      .select(
        `
        id, times_wrong, times_correct_after, is_mastered, last_practiced_at, added_at,
        questions(
          id, question_type, context_passage, question_text, options, correct_answer, explanation, points, difficulty_level,
          subjects(id, name_ar, icon)
        )
      `
      )
      .eq('student_id', profile.id)
      .order('added_at', { ascending: false })
    if (!error && data) wrongItems = data
  } catch {
    /* الجدول غير موجود بعد */
  }

  const pending = wrongItems.filter((w: any) => !w.is_mastered)
  const mastered = wrongItems.filter((w: any) => w.is_mastered)

  if (wrongItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in py-20 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-14 w-14 text-green-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">لا توجد أخطاء بعد!</h1>
        <p className="mb-4 text-muted-foreground">
          ستظهر هنا الأسئلة التي أخطأت فيها في اختباراتك تلقائياً لتتمكن من
          مراجعتها.
        </p>
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          💡 <strong>كيف تملأ هذه الصفحة؟</strong>
          <br />
          بعد إنهاء أي اختبار، اضغط على زر{' '}
          <strong>"أضف الأخطاء للتدريب"</strong> في صفحة النتيجة
        </div>
        <Link
          href="/student/practice"
          className="rounded-xl bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90"
        >
          العودة لمركز التدريب
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Link
            href="/student/practice"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            مركز التدريب
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-bold">مراجعة الإجابات الخاطئة</span>
        </div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <AlertCircle className="h-8 w-8 text-rose-500" />
          مراجعة الإجابات الخاطئة
        </h1>
        <p className="mt-1 text-muted-foreground">
          تدرب على الأسئلة التي أخطأت فيها حتى تتقنها
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-premium p-5 text-center">
          <div className="mb-1 text-3xl font-bold text-rose-500">
            {pending.length}
          </div>
          <div className="text-xs text-muted-foreground">تنتظر المراجعة</div>
        </div>
        <div className="card-premium p-5 text-center">
          <div className="mb-1 text-3xl font-bold text-green-600">
            {mastered.length}
          </div>
          <div className="text-xs text-muted-foreground">تمت إتقانها</div>
        </div>
        <div className="card-premium p-5 text-center">
          <div className="mb-1 text-3xl font-bold text-primary">
            {wrongItems.length > 0
              ? Math.round((mastered.length / wrongItems.length) * 100)
              : 0}
            %
          </div>
          <div className="text-xs text-muted-foreground">نسبة الإتقان</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card-premium p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold">مستوى التقدم في المراجعة</span>
          <span className="text-sm text-muted-foreground">
            {mastered.length} / {wrongItems.length} سؤال
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
            style={{
              width: `${wrongItems.length > 0 ? (mastered.length / wrongItems.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Interactive Practice - Client Component */}
      <WrongAnswersClient
        pendingQuestions={pending as any[]}
        masteredCount={mastered.length}
        studentId={profile.id}
      />
    </div>
  )
}
