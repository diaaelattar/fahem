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
  const supabase = createClient()

  // التحقق من إمكانية بدء الاختبار
  const { data: canAttempt } = await (supabase.rpc as any)('can_attempt_exam', { p_exam_id: params.id })

  // تحقق إضافي: هل اطلع الطالب على الإجابات في أي محاولة سابقة؟
  const { data: previousAttempts } = await (supabase
    .from('exam_attempts') as any)
    .select('feedback')
    .eq('exam_id', params.id)
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)

  const hasViewedAnswers = previousAttempts?.some((a: any) => a.feedback?.is_reviewed === true)

  if (!canAttempt?.can_attempt || hasViewedAnswers) {
    const reason = hasViewedAnswers 
      ? 'عفواً، لا يمكن إعادة المحاولة لأنك قمت بالاطلاع على الإجابات النموذجية لمراجعتها.'
      : (canAttempt?.reason || 'الاختبار غير متاح')

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
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">لا يمكن بدء الاختبار</h2>
        <p className="text-muted-foreground mb-6">{reason}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <a href="/student/exams" className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-muted/80">
            العودة للاختبارات
          </a>
          {canAttempt?.is_limit_reached ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-amber-600 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 fill-white" />
              اشترك في باقة VIP
            </a>
          ) : previousAttempts?.length ? (
            <a href={`/student/results/${previousAttempts[0]?.id || params.id}`} className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90">
              عرض النتيجة السابقة
            </a>
          ) : null}
        </div>
        {hasViewedAnswers && (
           <p className="text-xs text-muted-foreground mt-6">وفقاً لسياسة المنصة، الاطلاع على الإجابات يغلق باب إعادة المحاولة لضمان الشفافية.</p>
        )}
      </div>
    )
  }

  // إذا كانت هناك محاولة جارية، قم بتحويله مباشرة لصفحة الحل
  if (canAttempt?.has_ongoing && canAttempt?.attempt_id) {
    redirect(`/student/exams/${params.id}/take?attemptId=${canAttempt.attempt_id}`)
  }

  // جلب بيانات الاختبار
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, total_points, passing_score, show_results_immediately, instructions, questions_count, subjects(name_ar, icon), grades(name_ar)')
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  return <ExamStartScreen exam={exam as any} />
}

function ExamStartScreen({ exam }: { exam: any }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className={`p-8 text-white ${
          exam.show_results_immediately
            ? 'bg-gradient-to-br from-indigo-600 to-violet-700'
            : 'bg-primary'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl">{exam.subjects?.icon || '📚'}</div>
            <span className={`text-[11px] font-black px-3 py-1.5 rounded-full ${
              exam.show_results_immediately
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-red-500 text-white'
            }`}>
              {exam.show_results_immediately ? '💪 وضع تدريب' : '🔴 اختبار حقيقي'}
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold mb-1">{exam.title}</h1>
          <p className="text-blue-100">{exam.subjects?.name_ar} • {exam.grades?.name_ar}</p>
        </div>

        {/* Info */}
        <div className="p-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">{exam.duration_minutes}</div>
              <div className="text-xs text-muted-foreground">دقيقة</div>
            </div>
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">{exam.questions_count || 0}</div>
              <div className="text-xs text-muted-foreground">سؤال</div>
            </div>
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">{exam.total_points}</div>
              <div className="text-xs text-muted-foreground">درجة كاملة</div>
            </div>
          </div>

          {exam.instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-yellow-800 mb-2">📋 تعليمات الاختبار</h3>
              <p className="text-sm text-yellow-700 leading-relaxed">{exam.instructions}</p>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground mb-8">
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> يمكنك التنقل بين الأسئلة بحرية</p>
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> سيتم التسليم التلقائي عند انتهاء الوقت</p>
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> يتم حفظ إجاباتك تلقائياً كل 30 ثانية</p>
            {exam.passing_score != null && (
              <p className="flex items-center gap-2"><span className="text-primary">✓</span> نسبة النجاح: <strong>{exam.passing_score}%</strong></p>
            )}
          </div>

          <form action={startExamAction}>
            <input type="hidden" name="examId" value={exam.id} />
            <button type="submit"
              className={`w-full font-bold py-4 rounded-2xl text-lg transition-all hover:scale-[1.01] ${
                exam.show_results_immediately
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}>
              {exam.show_results_immediately ? '💪 ابدأ جلسة التدريب' : '🚀 ابدأ الاختبار الآن'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
