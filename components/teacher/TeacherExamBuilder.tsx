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
  Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AutoSelectModal } from '@/components/admin/AutoSelectModal'
import { ExamBuilderSettings } from '@/components/admin/ExamBuilderSettings'
import { QuestionBankPanel } from '@/components/admin/QuestionBankPanel'
import { AIQuestionGeneratorModal } from '@/components/teacher/AIQuestionGeneratorModal'
import type {
  QuestionItem,
  SelectedQuestion,
  ExamBuilderProps,
  ExamFormState,
} from '@/components/admin/ExamBuilderTypes'
import {
  DEFAULT_FORM,
  DIFF_AR,
  DIFF_COLOR,
} from '@/components/admin/ExamBuilderTypes'

const STEPS = [
  { id: 1, label: 'إعدادات الاختبار', icon: '⚙️' },
  { id: 2, label: 'اختيار الأسئلة', icon: '📝' },
  { id: 3, label: 'مراجعة ونشر', icon: '🚀' },
]

export interface TeacherExamBuilderProps extends ExamBuilderProps {
  teacherSubjectId: string
}

export function TeacherExamBuilder({
  subjects,
  grades,
  semesters,
  units,
  lessons,
  groups,
  examId,
  initialData,
  teacherSubjectId,
}: TeacherExamBuilderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)

  const [form, setForm] = useState<ExamFormState>(() =>
    initialData
      ? {
          title: initialData.title || '',
          description: initialData.description || '',
          // Subject is LOCKED to teacher's subject
          subjectId: teacherSubjectId,
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
          groupId: initialData.group_id?.toString() || '',
          bankSearch: '',
          bankQuestionType: '',
          bankDifficulty: '',
        }
      : { ...DEFAULT_FORM, subjectId: teacherSubjectId }
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
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preSelected = sessionStorage.getItem('pre_selected_exam_questions')
      if (preSelected) {
        try {
          const qs = JSON.parse(preSelected)
          if (qs && qs.length > 0) {
            const mapped = qs.map((q: any, i: number) => ({
              ...q,
              order: i + 1,
              points_override: q.points,
            }))
            setSelectedQuestions(mapped)
            sessionStorage.removeItem('pre_selected_exam_questions')
          }
        } catch (e) {
          console.error('Failed to parse pre-selected questions', e)
        }
      }
    }
  }, [])

  const totalPoints = selectedQuestions.reduce(
    (s, q) => s + (q.points_override ?? q.points),
    0
  )

  // ── Fetch questions — always scoped to teacher's subject ──
  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    try {
      let q = supabase
        .from('questions')
        .select(
          'id, question_type, context_passage, question_text, difficulty_level, points, unit_id, lesson_id, subjects(name_ar,icon), grades(name_ar), units(name_ar), lessons(name_ar)'
        )
        .or('is_approved.eq.true,status.eq.approved') // either approved flag or approved status
        .eq('subject_id', teacherSubjectId) // ALWAYS scoped to teacher's subject
        .order('created_at', { ascending: false })
        .limit(200)

      if (form.gradeId) q = q.eq('grade_id', form.gradeId)
      if (form.unitId) q = q.eq('unit_id', form.unitId)
      if (form.lessonId) q = q.eq('lesson_id', form.lessonId)
      if (form.bankQuestionType)
        q = q.eq('question_type', form.bankQuestionType)
      if (form.bankDifficulty) q = q.eq('difficulty_level', form.bankDifficulty)
      if (form.bankSearch) q = q.ilike('question_text', `%${form.bankSearch}%`)

      const { data, error: qErr } = await q
      if (qErr) console.error('[TeacherExamBuilder] loadQuestions error:', qErr)
      setBankQuestions((data || []) as unknown as QuestionItem[])
    } catch (e) {
      console.error('[TeacherExamBuilder] unexpected error:', e)
    } finally {
      setLoadingQ(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.gradeId,
    form.unitId,
    form.lessonId,
    form.bankQuestionType,
    form.bankDifficulty,
    form.bankSearch,
    teacherSubjectId,
  ])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

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
    if (selectedQuestions.find((sq) => sq.id === q.id)) return
    setSelectedQuestions((prev) => [
      ...prev,
      { ...q, order: prev.length + 1, points_override: q.points },
    ])
  }

  const addAIQuestions = (questions: any[]) => {
    setSelectedQuestions((prev) => [
      ...prev,
      ...questions.map((q, i) => ({
        ...q,
        order: prev.length + i + 1,
        points_override: q.points,
      })),
    ])
  }

  const handleAutoAdd = (newQs: QuestionItem[]) => {
    setSelectedQuestions((prev) => {
      const ids = new Set(prev.map((q) => q.id))
      const toAdd = newQs.filter((q) => !ids.has(q.id))
      return [
        ...prev,
        ...toAdd.map((q, i) => ({
          ...q,
          order: prev.length + i + 1,
          points_override: q.points,
        })),
      ]
    })
  }

  const removeQuestion = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال من الاختبار؟')) {
      setSelectedQuestions((prev) =>
        prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i + 1 }))
      )
    }
  }

  const validate = (): string => {
    if (!form.groupId) return 'يرجى اختيار المجموعة الدراسية'
    if (!form.title.trim()) return 'عنوان الاختبار مطلوب'
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
        teacher_id: user.id,
        group_id: form.groupId,
        visibility: 'private',
        title: form.title.trim(),
        description: form.description.trim() || null,
        subject_id: parseInt(teacherSubjectId),
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
      setTimeout(() => router.push('/teacher/exams'), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (saved)
    return (
      <div className="animate-fade-in py-24 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="mb-2 text-2xl font-black text-slate-800">
          تم حفظ الاختبار بنجاح! 🎉
        </h3>
        <p className="text-slate-500">جاري التوجيه إلى قائمة الاختباراتك...</p>
      </div>
    )

  const diffCounts = { easy: 0, medium: 0, hard: 0 }
  selectedQuestions.forEach((q) => {
    if (q.difficulty_level in diffCounts)
      (diffCounts as any)[q.difficulty_level]++
  })
  const selectedSubject = subjects.find(
    (s) => s.id.toString() === teacherSubjectId
  )
  const selectedGroup = groups?.find((g) => g.id.toString() === form.groupId)

  return (
    <div className="space-y-6">
      {/* ══ Wizard Progress Bar ══ */}
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => {
                  if (s.id < step) setStep(s.id)
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  step === s.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
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
          {totalPoints > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-black text-indigo-700">
              <BarChart2 className="h-4 w-4" /> {totalPoints} درجة
            </div>
          )}
        </div>
      </div>

      {/* Subject Lock Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3">
        <span className="text-xl">
          {(selectedSubject as any)?.icon || '📚'}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
            مادتك التخصصية
          </p>
          <p className="font-black text-indigo-800">
            {selectedSubject?.name_ar || '—'}
          </p>
        </div>
        <span className="mr-auto rounded-lg border border-indigo-200 bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-600">
          مقفل — فلاتر بنك الأسئلة مرتبطة بها تلقائياً
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ══ Step 1 ══ */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            <ExamBuilderSettings
              form={form}
              onChange={setForm}
              subjects={subjects}
              grades={grades}
              semesters={semesters}
              units={units}
              lessons={lessons}
              groups={groups}
              totalPoints={totalPoints}
              lockedSubjectId={teacherSubjectId}
            />
          </motion.div>
        )}

        {/* ══ Step 2 ══ */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            <QuestionBankPanel
              form={form}
              onFormChange={setForm}
              bankQuestions={bankQuestions}
              selectedQuestions={selectedQuestions}
              loading={loadingQ}
              onAdd={addQuestion}
              onRemove={removeQuestion}
              onUpdatePoints={(id, pts) =>
                setSelectedQuestions((prev) =>
                  prev.map((q) =>
                    q.id === id ? { ...q, points_override: pts } : q
                  )
                )
              }
              onAutoSelect={() => setIsAutoSelectOpen(true)}
              onAIGenerate={() => setIsAIModalOpen(true)}
            />
          </motion.div>
        )}

        {/* ══ Step 3 ══ */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white shadow-md">
                ٣
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  مراجعة ونشر
                </h2>
                <p className="text-sm text-slate-500">
                  راجع ملخص الاختبار قبل الإرسال لمجموعتك
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  ملخص الاختبار
                </h3>
                {[
                  ['العنوان', form.title || '—'],
                  ['المادة', selectedSubject?.name_ar || '—'],
                  [
                    'الصف',
                    grades.find((g) => g.id.toString() === form.gradeId)
                      ?.name_ar || '—',
                  ],
                  [
                    'المجموعة',
                    selectedGroup ? `👥 ${selectedGroup.name_ar}` : '—',
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

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
                  توزيع الصعوبة
                </h3>
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
                            className={`h-2 rounded-full ${d === 'easy' ? 'bg-emerald-400' : d === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Error ══ */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {/* ══ Navigation ══ */}
      <div className="flex items-center gap-3 border-t border-border pt-2">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" /> السابق
          </button>
        ) : (
          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من إلغاء إنشاء/تعديل هذا الاختبار؟ سيتم فقدان أي تغييرات غير محفوظة.')) {
                router.back()
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-500 shadow-sm hover:bg-slate-50"
          >
            إلغاء
          </button>
        )}

        <div className="mr-auto flex gap-3">
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1) {
                  if (!form.groupId) {
                    setError('يرجى اختيار المجموعة أولاً')
                    return
                  }
                  if (!form.title) {
                    setError('يرجى إدخال عنوان الاختبار')
                    return
                  }
                  if (!form.gradeId) {
                    setError('يرجى اختيار الصف الدراسي')
                    return
                  }
                }
                setError('')
                setStep((s) => s + 1)
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            >
              التالي <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-60"
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
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                نشر للمجموعة
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

      {isAIModalOpen && (
        <AIQuestionGeneratorModal
          onClose={() => setIsAIModalOpen(false)}
          onAddQuestions={addAIQuestions}
          subjectId={teacherSubjectId}
          gradeId={form.gradeId}
        />
      )}
    </div>
  )
}
