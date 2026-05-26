import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound, redirect } from 'next/navigation'
import { Clock, BookOpen, AlertCircle, CheckCircle, Star } from 'lucide-react'
import { startExamAction } from './actions'

interface Props {
  params: { id: string }
}

export default async function StartExamPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = await createClient()

  // التحقق من إمكانية بدء الاختبار
  const { data: canAttempt } = await (supabase.rpc as any)('can_attempt_exam', {
    p_exam_id: params.id,
  })

  // تحقق إضافي: هل اطلع الطالب على الإجابات في أي محاولة سابقة؟
  const { data: previousAttempts } = await (
    supabase.from('exam_attempts') as any
  )
    .select('feedback')
    .eq('exam_id', params.id)
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)

  const hasViewedAnswers = previousAttempts?.some(
    (a: any) => a.feedback?.is_reviewed === true
  )

  if (!canAttempt?.can_attempt || hasViewedAnswers) {
    const reason = hasViewedAnswers
      ? 'عفواً، لا يمكن إعادة المحاولة لأنك قمت بالاطلاع على الإجابات النموذجية لمراجعتها.'
      : canAttempt?.reason || 'الاختبار غير متاح'

    // فحص هل يمكن التدريب على الاختبار (practice exam)
    const { data: practiceExam } = await supabase
      .from('exams')
      .select('id, title, show_results_immediately')
      .eq('id', params.id)
      .eq('show_results_immediately', true)
      .single()
    const canPractice = !practiceExam // إذا لم يكن practice mode

    const whatsappMessage = `السلام عليكم، أنا الطالب/ة ${profile.full_name}. أرغب في الاشتراك في باقة VIP لمنصة استباق التعليمية لتفعيل الاختبارات بلا حدود.`
    const whatsappUrl = `https://wa.me/201118209309?text=${encodeURIComponent(whatsappMessage)}`

    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h2 className="mb-2 text-xl font-bold">لا يمكن بدء الاختبار</h2>
        <p className="mb-6 text-muted-foreground">{reason}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/student/exams"
            className="rounded-xl bg-muted px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80"
          >
            العودة للاختبارات
          </a>
          {canAttempt?.is_limit_reached ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
            >
              <Star className="h-4 w-4 fill-white" />
              اشترك في باقة VIP
            </a>
          ) : previousAttempts?.length ? (
            <a
              href={`/student/results/${previousAttempts[0]?.id || params.id}`}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              عرض النتيجة السابقة
            </a>
          ) : null}
        </div>
        {hasViewedAnswers && (
          <p className="mt-6 text-xs text-muted-foreground">
            وفقاً لسياسة المنصة، الاطلاع على الإجابات يغلق باب إعادة المحاولة
            لضمان الشفافية.
          </p>
        )}
      </div>
    )
  }

  // إذا كانت هناك محاولة جارية، قم بتحويله مباشرة لصفحة الحل
  if (canAttempt?.has_ongoing && canAttempt?.attempt_id) {
    redirect(
      `/student/exams/${params.id}/take?attemptId=${canAttempt.attempt_id}`
    )
  }

  // جلب بيانات الاختبار
  const { data: exam } = await supabase
    .from('exams')
    .select(
      'id, title, duration_minutes, total_points, passing_score, show_results_immediately, instructions, questions_count, subjects(name_ar, icon), grades(name_ar)'
    )
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  return <ExamStartScreen exam={exam as any} />
}

function ExamStartScreen({ exam }: { exam: any }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        {/* Header */}
        <div
          className={`p-8 text-white ${
            exam.show_results_immediately
              ? 'bg-gradient-to-br from-indigo-600 to-violet-700'
              : 'bg-primary'
          }`}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="text-4xl">{exam.subjects?.icon || '📚'}</div>
            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                exam.show_results_immediately
                  ? 'border border-white/30 bg-white/20 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {exam.show_results_immediately
                ? '💪 وضع تدريب'
                : '🔴 اختبار حقيقي'}
            </span>
          </div>
          <h1 className="mb-1 font-display text-2xl font-bold">{exam.title}</h1>
          <p className="text-blue-100">
            {exam.subjects?.name_ar} • {exam.grades?.name_ar}
          </p>
        </div>

        {/* Info */}
        <div className="p-8">
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="text-xl font-bold">{exam.duration_minutes}</div>
              <div className="text-xs text-muted-foreground">دقيقة</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="text-xl font-bold">
                {exam.questions_count || 0}
              </div>
              <div className="text-xs text-muted-foreground">سؤال</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <CheckCircle className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="text-xl font-bold">{exam.total_points}</div>
              <div className="text-xs text-muted-foreground">درجة كاملة</div>
            </div>
          </div>

          {exam.instructions && (
            <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="mb-2 font-bold text-yellow-800">
                📋 تعليمات الاختبار
              </h3>
              <p className="text-sm leading-relaxed text-yellow-700">
                {exam.instructions}
              </p>
            </div>
          )}

          <div className="mb-8 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="text-primary">✓</span> يمكنك التنقل بين الأسئلة
              بحرية
            </p>
            <p className="flex items-center gap-2">
              <span className="text-primary">✓</span> سيتم التسليم التلقائي عند
              انتهاء الوقت
            </p>
            <p className="flex items-center gap-2">
              <span className="text-primary">✓</span> يتم حفظ إجاباتك تلقائياً
              كل 30 ثانية
            </p>
            {exam.passing_score != null && (
              <p className="flex items-center gap-2">
                <span className="text-primary">✓</span> نسبة النجاح:{' '}
                <strong>{exam.passing_score}%</strong>
              </p>
            )}
          </div>

          <form action={startExamAction}>
            <input type="hidden" name="examId" value={exam.id} />
            <button
              type="submit"
              className={`w-full rounded-2xl py-4 text-lg font-bold transition-all hover:scale-[1.01] ${
                exam.show_results_immediately
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {exam.show_results_immediately
                ? '💪 ابدأ جلسة التدريب'
                : '🚀 ابدأ الاختبار الآن'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
