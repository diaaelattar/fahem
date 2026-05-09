// app/student/results/[id]/page.tsx
// تقرير نتيجة تفصيلي — [id] هو attemptId
// يعرض: الدرجة، مراجعة سؤال بسؤال، إجابة الطالب vs الصحيحة، أزرار إجراءات

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound, redirect } from 'next/navigation'
import {
  CheckCircle, XCircle, Clock, Award, TrendingUp,
  BookOpen, RotateCcw, Home, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { AddToPracticeButton } from '@/components/student/AddToPracticeButton'
import { AIExplainButton } from '@/components/student/AIExplainButton'

interface Props {
  params: { id: string }
}

export default async function ResultDetailPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = createClient()

  let attempt = await supabase
    .from('exam_attempts')
    .select(`
      id, score, percentage, is_passed, completed_at, started_at,
      time_spent_seconds, attempt_number, answers, feedback,
      student_answers(question_id, is_correct, teacher_feedback, score_awarded),
      exams(
        id, title, total_points, passing_score, show_results_immediately,
        allowed_attempts, subjects(name_ar, icon),
        grades(name_ar)
      )
    `)
    .eq('id', params.id)
    .eq('student_id', (profile as any).id)
    .single() as any

  // 🔄 إذا لم يتم العثور على محاولة بهذا المعرف، قد يكون المعرف هو معرف اختبار (Exam ID)
  // سنحاول العثور على آخر محاولة مكتملة لهذا الطالب في هذا الاختبار
  if (!attempt.data) {
    const { data: fallbackAttempt } = await (supabase
      .from('exam_attempts') as any)
      .select('id')
      .eq('exam_id', params.id)
      .eq('student_id', (profile as any).id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (fallbackAttempt) {
      redirect(`/student/results/${(fallbackAttempt as any).id}`)
    }
    notFound()
  }

  attempt = attempt.data

  // إذا لم تكتمل المحاولة، عد للاختبار
  if (!(attempt as any).completed_at) {
    redirect(`/student/exams/${(attempt as any).exams?.id}/take?attemptId=${params.id}`)
  }

  const exam = (attempt as any).exams
  const answers = (attempt.answers as Record<string, string>) || {}
  const feedback = (attempt.feedback as Record<string, any>) || {}

  // 🟢 تسجيل الاطلاع على الإجابات (Server-side)
  // بمجرد وصول الطالب لهذه الصفحة، نعلم أنه شاهد الإجابات النموذجية
  if (!feedback?.is_reviewed) {
    const updatedFeedback = {
      ...feedback,
      is_reviewed: true,
      reviewed_at: new Date().toISOString()
    }
    
    // استخدام أي (any) لتجاوز قيود الأنواع الصارمة في التحديث
    await (supabase
      .from('exam_attempts') as any)
      .update({ feedback: updatedFeedback })
      .eq('id', params.id)
  }

  const studentAnswersRecords = (attempt.student_answers as any[]) || []
  const answerDetailsMap = new Map(studentAnswersRecords.map(a => [a.question_id, a]))

  const normalizeArabic = (text: string) => {
    if (!text) return ''
    return text.trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
  }

  const checkAnswer = (studentAns: string, correctAns: string, type: string): boolean => {
    if (!studentAns || !correctAns) return false
    if (type === 'true_false') {
      const isStudentTrue  = studentAns === 'صح'  || studentAns.toLowerCase() === 'true'
      const isCorrectTrue  = correctAns  === 'صح'  || correctAns.toLowerCase()  === 'true'
      const isStudentFalse = studentAns === 'خطأ' || studentAns.toLowerCase() === 'false'
      const isCorrectFalse = correctAns  === 'خطأ' || correctAns.toLowerCase()  === 'false'
      return (isStudentTrue && isCorrectTrue) || (isStudentFalse && isCorrectFalse)
    }
    const ns = normalizeArabic(studentAns)
    const nc = normalizeArabic(correctAns)
    if (type === 'mcq') return ns === nc
    if (ns === nc) return true
    if (nc.length >= 3 && ns.includes(nc)) return true
    if (ns.length >= 3 && nc.includes(ns)) return true
    const sw = ns.split(/\s+/).filter(w => w.length >= 2)
    const cw = nc.split(/\s+/).filter(w => w.length >= 2)
    if (sw.length > 0 && cw.length > 0) {
      const common = cw.filter(w => sw.includes(w))
      if (sw.length <= 2 && common.length === sw.length) return true
      if (common.length / cw.length >= 0.4 || common.length / sw.length >= 0.5) return true
    }
    return false
  }

  let questionsWithAnswers: any[] = []
  if (exam?.show_results_immediately) {
    const { data: examQuestions } = await supabase
      .from('exam_questions')
      .select(`
        question_order,
        points_override,
        questions(id, question_type, context_passage, question_text, options, correct_answer, explanation, points, question_image_url, difficulty_level)
      `)
      .eq('exam_id', exam.id)
      .order('question_order')

    questionsWithAnswers = (examQuestions || [])
      .sort((a: any, b: any) => a.question_order - b.question_order)
      .map((eq: any) => {
        const q = eq.questions
        const studentAnswer = answers[q.id]
        
        // الأولوية 1: سجلات student_answers (التي تم تقييمها من API)
        const sa = answerDetailsMap.get(q.id)
        
        let isCorrect = false;
        if (sa && sa.is_correct !== undefined) {
          isCorrect = sa.is_correct;
        } else {
          // الأولوية 2: التقييم المحلي للطوارئ (باستخدام دالة checkAnswer المرنة)
          isCorrect = checkAnswer(studentAnswer, q.correct_answer, q.question_type)
        }

        return {
          ...q,
          points: eq.points_override || q.points || 1, // استخدام النقاط المخصصة إن وجدت
          studentAnswer,
          isCorrect,
          explanation: sa?.teacher_feedback || q.explanation, // الأولوية للتفسير من الموديل
          isAnswered: studentAnswer !== undefined && studentAnswer !== '',
        }
      })
  }

  const correctCount = questionsWithAnswers.filter(q => q.isCorrect).length
  const wrongCount = questionsWithAnswers.filter(q => q.isAnswered && !q.isCorrect).length
  const skippedCount = questionsWithAnswers.filter(q => !q.isAnswered).length
  const wrongQuestionIds = questionsWithAnswers.filter(q => !q.isCorrect).map(q => q.id)

  // Bloom's Taxonomy Analysis based on questions in this exam
  const bloomLabels: Record<string, string> = {
    remember: 'تذكر',
    understand: 'فهم',
    apply: 'تطبيق',
    analyze: 'تحليل',
    evaluate: 'تقييم',
    create: 'إبداع'
  }
  const bloomOrder = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
  const bloomStats: Record<string, { total: number; correct: number }> = {}
  questionsWithAnswers.forEach(q => {
    const level = q.bloom_level || 'understand'
    if (!bloomStats[level]) bloomStats[level] = { total: 0, correct: 0 }
    bloomStats[level].total += 1
    if (q.isCorrect) bloomStats[level].correct += 1
  })
  const hasBloomData = Object.keys(bloomStats).length > 0

  const TYPE_LABELS: Record<string, string> = { mcq: 'اختيار من متعدد', true_false: 'صح / خطأ', fill_blank: 'ملء فراغ' }
  const DIFF_LABELS: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }

  const formatTime = (seconds: number) => {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}د ${s}ث`
  }

  const percentage = (attempt as any).percentage || 0
  const isPassed = (attempt as any).is_passed
  
  // الدرجة الكلية الفعلية بناءً على الأسئلة أو النسبة المحتسبة لتجنب خطأ التناقض
  const actualTotalPoints = attempt.score > 0 && percentage > 0 
    ? Math.round((attempt.score / percentage) * 100) 
    : (questionsWithAnswers.length > 0 ? questionsWithAnswers.reduce((sum, q) => sum + q.points, 0) : exam?.total_points)

  const getScoreColor = (pct: number) => {
    if (pct >= 90) return 'text-egypt-green'
    if (pct >= 75) return 'text-primary'
    if (pct >= 60) return 'text-amber-600'
    return 'text-egypt-red'
  }

  const getGradeBg = (pct: number) => {
    if (pct >= 90) return 'from-green-50 to-emerald-50 border-green-200'
    if (pct >= 75) return 'from-blue-50 to-sky-50 border-blue-200'
    if (pct >= 60) return 'from-yellow-50 to-amber-50 border-yellow-200'
    return 'from-red-50 to-rose-50 border-red-200'
  }

  const getGrade = (pct: number) => {
    if (pct >= 90) return 'ممتاز'
    if (pct >= 80) return 'جيد جداً'
    if (pct >= 70) return 'جيد'
    if (pct >= 60) return 'مقبول'
    return 'راسب'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">

      {/* Hero Result Card */}
      <div className={`bg-gradient-to-br ${getGradeBg(percentage)} rounded-[2.5rem] border-2 shadow-2xl shadow-black/5 overflow-hidden`}>
        <div className="p-10 text-center relative">
          <div className="absolute top-4 right-4 text-[100px] font-bold opacity-5 select-none pointer-events-none">
            {getGrade(percentage)}
          </div>
          
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${isPassed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {isPassed
              ? <CheckCircle className="w-14 h-14" />
              : <XCircle className="w-14 h-14" />
            }
          </div>

          <h1 className="text-4xl font-bold mb-2 tracking-tight">
            {isPassed ? '🎉 أداء رائع، لقد نجحت!' : '💪 محاولة جيدة، يمكنك التحسن'}
          </h1>
          <p className="text-muted-foreground font-medium mb-8">{exam?.title} • {exam?.subjects?.name_ar}</p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-10">
            <div className="relative">
              <div className={`text-8xl font-black ${getScoreColor(percentage)} tabular-nums`}>
                {Math.round(percentage)}
                <span className="text-4xl ml-1">%</span>
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">النسبة النهائية</p>
            </div>
            
            <div className="h-20 w-px bg-border/50 hidden md:block" />
            
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">
                {(attempt as any).score} <span className="text-muted-foreground text-xl">/ {actualTotalPoints}</span>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">الدرجات المحصلة</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 w-32 bg-white rounded-full overflow-hidden border border-border/50">
                  <div className={`h-full ${isPassed ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{isPassed ? 'ناجح' : 'راسب'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'وقت الحل', value: formatTime((attempt as any).time_spent_seconds || 0), icon: Clock, color: 'text-blue-600 bg-blue-50' },
          { label: 'إجابات صحيحة', value: `${correctCount}/${questionsWithAnswers.length}`, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'إجابات خاطئة', value: String(wrongCount), icon: XCircle, color: 'text-red-500 bg-red-50' },
          { label: 'أسئلة متروكة', value: String(skippedCount), icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="card-premium p-5 text-center">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-inner`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bloom's Taxonomy Analysis */}
      {hasBloomData && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-1">تحليل أدائك حسب مستويات بلوم 🧠</h2>
          <p className="text-sm text-muted-foreground mb-5">رسم بياني لنقاط قوتك وضعفك في المستويات المعرفية المختلفة</p>
          <div className="space-y-3">
            {bloomOrder.filter(l => bloomStats[l]).map(level => {
              const { total, correct } = bloomStats[level]
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0
              return (
                <div key={level} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-bold text-right shrink-0">{bloomLabels[level]}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-16 text-left shrink-0">
                    <span className={`text-sm font-bold ${
                      pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'
                    }`}>{pct}٪</span>
                    <span className="text-xs text-muted-foreground"> ({correct}/{total})</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Question Review Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">مراجعة الإجابات والتحليل الذكي ✨</h2>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
              تم تحليل الإجابات بناءً على معايير المادة
            </div>
            {wrongQuestionIds.length > 0 && (
              <AddToPracticeButton
                questionIds={wrongQuestionIds}
                attemptId={params.id}
                studentId={profile.id}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {questionsWithAnswers.map((q, idx) => (
            <div key={q.id} className={`card-premium overflow-hidden border-l-8 ${
              !q.isAnswered ? 'border-l-slate-300' :
              q.isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
            }`}>
              {/* Question Meta Header */}
              <div className="px-6 py-4 bg-muted/30 border-b border-border flex flex-wrap items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-black">
                  {idx + 1}
                </span>
                <span className={`badge-${q.question_type} text-[10px] px-2 py-0.5 rounded-md`}>
                  {TYPE_LABELS[q.question_type]}
                </span>
                <span className={`badge-${q.difficulty_level || 'medium'} text-[10px] px-2 py-0.5 rounded-md`}>
                  {DIFF_LABELS[q.difficulty_level || 'medium']}
                </span>
                <span className="text-[10px] bg-white border border-border px-2 py-0.5 rounded-full font-bold">
                  {q.points} {q.points === 1 ? 'درجة' : 'درجات'}
                </span>
                
                <div className="mr-auto flex items-center gap-1.5">
                  {!q.isAnswered ? (
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-300" /> لم تُجب
                    </span>
                  ) : q.isCorrect ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> إجابة صحيحة
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> إجابة خاطئة
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {q.question_image_url && (
                  <img src={q.question_image_url} alt="سؤال مصور" className="rounded-2xl mb-6 max-h-64 object-contain shadow-sm border border-border" />
                )}
                {q.context_passage && (
                  <div className="mb-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 text-indigo-950 leading-relaxed italic relative">
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">القطعة المرجعية:</div>
                    <MathRenderer text={q.context_passage} className="text-lg" />
                  </div>
                )}
                <MathRenderer text={q.question_text} className="text-lg font-bold mb-6" />

                {/* MCQ Options Grid */}
                {q.question_type === 'mcq' && q.options && (
                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {q.options.map((opt: string, i: number) => {
                      const isStudentAnswer = q.studentAnswer === opt
                      const isCorrectAnswer = q.correct_answer === opt
                      return (
                        <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          isCorrectAnswer ? 'border-emerald-500 bg-emerald-50 shadow-sm' :
                          isStudentAnswer ? 'border-rose-400 bg-rose-50' :
                          'border-border hover:bg-muted/50'
                        }`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isCorrectAnswer ? 'bg-emerald-500 text-white' :
                            isStudentAnswer ? 'bg-rose-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {['أ', 'ب', 'ج', 'د'][i]}
                          </div>
                          <MathRenderer text={opt} className="text-sm font-medium flex-1" />
                          {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                          {isStudentAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-rose-500" />}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* True/False Buttons */}
                {q.question_type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {['صح', 'خطأ'].map(opt => {
                      const isStudentAnswer = q.studentAnswer === opt
                      const isCorrectAnswer = q.correct_answer === opt
                      return (
                        <div key={opt} className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${
                          isCorrectAnswer ? 'border-emerald-500 bg-emerald-50' :
                          isStudentAnswer ? 'border-rose-400 bg-rose-50' :
                          'border-border'
                        }`}>
                          <span className="text-4xl mb-2">{opt === 'صح' ? '✅' : '❌'}</span>
                          <span className="font-bold">{opt}</span>
                          {isCorrectAnswer && <span className="text-[10px] font-black text-emerald-600 mt-2 uppercase">الإجابة الصحيحة</span>}
                          {isStudentAnswer && !isCorrectAnswer && <span className="text-[10px] font-black text-rose-500 mt-2 uppercase">إجابتك</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Fill Blank Display */}
                {q.question_type === 'fill_blank' && (
                  <div className="bg-muted/30 rounded-3xl p-6 border border-border mb-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">إجابتك المسجلة</p>
                        <div className={`px-4 py-3 rounded-xl border-2 font-bold ${q.isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'}`}>
                          {q.studentAnswer || "لا توجد إجابة"}
                        </div>
                      </div>
                      {!q.isCorrect && (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 text-emerald-600">الإجابة الصحيحة</p>
                          <div className="px-4 py-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold">
                            {q.correct_answer}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analysis/Explanation Block */}
                {q.explanation && (
                  <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-5 flex gap-4 text-sky-900 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-sky-100">
                      <Sparkles className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-2">
                        تحليل الإجابة الذكي
                        <span className="bg-sky-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">AI Analysis</span>
                      </h4>
                      <MathRenderer text={q.explanation} className="text-sm font-medium leading-relaxed italic" />
                    </div>
                  </div>
                )}

                {/* AI Explain Button — only for wrong/skipped answers */}
                {!q.isCorrect && exam?.show_results_immediately && (
                  <AIExplainButton
                    questionId={q.id}
                    questionText={q.question_text}
                    correctAnswer={q.correct_answer}
                    studentAnswer={q.studentAnswer}
                    subject={(exam as any)?.subjects?.name_ar}
                    grade={(exam as any)?.grades?.name_ar}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="card-premium p-8 bg-premium-gradient text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold">تهانينا على إتمام المراجعة! 🎓</h3>
          <p className="text-white/60 text-sm">تم حفظ تقدمك، يمكنك العودة لمراجعة هذه النتائج في أي وقت من سجل النتائج.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/student/results" className="bg-white text-primary px-8 py-3 rounded-2xl font-bold text-sm hover:bg-white/90 transition-all flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> سجل النتائج
          </Link>
          <Link href="/student/dashboard" className="bg-white/10 text-white border border-white/20 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2">
            <Home className="w-4 h-4" /> العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}


