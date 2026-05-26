'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  X,
} from 'lucide-react'

// ─── أنواع الأقسام ────────────────────────────────────────────────────────────
const SECTION_TYPES = [
  { value: 'intro', label: 'مقدمة الدرس', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { value: 'content', label: 'نص الدرس الأصلي', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  { value: 'vocabulary', label: 'مفردات وكلمات', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { value: 'rules', label: 'قواعد وأساسيات', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  { value: 'examples', label: 'أمثلة مشروحة', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { value: 'summary', label: 'ملخص الدرس', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
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

  // ─── إضافة قسم جديد ───────────────────────────────────────────────────────
  function addSection(type: SectionType = 'content') {
    setSections((prev) => [...prev, { id: genId(), section_type: type, title: '', body: '' }])
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id))
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
    if (exId) {
      await fetch(`/api/teacher/lessons/${lessonId}/exercises/${exId}`, {
        method: 'DELETE',
      })
    }
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  const getSectionMeta = (type: string) =>
    SECTION_TYPES.find((t) => t.value === type) ?? SECTION_TYPES[1]

  return (
    <div className="space-y-6">
      {/* رسالة الحفظ */}
      {saveMsg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            saveMsg.startsWith('خطأ')
              ? 'bg-rose-500/10 text-rose-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {saveMsg}
        </div>
      )}

      {/* تبويبات */}
      <div className="flex gap-1 rounded-xl bg-slate-800 p-1">
        {[
          { key: 'content', label: 'أقسام الدرس', icon: BookText },
          { key: 'exercises', label: `التدريبات (${exercises.length})`, icon: Brain },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
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
                className={`rounded-2xl border ${meta.border} ${meta.bg} p-5 transition-all`}
              >
                {/* رأس القسم */}
                <div className="mb-3 flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-slate-500" />

                  <select
                    value={section.section_type}
                    onChange={(e) =>
                      updateSection(section.id, 'section_type', e.target.value)
                    }
                    className={`rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-xs font-bold ${meta.color} focus:outline-none`}
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
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={idx === 0}
                      className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={idx === sections.length - 1}
                      className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="rounded p-1 text-slate-500 hover:text-rose-400"
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
                  className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900/50 p-4 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <div className="mt-1 text-left text-xs text-slate-500">
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
                className={`flex items-center gap-1.5 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs font-medium ${t.color} hover:border-current transition-colors`}
              >
                <Plus className="h-3 w-3" />
                {t.label}
              </button>
            ))}
          </div>

          {/* زر توليد التدريبات بالذكاء الاصطناعي */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold text-indigo-300">
                  <Sparkles className="h-4 w-4" />
                  توليد تدريبات بالذكاء الاصطناعي
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  سيقرأ الذكاء الاصطناعي نص الدرس ويميز بين النص الأصلي والمقدمات ويولد تدريبات هادفة
                </p>
              </div>
              <button
                onClick={generateAiExercises}
                disabled={aiGenerating}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
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
              <div className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
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
            <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center">
              <Brain className="mx-auto h-10 w-10 text-slate-600" />
              <p className="mt-3 text-slate-400">لا توجد تدريبات بعد</p>
              <p className="mt-1 text-xs text-slate-500">
                استخدم زر التوليد بالذكاء الاصطناعي أو أضف تدريبات يدوياً
              </p>
              <button
                onClick={() => setActiveTab('content')}
                className="mt-4 flex items-center gap-2 mx-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                اذهب لتوليد التدريبات
              </button>
            </div>
          ) : (
            exercises.map((ex, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-700 bg-slate-800/40 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-300">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          ex.question_type === 'mcq'
                            ? 'text-indigo-400'
                            : ex.question_type === 'true_false'
                            ? 'text-emerald-400'
                            : ex.question_type === 'fill_blank'
                            ? 'text-amber-400'
                            : 'text-violet-400'
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
                        <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          ex.difficulty_level === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : ex.difficulty_level === 'hard'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {ex.difficulty_level === 'easy'
                          ? 'سهل'
                          : ex.difficulty_level === 'hard'
                          ? 'صعب'
                          : 'متوسط'}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-white">{ex.question_text}</p>

                    {ex.options && ex.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {ex.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`rounded-lg px-3 py-1.5 text-xs ${
                              opt === ex.correct_answer
                                ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {opt === ex.correct_answer && '✓ '}
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {ex.question_type !== 'mcq' && (
                      <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                        الإجابة: {ex.correct_answer}
                      </div>
                    )}

                    {ex.explanation && (
                      <div className="mt-2 text-xs text-slate-500 border-t border-slate-700 pt-2">
                        💡 {ex.explanation}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeExercise(idx, ex.id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
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
      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
        <div className="text-xs text-slate-500">
          {sections.filter((s) => s.body.trim()).length} أقسام •{' '}
          {exercises.length} تدريب
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ مسودة
          </button>
          <button
            onClick={() => handleSave('publish')}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
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
    </div>
  )
}
