'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ZoomIn,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Save,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  Loader2,
  Eye,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { toast } from 'sonner'

interface HandwrittenAnswer {
  id: string
  attempt_id: string
  question_id: string
  student_id: string
  answer_image_url: string | null
  student_answer: string | null
  is_correct: boolean | null
  score_awarded: number | null
  teacher_feedback: string | null
  ai_vision_feedback: string | null
  grading_method: string | null
  // Joined
  question_text?: string
  question_type?: string
  correct_answer?: string
  points?: number
  student_name?: string
  exam_title?: string
  completed_at?: string
}

interface HandwrittenGradingPanelProps {
  examId: string
  teacherMaxScore?: number
}

export function HandwrittenGradingPanel({
  examId,
}: HandwrittenGradingPanelProps) {
  const supabase = createClient() as any
  const [answers, setAnswers] = useState<HandwrittenAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [scores, setScores] = useState<Record<string, number>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending')

  useEffect(() => {
    fetchHandwrittenAnswers()
  }, [examId])

  async function fetchHandwrittenAnswers() {
    setLoading(true)
    try {
      // جلب الإجابات المصوّرة لهذا الامتحان
      const { data, error } = await supabase
        .from('student_answers')
        .select(
          `
          *,
          questions!question_id(question_text, question_type, correct_answer, points),
          exam_attempts!attempt_id(
            completed_at,
            exams!exam_id(title),
            students!student_id(full_name, email)
          )
        `
        )
        .eq('exam_attempts.exam_id', examId)
        .eq('grading_method', 'image')
        .not('answer_image_url', 'is', null)

      if (error) throw error

      const mapped: HandwrittenAnswer[] = (data || []).map((row: any) => ({
        ...row,
        question_text: row.questions?.question_text,
        question_type: row.questions?.question_type,
        correct_answer: row.questions?.correct_answer,
        points: row.questions?.points || 1,
        student_name:
          row.exam_attempts?.students?.full_name ||
          row.exam_attempts?.students?.email ||
          'طالب',
        exam_title: row.exam_attempts?.exams?.title,
        completed_at: row.exam_attempts?.completed_at,
      }))

      setAnswers(mapped)

      // تهيئة القيم الحالية
      const initScores: Record<string, number> = {}
      const initFeedbacks: Record<string, string> = {}
      mapped.forEach((a) => {
        initScores[a.id] = a.score_awarded ?? 0
        initFeedbacks[a.id] = a.teacher_feedback || ''
      })
      setScores(initScores)
      setFeedbacks(initFeedbacks)
    } catch (err: any) {
      console.error('Failed to fetch handwritten answers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveGrade(answerId: string) {
    const answer = answers.find((a) => a.id === answerId)
    if (!answer) return

    setSaving((prev) => ({ ...prev, [answerId]: true }))
    try {
      const score = scores[answerId] ?? 0
      const { error } = await supabase
        .from('student_answers')
        .update({
          score_awarded: score,
          teacher_feedback: feedbacks[answerId] || '',
          is_correct: score >= (answer.points || 1),
          grading_method: 'manual', // تحديث لـ manual بعد التصحيح اليدوي
        })
        .eq('id', answerId)

      if (error) throw error

      setSaved((prev) => ({ ...prev, [answerId]: true }))
      setTimeout(
        () => setSaved((prev) => ({ ...prev, [answerId]: false })),
        3000
      )

      // تحديث الـ state المحلي
      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? {
                ...a,
                score_awarded: score,
                teacher_feedback: feedbacks[answerId],
                is_correct: score >= (answer.points || 1),
              }
            : a
        )
      )
    } catch (err: any) {
      toast.error('فشل حفظ الدرجة: ' + err.message)
    } finally {
      setSaving((prev) => ({ ...prev, [answerId]: false }))
    }
  }

  const filteredAnswers = answers.filter((a) => {
    if (filter === 'pending') return a.grading_method === 'image' // AI-graded, awaiting teacher review
    if (filter === 'graded') return a.grading_method === 'manual'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (answers.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Camera className="mx-auto mb-3 h-12 w-12 opacity-30" />
        <p className="font-medium">لا توجد إجابات مصوّرة لهذا الامتحان</p>
        <p className="mt-1 text-sm">
          ستظهر هنا إجابات الطلاب التي تم رفعها كصور
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomImage(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setZoomImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage}
            alt="إجابة الطالب"
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Header + Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Camera className="h-5 w-5 text-primary" />
              الإجابات المصوّرة بخط اليد
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {answers.length}
              </span>
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              راجع صور إجابات الطلاب وأدخل الدرجة اليدوية
            </p>
          </div>

          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            {(
              [
                ['all', 'الكل'],
                ['pending', 'بانتظار المراجعة'],
                ['graded', 'تم التصحيح'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  filter === key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Cards */}
        {filteredAnswers.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            لا توجد إجابات في هذه الفئة
          </div>
        ) : (
          filteredAnswers.map((answer) => {
            const aiData = answer.ai_vision_feedback
              ? (() => {
                  try {
                    return JSON.parse(answer.ai_vision_feedback)
                  } catch {
                    return null
                  }
                })()
              : null
            const maxPts = answer.points || 1
            const isExpanded = expanded[answer.id]
            const isSaved = saved[answer.id]
            const isSaving = saving[answer.id]

            return (
              <div
                key={answer.id}
                className={`overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                  answer.grading_method === 'manual'
                    ? 'border-green-200'
                    : 'border-amber-200'
                }`}
              >
                {/* Card Header */}
                <div
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [answer.id]: !prev[answer.id],
                    }))
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white ${
                        answer.grading_method === 'manual'
                          ? 'bg-green-500'
                          : 'bg-amber-500'
                      }`}
                    >
                      {answer.grading_method === 'manual' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{answer.student_name}</p>
                      <p className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
                        {answer.question_text?.slice(0, 80)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* AI score badge */}
                    {answer.score_awarded !== null && (
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-black ${
                          answer.is_correct
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {answer.score_awarded}/{maxPts}
                      </span>
                    )}
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${
                        answer.grading_method === 'manual'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {answer.grading_method === 'manual'
                        ? '✅ صُحِّح'
                        : '⏳ يحتاج مراجعة'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="space-y-4 border-t border-border p-5">
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {/* Left: Image */}
                      <div>
                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Camera className="h-4 w-4" /> صورة إجابة الطالب
                        </h4>
                        {answer.answer_image_url ? (
                          <div className="group relative overflow-hidden rounded-xl border border-border bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={answer.answer_image_url}
                              alt="إجابة مصوّرة"
                              className="max-h-80 w-full cursor-zoom-in object-contain"
                              onClick={() =>
                                setZoomImage(answer.answer_image_url!)
                              }
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                              <button
                                onClick={() =>
                                  setZoomImage(answer.answer_image_url!)
                                }
                                className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-lg"
                              >
                                <ZoomIn className="h-4 w-4" /> تكبير
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-40 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                            لا توجد صورة
                          </div>
                        )}

                        {/* AI extracted text */}
                        {aiData?.extracted_text && (
                          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                            <p className="mb-1 flex items-center gap-1 text-xs font-bold text-blue-700">
                              <Eye className="h-3.5 w-3.5" /> ما قرأه الذكاء
                              الاصطناعي:
                            </p>
                            <p className="text-sm leading-relaxed text-blue-800">
                              {aiData.extracted_text}
                            </p>
                            {aiData.confidence && (
                              <p className="mt-1 text-xs text-blue-600">
                                وضوح الخط:{' '}
                                <strong>
                                  {aiData.confidence === 'high'
                                    ? 'عالٍ ✅'
                                    : aiData.confidence === 'medium'
                                      ? 'متوسط ⚠️'
                                      : 'منخفض ❌'}
                                </strong>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Question + Grading */}
                      <div className="space-y-3">
                        {/* Question */}
                        <div>
                          <h4 className="mb-2 text-sm font-bold text-slate-700">
                            نص السؤال
                          </h4>
                          <div
                            className="rounded-xl bg-slate-50 p-3 text-sm"
                            dir="rtl"
                          >
                            <MathRenderer
                              text={answer.question_text || ''}
                              className="leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Model answer */}
                        {answer.correct_answer && (
                          <div>
                            <h4 className="mb-2 text-sm font-bold text-green-700">
                              الإجابة النموذجية
                            </h4>
                            <div
                              className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm"
                              dir="rtl"
                            >
                              <MathRenderer
                                text={answer.correct_answer}
                                className="leading-relaxed"
                              />
                            </div>
                          </div>
                        )}

                        {/* AI feedback */}
                        {answer.teacher_feedback &&
                          answer.grading_method === 'image' && (
                            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                              <p className="mb-1 text-xs font-bold text-purple-700">
                                تقييم الذكاء الاصطناعي الأولي:
                              </p>
                              <p className="text-sm text-purple-800">
                                {answer.teacher_feedback}
                              </p>
                            </div>
                          )}

                        {/* Manual score input */}
                        <div className="space-y-3 rounded-xl border-2 border-primary/30 bg-white p-4">
                          <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <Star className="h-4 w-4 text-amber-500" />
                            الدرجة اليدوية (من {maxPts})
                          </h4>

                          {/* Score slider + input */}
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={maxPts}
                              step={0.5}
                              value={scores[answer.id] ?? 0}
                              onChange={(e) =>
                                setScores((prev) => ({
                                  ...prev,
                                  [answer.id]: Number(e.target.value),
                                }))
                              }
                              className="flex-1 accent-primary"
                            />
                            <input
                              type="number"
                              min={0}
                              max={maxPts}
                              step={0.5}
                              value={scores[answer.id] ?? 0}
                              onChange={(e) =>
                                setScores((prev) => ({
                                  ...prev,
                                  [answer.id]: Math.min(
                                    maxPts,
                                    Math.max(0, Number(e.target.value))
                                  ),
                                }))
                              }
                              className="w-16 rounded-lg border-2 border-border py-1 text-center text-lg font-bold focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Quick score buttons */}
                          <div className="flex flex-wrap gap-2">
                            {[
                              0,
                              Math.round(maxPts * 0.5),
                              Math.round(maxPts * 0.75),
                              maxPts,
                            ].map((v) => (
                              <button
                                key={v}
                                onClick={() =>
                                  setScores((prev) => ({
                                    ...prev,
                                    [answer.id]: v,
                                  }))
                                }
                                className={`rounded-lg border px-3 py-1 text-xs font-bold transition-all ${
                                  scores[answer.id] === v
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>

                          {/* Feedback */}
                          <textarea
                            value={feedbacks[answer.id] || ''}
                            onChange={(e) =>
                              setFeedbacks((prev) => ({
                                ...prev,
                                [answer.id]: e.target.value,
                              }))
                            }
                            placeholder="ملاحظات للطالب (اختياري)..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            dir="rtl"
                          />

                          {/* Save button */}
                          <button
                            onClick={() => saveGrade(answer.id)}
                            disabled={isSaving}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                              isSaved
                                ? 'bg-green-500 text-white'
                                : 'bg-primary text-white hover:bg-primary/90'
                            } disabled:opacity-60`}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                جاري الحفظ...
                              </>
                            ) : isSaved ? (
                              <>
                                <CheckCircle className="h-4 w-4" /> تم الحفظ!
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" /> حفظ الدرجة
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
