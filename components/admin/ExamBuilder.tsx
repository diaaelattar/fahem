'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2,
  Save,
  Eye,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from 'lucide-react'
import { AutoSelectModal } from './AutoSelectModal'
import { ExamBuilderSettings } from './ExamBuilderSettings'
import { QuestionBankPanel } from './QuestionBankPanel'
import type {
  QuestionItem,
  SelectedQuestion,
  ExamBuilderProps,
  ExamFormState,
} from './ExamBuilderTypes'
import { DEFAULT_FORM, DIFF_AR, DIFF_COLOR, TYPE_AR } from './ExamBuilderTypes'

const STEPS = [
  { id: 1, label: 'إعدادات الاختبار', icon: '⚙️' },
  { id: 2, label: 'اختيار الأسئلة', icon: '📝' },
  { id: 3, label: 'مراجعة ونشر', icon: '🚀' },
]

export function ExamBuilder({
  subjects,
  grades,
  semesters,
  units,
  lessons,
  examId,
  initialData,
}: ExamBuilderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)

  const [form, setForm] = useState<ExamFormState>(() =>
    initialData
      ? {
          title: initialData.title || '',
          description: initialData.description || '',
          subjectId: initialData.subject_id?.toString() || '',
          gradeId: initialData.grade_id?.toString() || '',
          semesterId: initialData.semester_id?.toString() || '',
          unitId: initialData.unit_id?.toString() || '',
          lessonId: initialData.lesson_id?.toString() || '',
          examType: initialData.exam_type || 'partial',
          duration: initialData.duration_minutes?.toString() || '30',
          passingScore: initialData.passing_score?.toString() || '',
          instructions: initialData.instructions || '',
          isPublished: initialData.is_published || false,
          availableFrom: initialData.available_from?.slice(0, 16) || '',
          availableUntil: initialData.available_until?.slice(0, 16) || '',
          shuffleQuestions: initialData.shuffle_questions ?? true,
          shuffleOptions: initialData.shuffle_options ?? true,
          showResultsImmediately: initialData.show_results_immediately ?? true,
          allowedAttempts: initialData.allowed_attempts?.toString() || '1',
          bankSearch: '',
          bankQuestionType: '',
          bankDifficulty: '',
          groupId: '',
        }
      : { ...DEFAULT_FORM }
  )

  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<
    SelectedQuestion[]
  >([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isAutoSelectOpen, setIsAutoSelectOpen] = useState(false)

  const totalPoints = selectedQuestions.reduce(
    (s, q) => s + (q.points_override ?? q.points),
    0
  )

  // ── Fetch questions when hierarchy filters change ─────────
  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    try {
      let q = supabase
        .from('questions')
        .select(
          'id, question_type, context_passage, question_text, difficulty_level, points, unit_id, lesson_id, subjects(name_ar,icon), grades(name_ar), units(name_ar), lessons(name_ar)'
        )
        // Admin sees all questions regardless of approval status
        .order('created_at', { ascending: false })
        .limit(300)

      if (form.gradeId) q = q.eq('grade_id', form.gradeId)
      if (form.subjectId) q = q.eq('subject_id', form.subjectId)
      if (form.unitId) q = q.eq('unit_id', form.unitId)
      if (form.lessonId) q = q.eq('lesson_id', form.lessonId)
      if (form.bankQuestionType)
        q = q.eq('question_type', form.bankQuestionType)
      if (form.bankDifficulty) q = q.eq('difficulty_level', form.bankDifficulty)
      if (form.bankSearch) q = q.ilike('question_text', `%${form.bankSearch}%`)

      const { data, error: qErr } = await q
      if (qErr) console.error('[ExamBuilder] loadQuestions error:', qErr)
      setBankQuestions((data || []) as unknown as QuestionItem[])
    } catch (e) {
      console.error('[ExamBuilder] unexpected error:', e)
    } finally {
      setLoadingQ(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.gradeId,
    form.subjectId,
    form.unitId,
    form.lessonId,
    form.bankQuestionType,
    form.bankDifficulty,
    form.bankSearch,
  ])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  // Load existing questions when editing
  useEffect(() => {
    if (examId && initialData) {
      supabase
        .from('exam_questions')
        .select(
          'question_id, question_order, points_override, questions(id,question_type,context_passage,question_text,difficulty_level,points,unit_id,lesson_id,subjects(name_ar,icon),grades(name_ar),units(name_ar),lessons(name_ar))'
        )
        .eq('exam_id', examId)
        .order('question_order')
        .then(({ data }) => {
          if (data)
            setSelectedQuestions(
              data.map((eq: any) => ({
                ...eq.questions,
                order: eq.question_order,
                points_override: eq.points_override,
              }))
            )
        })
    }
  }, [examId])

  const addQuestion = (q: QuestionItem) => {
    if (selectedQuestions.find((s) => s.id === q.id)) return
    setSelectedQuestions((prev) => [...prev, { ...q, order: prev.length + 1 }])
  }

  const handleAutoAdd = (newQs: QuestionItem[]) => {
    setSelectedQuestions((prev) => {
      const ids = new Set(prev.map((q) => q.id))
      const toAdd = newQs.filter((q) => !ids.has(q.id))
      return [
        ...prev,
        ...toAdd.map((q, i) => ({ ...q, order: prev.length + i + 1 })),
      ]
    })
  }

  const removeQuestion = (id: string) =>
    setSelectedQuestions((prev) =>
      prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i + 1 }))
    )

  const updatePoints = (id: string, pts: number) =>
    setSelectedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, points_override: pts } : q))
    )

  const validate = (): string => {
    if (!form.title.trim()) return 'العنوان مطلوب'
    if (!form.subjectId) return 'اختر المادة الدراسية'
    if (!form.gradeId) return 'اختر الصف الدراسي'
    if (selectedQuestions.length === 0) return 'أضف سؤالاً واحداً على الأقل'
    if (!form.duration || parseInt(form.duration) < 1)
      return 'مدة الاختبار يجب أن تكون أكبر من صفر'
    return ''
  }

  const handleSave = async (publish: boolean) => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const examData = {
        admin_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        subject_id: parseInt(form.subjectId),
        grade_id: parseInt(form.gradeId),
        semester_id: form.semesterId ? parseInt(form.semesterId) : null,
        unit_id: form.unitId ? parseInt(form.unitId) : null,
        lesson_id: form.lessonId ? parseInt(form.lessonId) : null,
        exam_type: form.examType,
        duration_minutes: parseInt(form.duration),
        passing_score: form.passingScore ? parseFloat(form.passingScore) : null,
        instructions: form.instructions.trim() || null,
        is_published: publish || form.isPublished,
        available_from: form.availableFrom
          ? new Date(form.availableFrom).toISOString()
          : null,
        available_until: form.availableUntil
          ? new Date(form.availableUntil).toISOString()
          : null,
        shuffle_questions: form.shuffleQuestions,
        shuffle_options: form.shuffleOptions,
        show_results_immediately: form.showResultsImmediately,
        allowed_attempts: parseInt(form.allowedAttempts) || 1,
      }

      let finalExamId = examId
      if (examId) {
        const { error: e } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', examId)
        if (e) throw e
        await supabase.from('exam_questions').delete().eq('exam_id', examId)
      } else {
        const { data, error: e } = await supabase
          .from('exams')
          .insert(examData as any)
          .select('id')
          .single()
        if (e) throw e
        finalExamId = (data as any).id
      }

      const questionsData = selectedQuestions.map((q, i) => ({
        exam_id: finalExamId,
        question_id: q.id,
        question_order: i + 1,
        points_override: q.points_override || null,
      }))
      const { error: qErr } = await supabase
        .from('exam_questions')
        .insert(questionsData as any)
      if (qErr) throw qErr

      setSaved(true)
      setTimeout(() => router.push('/admin/exams'), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (saved)
    return (
      <div className="animate-fade-in py-24 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="mb-2 text-2xl font-black text-slate-800">
          تم حفظ الاختبار بنجاح! 🎉
        </h3>
        <p className="text-slate-500">جاري التوجيه إلى قائمة الاختبارات...</p>
      </div>
    )

  const diffCounts = { easy: 0, medium: 0, hard: 0 }
  selectedQuestions.forEach((q) => {
    if (q.difficulty_level in diffCounts)
      (diffCounts as any)[q.difficulty_level]++
  })

  return (
    <div className="space-y-6">
      {/* ══ Wizard Progress Bar ══ */}
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => {
                  if (
                    s.id < step ||
                    (s.id === 2 && form.title && form.subjectId && form.gradeId)
                  )
                    setStep(s.id)
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  step === s.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : step > s.id
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'cursor-default border border-border bg-slate-50 text-slate-400'
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                {step > s.id && (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                )}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronLeft
                  className={`h-4 w-4 shrink-0 ${step > s.id ? 'text-emerald-400' : 'text-slate-300'}`}
                />
              )}
            </div>
          ))}
          {/* Total points badge */}
          {totalPoints > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
              <BarChart2 className="h-4 w-4" /> {totalPoints} درجة
            </div>
          )}
        </div>
      </div>

      {/* ══ Step 1: Settings ══ */}
      {step === 1 && (
        <ExamBuilderSettings
          form={form}
          onChange={setForm}
          subjects={subjects}
          grades={grades}
          semesters={semesters}
          units={units}
          lessons={lessons}
          totalPoints={totalPoints}
        />
      )}

      {/* ══ Step 2: Questions ══ */}
      {step === 2 && (
        <QuestionBankPanel
          form={form}
          onFormChange={setForm}
          bankQuestions={bankQuestions}
          selectedQuestions={selectedQuestions}
          loading={loadingQ}
          onAdd={addQuestion}
          onRemove={removeQuestion}
          onUpdatePoints={updatePoints}
          onAutoSelect={() => setIsAutoSelectOpen(true)}
        />
      )}

      {/* ══ Step 3: Review ══ */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white shadow-md">
              ٣
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">مراجعة ونشر</h2>
              <p className="text-sm text-slate-500">
                راجع ملخص الاختبار قبل الحفظ النهائي
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Summary card */}
            <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                ملخص الاختبار
              </h3>
              <div className="space-y-3">
                {[
                  ['العنوان', form.title || '—'],
                  [
                    'المادة',
                    subjects.find((s) => s.id.toString() === form.subjectId)
                      ?.name_ar || '—',
                  ],
                  [
                    'الصف',
                    grades.find((g) => g.id.toString() === form.gradeId)
                      ?.name_ar || '—',
                  ],
                  ['المدة', `${form.duration} دقيقة`],
                  ['عدد الأسئلة', `${selectedQuestions.length} سؤال`],
                  ['الدرجة الكلية', `${totalPoints} درجة`],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"
                  >
                    <span className="text-sm font-medium text-slate-500">
                      {label}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty distribution */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
                توزيع الصعوبة
              </h3>
              {selectedQuestions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  لا توجد أسئلة بعد
                </p>
              ) : (
                <div className="space-y-3">
                  {(['easy', 'medium', 'hard'] as const).map((d) => {
                    const count = diffCounts[d]
                    const pct = selectedQuestions.length
                      ? Math.round((count / selectedQuestions.length) * 100)
                      : 0
                    return (
                      <div key={d}>
                        <div className="mb-1 flex justify-between text-xs font-bold">
                          <span
                            className={`rounded border px-2 py-0.5 ${DIFF_COLOR[d]}`}
                          >
                            {DIFF_AR[d]}
                          </span>
                          <span className="text-slate-500">
                            {count} سؤال ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full transition-all ${d === 'easy' ? 'bg-emerald-400' : d === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Error ══ */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ══ Navigation + Actions ══ */}
      <div className="flex items-center gap-3 border-t border-border pt-2">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" /> السابق
          </button>
        ) : (
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-500 shadow-sm transition-colors hover:text-slate-800"
          >
            إلغاء
          </button>
        )}

        <div className="mr-auto flex gap-3">
          {step < 3 ? (
            <button
              onClick={() => {
                if (
                  step === 1 &&
                  (!form.title || !form.subjectId || !form.gradeId)
                ) {
                  setError('يرجى إدخال العنوان والمادة والصف أولاً')
                  return
                }
                setError('')
                setStep((s) => s + 1)
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              التالي <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ كمسودة
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                حفظ ونشر
              </button>
            </>
          )}
        </div>
      </div>

      {isAutoSelectOpen && (
        <AutoSelectModal
          availableQuestions={bankQuestions.filter(
            (q) => !selectedQuestions.find((s) => s.id === q.id)
          )}
          onAdd={handleAutoAdd}
          onClose={() => setIsAutoSelectOpen(false)}
        />
      )}
    </div>
  )
}
