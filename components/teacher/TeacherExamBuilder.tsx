'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, BookOpen, Save, Eye, CheckCircle, GripVertical, BarChart2, Sparkles } from 'lucide-react'
import { QuestionFilterSidebar, type QuestionFilters } from '@/components/admin/QuestionFilterSidebar'
import { AutoSelectModal } from '@/components/admin/AutoSelectModal'
import { ExamSummaryStats } from '@/components/admin/ExamSummaryStats'
import { ExamBuilderSettings } from '@/components/admin/ExamBuilderSettings'
import type { QuestionItem, SelectedQuestion, ExamBuilderProps, ExamFormState } from '@/components/admin/ExamBuilderTypes'
import { TYPE_AR, DIFF_AR, DIFF_COLOR } from '@/components/admin/ExamBuilderTypes'

const DEFAULT_FORM: ExamFormState = {
  title: '', description: '', subjectId: '', gradeId: '', semesterId: '',
  unitId: '', lessonId: '', examType: 'partial', duration: '30',
  passingScore: '', instructions: '', isPublished: false,
  availableFrom: '', availableUntil: '', shuffleQuestions: true,
  shuffleOptions: true, showResultsImmediately: true, allowedAttempts: '1',
  groupId: ''
}

export interface TeacherExamBuilderProps extends ExamBuilderProps {
  teacherSubjectId: string
}

