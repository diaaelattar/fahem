'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  Sparkles,
  Save,
  Check,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { toast } from 'sonner'

interface TeacherSubmissionReviewModalProps {
  attemptId: string
  onClose: () => void
  onScoreUpdated?: (attemptId: string, newScore: number, newPercentage: number) => void
}

export function TeacherSubmissionReviewModal({
  attemptId,
  onClose,
  onScoreUpdated,
}: TeacherSubmissionReviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, true, onClose)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])

  // Local editing state for scores & feedback: questionId -> { score, feedback, saving, saved }
  const [edits, setEdits] = useState<
    Record<
      string,
      {
        score: number
        feedback: string
        saving?: boolean
        saved?: boolean
      }
    >
  >({})

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/teacher/submissions/${attemptId}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'فشل تحميل بيانات المحاولة')
        }
        setAttempt(data.attempt)
        setQuestions(data.questions || [])

        // Initialize edits
        const initEdits: Record<string, any> = {}
        ;(data.questions || []).forEach((q: any) => {
          initEdits[q.id] = {
            score: q.score_awarded ?? 0,
            feedback: q.teacher_feedback || '',
          }
        })
        setEdits(initEdits)
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب البيانات')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [attemptId])

  const handleSaveQuestionScore = async (questionId: string, maxPoints: number) => {
    const editState = edits[questionId]
    if (!editState) return

    try {
      setEdits((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], saving: true, saved: false },
      }))

      const res = await fetch('/api/teacher/submissions/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId,
          scoreAwarded: editState.score,
          teacherFeedback: editState.feedback,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث الدرجة')
      }

      // Update attempt totals in UI
      setAttempt((prev: any) => ({
        ...prev,
        score: data.newTotalScore,
        percentage: data.newPercentage,
        is_passed: data.isPassed,
      }))

      // Notify parent table
      if (onScoreUpdated) {
        onScoreUpdated(attemptId, data.newTotalScore, data.newPercentage)
      }

      // Mark question as saved
      setEdits((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], saving: false, saved: true },
      }))

      toast.success('تم اعتماد وتحديث الدرجة بنجاح')
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الدرجة')
      setEdits((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], saving: false },
      }))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                مراجعة وتصحيح إجابات الطالب
              </h2>
              <p className="text-xs text-slate-500">
                {attempt?.exam_title || 'الاختبار'} • {attempt?.subject_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-indigo-600" />
              <p className="font-bold">جارٍ تحميل إجابات الطالب والتحليل...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
              <p className="font-bold">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student and Attempt Summary Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-indigo-700 shadow-sm">
                    {attempt.student_avatar ? (
                      <img
                        src={attempt.student_avatar}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800">
                      {attempt.student_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      تاريخ التسليم:{' '}
                      {new Date(attempt.completed_at).toLocaleString('ar-EG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      الدرجة الكلية
                    </p>
                    <p className="text-2xl font-black text-indigo-700">
                      {attempt.score}{' '}
                      <span className="text-xs font-bold text-slate-500">
                        / {attempt.exam_total_points}
                      </span>
                    </p>
                  </div>
                  <div
                    className={`rounded-xl px-3 py-1.5 text-center font-black ${
                      (attempt.percentage || 0) >= 85
                        ? 'bg-emerald-100 text-emerald-700'
                        : (attempt.percentage || 0) >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    <p className="text-sm">{Math.round(attempt.percentage || 0)}%</p>
                    <p className="text-[10px]">
                      {attempt.is_passed ? 'ناجح' : 'راسب'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const edit = edits[q.id] || {
                    score: q.score_awarded ?? 0,
                    feedback: q.teacher_feedback || '',
                  }
                  const isEssayOrCorrection =
                    q.question_type === 'essay' ||
                    q.question_type === 'correction'

                  return (
                    <div
                      key={q.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      {/* Question Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-xs">
                        <div className="flex items-center gap-2 font-bold">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                            {idx + 1}
                          </span>
                          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-slate-700">
                            {q.question_type === 'mcq'
                              ? 'اختيار من متعدد'
                              : q.question_type === 'true_false'
                                ? 'صح وخطأ'
                                : q.question_type === 'fill_blank'
                                  ? 'إكمال الفراغ'
                                  : 'سؤال مقالي'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700">
                            درجة السؤال: {q.points}
                          </span>
                          {q.is_correct ? (
                            <span className="flex items-center gap-1 font-bold text-emerald-600">
                              <CheckCircle className="h-4 w-4" /> إجابة صحيحة
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-bold text-rose-500">
                              <XCircle className="h-4 w-4" /> بحاجة لمراجعة
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="p-5">
                        {q.context_passage && (
                          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm italic text-indigo-900">
                            <span className="mb-1 block text-xs font-bold text-indigo-700">
                              القطعة المرجعية:
                            </span>
                            <MathRenderer text={q.context_passage} />
                          </div>
                        )}

                        <MathRenderer
                          text={q.question_text}
                          className="mb-4 text-base font-bold text-slate-800"
                        />

                        {q.question_image_url && (
                          <img
                            src={q.question_image_url}
                            alt=""
                            className="mb-4 max-h-56 rounded-xl border border-slate-200 object-contain"
                          />
                        )}

                        {/* MCQ Options Display */}
                        {q.question_type === 'mcq' && q.options && (
                          <div className="mb-4 grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt: string, i: number) => {
                              const isStudent = q.student_answer === opt
                              const isCorrect = q.correct_answer === opt
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center justify-between rounded-xl border p-3 text-xs font-medium ${
                                    isCorrect
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                                      : isStudent
                                        ? 'border-rose-300 bg-rose-50 text-rose-900'
                                        : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCorrect && (
                                    <span className="font-bold text-emerald-600">
                                      ✓ النموذجية
                                    </span>
                                  )}
                                  {isStudent && !isCorrect && (
                                    <span className="font-bold text-rose-600">
                                      اختيار الطالب
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Student Answer Box */}
                        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="mb-1.5 text-[11px] font-bold uppercase text-slate-500">
                            إجابة الطالب المسجلة:
                          </p>
                          {q.answer_image_url ? (
                            <div className="space-y-2">
                              <div className="max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                                <img
                                  src={q.answer_image_url}
                                  alt="إجابة الطالب بخط اليد"
                                  className="max-h-72 w-full rounded-lg object-contain"
                                />
                              </div>
                              {q.student_answer &&
                                !q.student_answer.startsWith('[image:') && (
                                  <p className="text-xs text-slate-600">
                                    <span className="font-bold">
                                      النص المستخرج آلياً:
                                    </span>{' '}
                                    {q.student_answer}
                                  </p>
                                )}
                            </div>
                          ) : (
                            <p className="font-bold text-slate-800">
                              {q.student_answer || 'لم يجب الطالب'}
                            </p>
                          )}
                        </div>

                        {/* Correct Answer Reference */}
                        {q.correct_answer && (
                          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900">
                            <span className="font-bold">الإجابة النموذجية: </span>
                            <MathRenderer text={q.correct_answer} />
                          </div>
                        )}

                        {/* NCREE AI Vision Rubric Card (If available) */}
                        {q.ai_vision_data?.rubric && (
                          <div className="mb-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-4 text-xs">
                            <div className="mb-2 flex items-center justify-between font-bold text-indigo-950">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                تقييم الذكاء الاصطناعي الاسترشادي (NCREE):
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-xl border border-indigo-100 bg-white p-2">
                                <div className="text-[10px] text-slate-400">
                                  المفاهيم (40%)
                                </div>
                                <div className="font-black text-indigo-700">
                                  {q.ai_vision_data.rubric.concepts ?? '—'}
                                </div>
                              </div>
                              <div className="rounded-xl border border-indigo-100 bg-white p-2">
                                <div className="text-[10px] text-slate-400">
                                  الخطوات (40%)
                                </div>
                                <div className="font-black text-indigo-700">
                                  {q.ai_vision_data.rubric.steps ?? '—'}
                                </div>
                              </div>
                              <div className="rounded-xl border border-indigo-100 bg-white p-2">
                                <div className="text-[10px] text-slate-400">
                                  الناتج (20%)
                                </div>
                                <div className="font-black text-indigo-700">
                                  {q.ai_vision_data.rubric.outcome ?? '—'}
                                </div>
                              </div>
                            </div>
                            {q.ai_vision_data.math_steps_valid && (
                              <p className="mt-2 font-bold text-emerald-700">
                                ✓ تم التحقق آلياً من سلامة الرموز والخطوات الرياضية
                              </p>
                            )}
                          </div>
                        )}

                        {/* Teacher Manual Grading & Correction Form */}
                        {isEssayOrCorrection && (
                          <div className="mt-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-4">
                            <h4 className="mb-3 flex items-center gap-2 text-xs font-black text-indigo-950">
                              <Award className="h-4 w-4 text-indigo-600" />
                              تصحيح المعلم واعتماد الدرجة:
                            </h4>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                                  الدرجة المستحقة (من {q.points}):
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={q.points}
                                  step={0.5}
                                  value={edit.score}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      0,
                                      Math.min(q.points, Number(e.target.value))
                                    )
                                    setEdits((prev) => ({
                                      ...prev,
                                      [q.id]: {
                                        ...prev[q.id],
                                        score: val,
                                        saved: false,
                                      },
                                    }))
                                  }}
                                  className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                                  ملاحظات وتوجيه المعلم للطالب:
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="اكتب توجيهك أو تعليقك هنا..."
                                    value={edit.feedback}
                                    onChange={(e) => {
                                      const text = e.target.value
                                      setEdits((prev) => ({
                                        ...prev,
                                        [q.id]: {
                                          ...prev[q.id],
                                          feedback: text,
                                          saved: false,
                                        },
                                      }))
                                    }}
                                    className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                  />
                                  <button
                                    onClick={() =>
                                      handleSaveQuestionScore(q.id, q.points)
                                    }
                                    disabled={edit.saving}
                                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    {edit.saving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : edit.saved ? (
                                      <>
                                        <Check className="h-4 w-4" /> تم الحفظ
                                      </>
                                    ) : (
                                      <>
                                        <Save className="h-4 w-4" /> حفظ
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-xs text-slate-500">
            يتم تحديث المجموع الكلي والنسبة المئوية للمحاولة فورياً عند حفظ أي
            درجة.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-900"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
