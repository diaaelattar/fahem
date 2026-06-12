'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import {
  BookOpen,
  BookText,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  AlertCircle,
} from 'lucide-react'

// ─── أنواع الأقسام ────────────────────────────────────────────────────────────
const SECTION_TYPES = [
  { value: 'intro', label: 'مقدمة الدرس', color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
  { value: 'content', label: 'نص الدرس الأصلي', color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
  { value: 'vocabulary', label: 'مفردات وكلمات', color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
  { value: 'rules', label: 'قواعد وأساسيات', color: 'text-violet-600', bg: 'bg-violet-50/50', border: 'border-violet-100' },
  { value: 'examples', label: 'أمثلة مشروحة', color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
  { value: 'summary', label: 'ملخص الدرس', color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
] as const

type SectionType = typeof SECTION_TYPES[number]['value']

interface Section {
  id: string // مؤقت للواجهة
  section_type: SectionType
  title: string
  body: string
}

interface Exercise {
  id?: string
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay'
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string
  difficulty_level: 'easy' | 'medium' | 'hard'
  sort_order: number
  source: 'teacher' | 'ai_generated'
}

interface Props {
  lessonId: number
  lessonName: string
  initialSections: Section[]
  initialExercises: Exercise[]
  currentStatus: 'draft' | 'published'
}

const genId = () => Math.random().toString(36).slice(2, 9)

export function LessonContentEditor({
  lessonId,
  lessonName,
  initialSections,
  initialExercises,
  currentStatus,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ─── حالة الأقسام ─────────────────────────────────────────────────────────
  const [sections, setSections] = useState<Section[]>(
    initialSections.length > 0
      ? initialSections.map((s: any) => ({ ...s, id: s.id ?? genId() }))
      : [{ id: genId(), section_type: 'content', title: '', body: '' }]
  )

  // ─── حالة التدريبات ───────────────────────────────────────────────────────
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'exercises'>('content')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const [confirmData, setConfirmData] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)
  const confirmModalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(confirmModalRef, !!confirmData, () => setConfirmData(null))

  // ─── إضافة قسم جديد ───────────────────────────────────────────────────────
  function addSection(type: SectionType = 'content') {
    setSections((prev) => [...prev, { id: genId(), section_type: type, title: '', body: '' }])
  }

  function removeSection(id: string) {
    setConfirmData({
      message: 'هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: () => {
        setSections((prev) => prev.filter((s) => s.id !== id))
      },
    })
  }

  function updateSection(id: string, field: keyof Section, value: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  function moveSection(id: string, direction: 'up' | 'down') {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (direction === 'up' && idx === 0) return prev
      if (direction === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swapWith = direction === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
      return next
    })
  }

  // ─── توليد تدريبات بالذكاء الاصطناعي ─────────────────────────────────────
  async function generateAiExercises() {
    const allText = sections.map((s) => s.body).join('\n\n')
    if (allText.trim().length < 30) {
      setAiError('يرجى كتابة محتوى الدرس أولاً قبل توليد التدريبات')
      return
    }

    setAiGenerating(true)
    setAiError(null)

    try {
      const res = await fetch('/api/ai/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lessonText: allText,
          exerciseCount: 5,
          questionTypes: ['mcq', 'true_false', 'fill_blank'],
          difficultyLevel: 'medium',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطأ في التوليد')

      setExercises((prev) => [
        ...prev,
        ...data.exercises.map((ex: any) => ({ ...ex, id: undefined })),
      ])
      setActiveTab('exercises')
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setAiGenerating(false)
    }
  }

  // ─── حفظ المحتوى ──────────────────────────────────────────────────────────
  async function handleSave(action: 'draft' | 'publish') {
    setSaving(true)
    setSaveMsg(null)

    try {
      const res = await fetch(`/api/teacher/lessons/${lessonId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sections.filter((s) => s.body.trim().length > 0),
          exercises: exercises.filter((ex) => !ex.id), // فقط التدريبات الجديدة (بدون id)
          action,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل الحفظ')
      }

      setSaveMsg(action === 'publish' ? 'تم النشر بنجاح!' : 'تم الحفظ كمسودة')
      setTimeout(() => {
        startTransition(() => router.refresh())
        setSaveMsg(null)
      }, 1500)
    } catch (err: any) {
      setSaveMsg('خطأ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── حذف تدريب ────────────────────────────────────────────────────────────
  async function removeExercise(idx: number, exId?: string) {
    setConfirmData({
      message: 'هل أنت متأكد من حذف هذا التدريب؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        if (exId) {
          await fetch(`/api/teacher/lessons/${lessonId}/exercises/${exId}`, {
            method: 'DELETE',
          })
        }
        setExercises((prev) => prev.filter((_, i) => i !== idx))
      },
    })
  }

  const getSectionMeta = (type: string) =>
    SECTION_TYPES.find((t) => t.value === type) ?? SECTION_TYPES[1]

  return (
    <div className="space-y-6">
      {/* رسالة الحفظ */}
      {saveMsg && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-bold border ${
            saveMsg.startsWith('خطأ')
              ? 'bg-rose-50 border-rose-100 text-rose-700'
              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}
        >
          {saveMsg}
        </div>
      )}

      {/* تبويبات */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {[
          { key: 'content', label: 'أقسام الدرس', icon: BookText },
          { key: 'exercises', label: `التدريبات (${exercises.length})`, icon: Brain },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-all ${
              activeTab === key
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── تبويب أقسام الدرس ─────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {sections.map((section, idx) => {
            const meta = getSectionMeta(section.section_type)
            return (
              <div
                key={section.id}
                className={`rounded-2xl border ${meta.border} ${meta.bg} p-5 transition-all shadow-sm bg-white`}
              >
                {/* رأس القسم */}
                <div className="mb-4 flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-slate-400" />

                  <select
                    value={section.section_type}
                    onChange={(e) =>
                      updateSection(section.id, 'section_type', e.target.value)
                    }
                    className={`rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold ${meta.color} focus:border-indigo-300 focus:outline-none shadow-sm`}
                  >
                    {SECTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="عنوان القسم (اختياري)"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none shadow-sm"
                  />

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={idx === 0}
                      className="rounded p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={idx === sections.length - 1}
                      className="rounded p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* محتوى القسم */}
                <textarea
                  dir="rtl"
                  placeholder={
                    section.section_type === 'content'
                      ? 'اكتب نص الدرس الأصلي هنا...'
                      : section.section_type === 'vocabulary'
                      ? 'مثال: الكرم: السخاء والعطاء\nالشجاعة: الإقدام والجرأة'
                      : 'اكتب محتوى هذا القسم...'
                  }
                  value={section.body}
                  onChange={(e) => updateSection(section.id, 'body', e.target.value)}
                  rows={6}
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none shadow-sm"
                />
                <div className="mt-1 text-left text-xs text-slate-400">
                  {section.body.length} حرف
                </div>
              </div>
            )
          })}

          {/* أزرار إضافة أقسام */}
          <div className="flex flex-wrap gap-2">
            {SECTION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => addSection(t.value)}
                className={`flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold ${t.color} hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm`}
              >
                <Plus className="h-3 w-3" />
                {t.label}
              </button>
            ))}
          </div>

          {/* زر توليد التدريبات بالذكاء الاصطناعي */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  توليد تدريبات بالذكاء الاصطناعي
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  سيقرأ الذكاء الاصطناعي نص الدرس ويميز بين النص الأصلي والمقدمات ويولد تدريبات هادفة
                </p>
              </div>
              <button
                onClick={generateAiExercises}
                disabled={aiGenerating}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-100"
              >
                {aiGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiGenerating ? 'جاري التوليد...' : 'توليد تلقائي'}
              </button>
            </div>
            {aiError && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                {aiError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── تبويب التدريبات ──────────────────────────────────────────────────── */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          {exercises.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
              <Brain className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-bold text-slate-500">لا توجد تدريبات بعد</p>
              <p className="mt-1 text-xs text-slate-400">
                استخدم زر التوليد بالذكاء الاصطناعي أو أضف تدريبات يدوياً
              </p>
              <button
                onClick={() => setActiveTab('content')}
                className="mt-4 flex items-center gap-2 mx-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100"
              >
                <Sparkles className="h-4 w-4" />
                اذهب لتوليد التدريبات
              </button>
            </div>
          ) : (
            exercises.map((ex, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          ex.question_type === 'mcq'
                            ? 'text-indigo-600'
                            : ex.question_type === 'true_false'
                            ? 'text-emerald-600'
                            : ex.question_type === 'fill_blank'
                            ? 'text-amber-600'
                            : 'text-violet-600'
                        }`}
                      >
                        {ex.question_type === 'mcq'
                          ? 'اختيار من متعدد'
                          : ex.question_type === 'true_false'
                          ? 'صح أو خطأ'
                          : ex.question_type === 'fill_blank'
                          ? 'أكمل الفراغ'
                          : 'سؤال مقالي'}
                      </span>
                      {ex.source === 'ai_generated' && (
                        <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          ex.difficulty_level === 'easy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : ex.difficulty_level === 'hard'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {ex.difficulty_level === 'easy'
                          ? 'سهل'
                          : ex.difficulty_level === 'hard'
                          ? 'صعب'
                          : 'متوسط'}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-800">{ex.question_text}</p>

                    {ex.options && ex.options.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {ex.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`rounded-xl px-3 py-1.5 text-xs ${
                              opt === ex.correct_answer
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold'
                                : 'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}
                          >
                            {opt === ex.correct_answer && '✓ '}
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {ex.question_type !== 'mcq' && (
                      <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs text-emerald-700 font-bold">
                        الإجابة: {ex.correct_answer}
                      </div>
                    )}

                    {ex.explanation && (
                      <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                        💡 {ex.explanation}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeExercise(idx, ex.id)}
                    className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── شريط الحفظ ─────────────────────────────────────────────────────── */}
      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-white/95 px-6 py-4 shadow-lg backdrop-blur-sm">
        <div className="text-xs text-slate-500 font-medium">
          {sections.filter((s) => s.body.trim()).length} أقسام •{' '}
          {exercises.length} تدريب
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ مسودة
          </button>
          <button
            onClick={() => handleSave('publish')}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-100"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            نشر للطلاب
          </button>
        </div>
      </div>

      {/* مودال التأكيد الموحد للعمليات الحرجة */}
      {confirmData && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            ref={confirmModalRef}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
              <AlertCircle className="h-6 w-6 text-amber-500" aria-hidden="true" />
            </div>
            
            <div className="space-y-2">
              <h3 id="confirm-modal-title" className="text-base font-extrabold text-slate-800">تأكيد الإجراء</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{confirmData.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmData(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  confirmData.onConfirm()
                  setConfirmData(null)
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-600/10"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
