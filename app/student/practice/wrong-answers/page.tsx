// app/student/practice/wrong-answers/page.tsx
// بنك مراجعة الإجابات الخاطئة — Server Component

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { WrongAnswersClient } from '@/components/student/WrongAnswersClient'

export default async function WrongAnswersPage() {
  const profile = await requireStudent()
  const supabase = createClient()

  // جلب كل الإجابات الخاطئة مع بيانات الأسئلة
  // (إذا الجدول غير موجود بعد، يُرجع مصفوفة فارغة بهدوء)
  let wrongItems: any[] = []
  try {
    const { data, error } = await supabase
      .from('wrong_answers_bank')
      .select(`
        id, times_wrong, times_correct_after, is_mastered, last_practiced_at, added_at,
        questions(
          id, question_type, context_passage, question_text, options, correct_answer, explanation, points, difficulty_level,
          subjects(id, name_ar, icon)
        )
      `)
      .eq('student_id', profile.id)
      .order('added_at', { ascending: false })
    if (!error && data) wrongItems = data
  } catch { /* الجدول غير موجود بعد */ }

  const pending = wrongItems.filter((w: any) => !w.is_mastered)
  const mastered = wrongItems.filter((w: any) => w.is_mastered)

  if (wrongItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">لا توجد أخطاء بعد!</h1>
        <p className="text-muted-foreground mb-4">
          ستظهر هنا الأسئلة التي أخطأت فيها في اختباراتك تلقائياً لتتمكن من مراجعتها.
        </p>
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-amber-800">
          💡 <strong>كيف تملأ هذه الصفحة؟</strong><br />
          بعد إنهاء أي اختبار، اضغط على زر <strong>"أضف الأخطاء للتدريب"</strong> في صفحة النتيجة
        </div>
        <Link href="/student/practice" className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90">
          العودة لمركز التدريب
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/student/practice" className="text-muted-foreground hover:text-primary transition-colors">
            مركز التدريب
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-bold">مراجعة الإجابات الخاطئة</span>
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          مراجعة الإجابات الخاطئة
        </h1>
        <p className="text-muted-foreground mt-1">
          تدرب على الأسئلة التي أخطأت فيها حتى تتقنها
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-premium p-5 text-center">
          <div className="text-3xl font-bold text-rose-500 mb-1">{pending.length}</div>
          <div className="text-xs text-muted-foreground">تنتظر المراجعة</div>
        </div>
        <div className="card-premium p-5 text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">{mastered.length}</div>
          <div className="text-xs text-muted-foreground">تمت إتقانها</div>
        </div>
        <div className="card-premium p-5 text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {wrongItems.length > 0 ? Math.round((mastered.length / wrongItems.length) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">نسبة الإتقان</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold">مستوى التقدم في المراجعة</span>
          <span className="text-sm text-muted-foreground">
            {mastered.length} / {wrongItems.length} سؤال
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${wrongItems.length > 0 ? (mastered.length / wrongItems.length) * 100 : 0}%` }}
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
