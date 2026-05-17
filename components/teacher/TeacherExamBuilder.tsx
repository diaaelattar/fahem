'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2, Save, Eye, CheckCircle, ChevronLeft, ChevronRight, BarChart2, Users
} from 'lucide-react'
import { AutoSelectModal } from '@/components/admin/AutoSelectModal'
import { ExamBuilderSettings } from '@/components/admin/ExamBuilderSettings'
import { QuestionBankPanel } from '@/components/admin/QuestionBankPanel'
import type { QuestionItem, SelectedQuestion, ExamBuilderProps, ExamFormState } from '@/components/admin/ExamBuilderTypes'
import { DEFAULT_FORM, DIFF_AR, DIFF_COLOR } from '@/components/admin/ExamBuilderTypes'

const STEPS = [
  { id: 1, label: 'إعدادات الاختبار', icon: '⚙️' },
  { id: 2, label: 'اختيار الأسئلة',    icon: '📝' },
  { id: 3, label: 'مراجعة ونشر',       icon: '🚀' },
]

export interface TeacherExamBuilderProps extends ExamBuilderProps {
  teacherSubjectId: string
}

export function TeacherExamBuilder({
  subjects, grades, semesters, units, lessons, groups, examId, initialData, teacherSubjectId
}: TeacherExamBuilderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)

  const [form, setForm] = useState<ExamFormState>(() =>
    initialData ? {
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
      bankSearch: '', bankQuestionType: '', bankDifficulty: '',
    } : { ...DEFAULT_FORM, subjectId: teacherSubjectId }
  )

  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isAutoSelectOpen, setIsAutoSelectOpen] = useState(false)

  const totalPoints = selectedQuestions.reduce((s, q) => s + (q.points_override ?? q.points), 0)

  // ── Fetch questions — always scoped to teacher's subject ──
  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    let q = supabase
      .from('questions')
      .select('id, question_type, context_passage, question_text, difficulty_level, points, unit_id, lesson_id, subjects(name_ar,icon), grades(name_ar), units(name_ar), lessons(name_ar)')
      .eq('is_approved', true)
      .eq('subject_id', teacherSubjectId) // ALWAYS filter by teacher's subject
      .order('created_at', { ascending: false })
      .limit(200)

    if (form.gradeId)          q = q.eq('grade_id',         form.gradeId)
    if (form.unitId)           q = q.eq('unit_id',          form.unitId)
    if (form.lessonId)         q = q.eq('lesson_id',        form.lessonId)
    if (form.bankQuestionType) q = q.eq('question_type',    form.bankQuestionType)
    if (form.bankDifficulty)   q = q.eq('difficulty_level', form.bankDifficulty)
    if (form.bankSearch)       q = q.ilike('question_text', `%${form.bankSearch}%`)

    const { data } = await q
    setBankQuestions((data || []) as unknown as QuestionItem[])
    setLoadingQ(false)
  }, [form.gradeId, form.unitId, form.lessonId, form.bankQuestionType, form.bankDifficulty, form.bankSearch, teacherSubjectId, supabase])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  useEffect(() => {
    if (examId && initialData) {
      supabase.from('exam_questions')
        .select('question_id, question_order, points_override, questions(id,question_type,context_passage,question_text,difficulty_level,points,unit_id,lesson_id,subjects(name_ar,icon),grades(name_ar),units(name_ar),lessons(name_ar))')
        .eq('exam_id', examId)
        .order('question_order')
        .then(({ data }) => {
          if (data) setSelectedQuestions(data.map((eq: any) => ({
            ...eq.questions, order: eq.question_order, points_override: eq.points_override
          })))
        })
    }
  }, [examId])

  const addQuestion = (q: QuestionItem) => {
    if (selectedQuestions.find(s => s.id === q.id)) return
    setSelectedQuestions(prev => [...prev, { ...q, order: prev.length + 1 }])
  }

  const handleAutoAdd = (newQs: QuestionItem[]) => {
    setSelectedQuestions(prev => {
      const ids = new Set(prev.map(q => q.id))
      const toAdd = newQs.filter(q => !ids.has(q.id))
      return [...prev, ...toAdd.map((q, i) => ({ ...q, order: prev.length + i + 1 }))]
    })
  }

  const removeQuestion = (id: string) =>
    setSelectedQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i + 1 })))

  const validate = (): string => {
    if (!form.groupId)                   return 'يرجى اختيار المجموعة الدراسية'
    if (!form.title.trim())              return 'عنوان الاختبار مطلوب'
    if (!form.gradeId)                   return 'اختر الصف الدراسي'
    if (selectedQuestions.length === 0)  return 'أضف سؤالاً واحداً على الأقل'
    if (!form.duration || parseInt(form.duration) < 1) return 'مدة الاختبار يجب أن تكون أكبر من صفر'
    return ''
  }

  const handleSave = async (publish: boolean) => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
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
        available_from: form.availableFrom ? new Date(form.availableFrom).toISOString() : null,
        available_until: form.availableUntil ? new Date(form.availableUntil).toISOString() : null,
        shuffle_questions: form.shuffleQuestions,
        shuffle_options: form.shuffleOptions,
        show_results_immediately: form.showResultsImmediately,
        allowed_attempts: parseInt(form.allowedAttempts) || 1,
      }

      let finalExamId = examId
      if (examId) {
        const { error: e } = await supabase.from('exams').update(examData).eq('id', examId)
        if (e) throw e
        await supabase.from('exam_questions').delete().eq('exam_id', examId)
      } else {
        const { data, error: e } = await supabase.from('exams').insert(examData as any).select('id').single()
        if (e) throw e
        finalExamId = (data as any).id
      }

      const questionsData = selectedQuestions.map((q, i) => ({
        exam_id: finalExamId,
        question_id: q.id,
        question_order: i + 1,
        points_override: q.points_override || null,
      }))
      const { error: qErr } = await supabase.from('exam_questions').insert(questionsData as any)
      if (qErr) throw qErr

      setSaved(true)
      setTimeout(() => router.push('/teacher/exams'), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (saved) return (
    <div className="text-center py-24 animate-fade-in">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>
      <h3 className="text-2xl font-black mb-2 text-slate-800">تم حفظ الاختبار بنجاح! 🎉</h3>
      <p className="text-slate-500">جاري التوجيه إلى قائمة الاختباراتك...</p>
    </div>
  )

  const diffCounts = { easy: 0, medium: 0, hard: 0 }
  selectedQuestions.forEach(q => { if (q.difficulty_level in diffCounts) (diffCounts as any)[q.difficulty_level]++ })
  const selectedSubject = subjects.find(s => s.id.toString() === teacherSubjectId)
  const selectedGroup = groups?.find(g => g.id.toString() === form.groupId)

  return (
    <div className="space-y-6">

      {/* ══ Wizard Progress Bar ══ */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => { if (s.id < step) setStep(s.id) }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${
                  step === s.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : step > s.id
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border border-border cursor-default'
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                {step > s.id && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronLeft className={`w-4 h-4 shrink-0 ${step > s.id ? 'text-emerald-400' : 'text-slate-300'}`} />
              )}
            </div>
          ))}
          {totalPoints > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl text-sm font-black border border-indigo-200 shrink-0">
              <BarChart2 className="w-4 h-4" /> {totalPoints} درجة
            </div>
          )}
        </div>
      </div>

      {/* Subject Lock Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3 flex items-center gap-3">
        <span className="text-xl">{(selectedSubject as any)?.icon || '📚'}</span>
        <div>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">مادتك التخصصية</p>
          <p className="font-black text-indigo-800">{selectedSubject?.name_ar || '—'}</p>
        </div>
        <span className="mr-auto text-xs bg-indigo-100 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold">
          مقفل — فلاتر بنك الأسئلة مرتبطة بها تلقائياً
        </span>
      </div>

      {/* ══ Step 1 ══ */}
      {step === 1 && (
        <ExamBuilderSettings
          form={form} onChange={setForm}
          subjects={subjects} grades={grades}
          semesters={semesters} units={units} lessons={lessons}
          groups={groups} totalPoints={totalPoints}
          lockedSubjectId={teacherSubjectId}
        />
      )}

      {/* ══ Step 2 ══ */}
      {step === 2 && (
        <QuestionBankPanel
          form={form} onFormChange={setForm}
          bankQuestions={bankQuestions}
          selectedQuestions={selectedQuestions}
          loading={loadingQ}
          onAdd={addQuestion}
          onRemove={removeQuestion}
          onUpdatePoints={(id, pts) => setSelectedQuestions(prev => prev.map(q => q.id === id ? { ...q, points_override: pts } : q))}
          onAutoSelect={() => setIsAutoSelectOpen(true)}
        />
      )}

      {/* ══ Step 3 ══ */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-black flex items-center justify-center shadow-md">٣</div>
            <div>
              <h2 className="font-black text-slate-800 text-lg">مراجعة ونشر</h2>
              <p className="text-sm text-slate-500">راجع ملخص الاختبار قبل الإرسال لمجموعتك</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider">ملخص الاختبار</h3>
              {[
                ['العنوان', form.title || '—'],
                ['المادة', selectedSubject?.name_ar || '—'],
                ['الصف', grades.find(g => g.id.toString() === form.gradeId)?.name_ar || '—'],
                ['المجموعة', selectedGroup ? `👥 ${selectedGroup.name_ar}` : '—'],
                ['المدة', `${form.duration} دقيقة`],
                ['عدد الأسئلة', `${selectedQuestions.length} سؤال`],
                ['الدرجة الكلية', `${totalPoints} درجة`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500 font-medium">{label}</span>
                  <span className="text-sm font-bold text-slate-800">{val}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider mb-4">توزيع الصعوبة</h3>
              <div className="space-y-3">
                {(['easy', 'medium', 'hard'] as const).map(d => {
                  const count = diffCounts[d]
                  const pct = selectedQuestions.length ? Math.round((count / selectedQuestions.length) * 100) : 0
                  return (
                    <div key={d}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className={`px-2 py-0.5 rounded border ${DIFF_COLOR[d]}`}>{DIFF_AR[d]}</span>
                        <span className="text-slate-500">{count} سؤال ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
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
        </div>
      )}

      {/* ══ Error ══ */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* ══ Navigation ══ */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm hover:bg-slate-50">
            <ChevronRight className="w-4 h-4" /> السابق
          </button>
        ) : (
          <button onClick={() => router.back()}
            className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm hover:bg-slate-50">
            إلغاء
          </button>
        )}

        <div className="mr-auto flex gap-3">
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1) {
                  if (!form.groupId)    { setError('يرجى اختيار المجموعة أولاً'); return }
                  if (!form.title)     { setError('يرجى إدخال عنوان الاختبار'); return }
                  if (!form.gradeId)   { setError('يرجى اختيار الصف الدراسي'); return }
                }
                setError('')
                setStep(s => s + 1)
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-indigo-200"
            >
              التالي <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ كمسودة
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-emerald-200 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                نشر للمجموعة
              </button>
            </>
          )}
        </div>
      </div>

      {isAutoSelectOpen && (
        <AutoSelectModal
          availableQuestions={bankQuestions.filter(q => !selectedQuestions.find(s => s.id === q.id))}
          onAdd={handleAutoAdd}
          onClose={() => setIsAutoSelectOpen(false)}
        />
      )}
    </div>
  )
}