export function TeacherExamBuilder({ subjects, grades, semesters, units, lessons, groups, examId, initialData, teacherSubjectId }: TeacherExamBuilderProps) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<ExamFormState>(() =>
    initialData ? {
      title: initialData.title || '',
      description: initialData.description || '',
      subjectId: initialData.subject_id?.toString() || teacherSubjectId,
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
    } : { ...DEFAULT_FORM, subjectId: teacherSubjectId }
  )

  const [filters, setFilters] = useState<QuestionFilters>({
    search: '', gradeId: '', subjectId: '', semesterId: '',
    unitId: '', lessonId: '', questionType: '', difficulty: '',
  })

  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isAutoSelectOpen, setIsAutoSelectOpen] = useState(false)

  const totalPoints = selectedQuestions.reduce((s, q) => s + (q.points_override ?? q.points), 0)

  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    let q = supabase
      .from('questions')
      .select('id, question_type, context_passage, question_text, difficulty_level, points, unit_id, lesson_id, subjects(name_ar,icon), grades(name_ar), units(name_ar), lessons(name_ar)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(150)

    if (filters.gradeId)      q = q.eq('grade_id', filters.gradeId)
    if (filters.subjectId)    q = q.eq('subject_id', filters.subjectId)
    if (filters.unitId)       q = q.eq('unit_id', filters.unitId)
    if (filters.lessonId)     q = q.eq('lesson_id', filters.lessonId)
    if (filters.questionType) q = q.eq('question_type', filters.questionType)
    if (filters.difficulty)   q = q.eq('difficulty_level', filters.difficulty)
    if (filters.search)       q = q.ilike('question_text', `%${filters.search}%`)

    const { data } = await q
    setBankQuestions((data || []) as unknown as QuestionItem[])
    setLoadingQ(false)
  }, [filters, supabase])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  useEffect(() => {
    if (examId && initialData) {
      supabase.from('exam_questions')
        .select('question_id, question_order, points_override, questions(id,question_type,context_passage,question_text,difficulty_level,points,unit_id,lesson_id,subjects(name_ar,icon),grades(name_ar))')
        .eq('exam_id', examId)
        .order('question_order')
        .then(({ data }) => {
          if (data) setSelectedQuestions(data.map((eq: any) => ({ ...eq.questions, order: eq.question_order, points_override: eq.points_override })))
        })
    }
  }, [examId])

  const addQuestion = (q: QuestionItem) => {
    if (selectedQuestions.find(s => s.id === q.id)) return
    setSelectedQuestions(prev => [...prev, { ...q, order: prev.length + 1 }])
  }

  const handleAutoAdd = (newQuestions: QuestionItem[]) => {
    setSelectedQuestions(prev => {
      const currentIds = new Set(prev.map(q => q.id))
      const toAdd = newQuestions.filter(q => !currentIds.has(q.id))
      return [...prev, ...toAdd.map((q, i) => ({ ...q, order: prev.length + i + 1 }))]
    })
  }

  const removeQuestion = (id: string) =>
    setSelectedQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i + 1 })))

  const updatePoints = (id: string, pts: number) =>
    setSelectedQuestions(prev => prev.map(q => q.id === id ? { ...q, points_override: pts } : q))

  const handleSave = async (publish: boolean) => {
    if (!form.groupId)                    { setError('يرجى اختيار المجموعة الدراسية'); return }
    if (!form.title.trim())               { setError('العنوان مطلوب'); return }
    if (!form.subjectId)                  { setError('اختر المادة الدراسية'); return }
    if (!form.gradeId)                    { setError('اختر الصف الدراسي'); return }
    if (selectedQuestions.length === 0)   { setError('أضف سؤالاً واحداً على الأقل'); return }
    if (!form.duration || parseInt(form.duration) < 1) { setError('مدة الاختبار يجب أن تكون أكبر من صفر'); return }

    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const examData = {
        teacher_id: user.id, // <-- KEY DIFFERENCE: TEACHER ID
        group_id: form.groupId, // <-- KEY DIFFERENCE: GROUP ID
        visibility: 'private', // <-- KEY DIFFERENCE: PRIVATE VISIBILITY
        
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

  const availableInBank = bankQuestions.filter(q => !selectedQuestions.find(s => s.id === q.id))

  if (saved) return (
    <div className="text-center py-20 animate-fade-in">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-9 h-9 text-emerald-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">تم حفظ الاختبار بنجاح! 🎉</h3>
      <p className="text-slate-500 text-sm">جاري التوجيه إلى قائمة الاختبارات...</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex border-b border-border gap-1 bg-white p-2 rounded-t-2xl shadow-sm">
        {(['settings', 'questions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-bold rounded-xl transition-colors ${
              activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}>
            {tab === 'settings' ? '⚙️ إعدادات الاختبار' : `📝 الأسئلة (${selectedQuestions.length})`}
          </button>
        ))}
        {totalPoints > 0 && (
          <div className="mr-auto flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-sm text-emerald-700 font-bold border border-emerald-100">
            <BarChart2 className="w-4 h-4" />
            الدرجة الكلية: <span>{totalPoints}</span>
          </div>
        )}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <ExamBuilderSettings
          form={form} onChange={setForm}
          subjects={subjects.filter(s => s.id.toString() === teacherSubjectId)}
          grades={grades} semesters={semesters}
          units={units} lessons={lessons} groups={groups} totalPoints={totalPoints}
        />
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Filter Sidebar */}
          <div className="space-y-4">
            <QuestionFilterSidebar
              filters={filters} onChange={setFilters}
              grades={grades} subjects={subjects} semesters={semesters}
              units={units} lessons={lessons}
              totalShown={availableInBank.length} totalInBank={bankQuestions.length}
            />
            <ExamSummaryStats questions={selectedQuestions} durationMinutes={parseInt(form.duration) || 0} />
          </div>

          {/* Bank */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-slate-800">بنك الأسئلة المركزي</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{availableInBank.length} سؤال متاح</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
              {loadingQ ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                 <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                 <span className="font-bold text-sm">جاري جلب الأسئلة...</span>
               </div>
              ) : availableInBank.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500 px-4">
                  {bankQuestions.length === 0 ? 'لا توجد أسئلة معتمدة' : 'جميع الأسئلة مضافة أو لا توجد نتائج مطابقة'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {availableInBank.map(q => (
                    <div key={q.id} className="p-3 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{TYPE_AR[q.question_type]}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[q.difficulty_level]}`}>{DIFF_AR[q.difficulty_level]}</span>
                            {(q.units as any)?.name_ar && (
                              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">{(q.units as any).name_ar}</span>
                            )}
                            {(q.lessons as any)?.name_ar && (
                              <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100">{(q.lessons as any).name_ar}</span>
                            )}
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{q.points} درجة</span>
                          </div>
                          {q.context_passage && (
                            <div className="mb-1 text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100 line-clamp-1 italic font-medium">القطعة: {q.context_passage}</div>
                          )}
                          <p className="text-sm font-medium leading-relaxed line-clamp-2 text-slate-800" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                        </div>
                        <button onClick={() => addQuestion(q)}
                          className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-indigo-600 flex items-center justify-center transition-all shadow-sm">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold flex items-center gap-2 text-slate-800">
                  أسئلة الاختبار الخاص بك
                </h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAutoSelectOpen(true)}
                  disabled={availableInBank.length === 0}
                  className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" /> توليد عشوائي
                </button>
                {selectedQuestions.length > 0 && (
                  <button onClick={() => setSelectedQuestions([])} className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-lg transition-colors border border-rose-100">مسح</button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 520 }}>
              {selectedQuestions.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">اختر الأسئلة من البنك لإضافتها هنا</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedQuestions.map((q, i) => (
                    <div key={q.id} className="p-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-1 shrink-0 cursor-grab hover:text-slate-500" />
                        <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          {q.context_passage && (
                            <div className="mb-1 text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100 line-clamp-2 italic font-medium">القطعة: {q.context_passage}</div>
                          )}
                          <p className="text-sm font-medium leading-snug line-clamp-2 mb-2 text-slate-800" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 w-fit">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[q.difficulty_level]}`}>{DIFF_AR[q.difficulty_level]}</span>
                            <span className="text-[10px] font-bold text-slate-500 ml-1">تعديل الدرجة:</span>
                            <input type="number" min={1} max={20}
                              value={q.points_override ?? q.points}
                              onChange={e => updatePoints(q.id, parseInt(e.target.value) || q.points)}
                              className="w-12 px-1 py-0.5 border border-slate-200 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white font-bold text-slate-700" />
                          </div>
                        </div>
                        <button onClick={() => removeQuestion(q.id)}
                          className="shrink-0 p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 text-slate-400 rounded-lg transition-colors shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-bold shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button onClick={() => router.back()} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm">
          إلغاء
        </button>
        <div className="mr-auto flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ كمسودة
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-emerald-200 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            حفظ ونشر للاختبار
          </button>
        </div>
      </div>

      {isAutoSelectOpen && (
        <AutoSelectModal 
          availableQuestions={availableInBank}
          onAdd={handleAutoAdd}
          onClose={() => setIsAutoSelectOpen(false)}
        />
      )}
    </div>
  )
}
