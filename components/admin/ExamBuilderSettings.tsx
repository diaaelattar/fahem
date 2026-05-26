'use client'

import {
  BookOpen,
  Clock,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Users,
  ChevronDown,
} from 'lucide-react'
import type { ExamFormState, FilterOption } from './ExamBuilderTypes'
import { EXAM_TYPE_OPTIONS } from './ExamBuilderTypes'

interface Props {
  form: ExamFormState
  onChange: (f: ExamFormState) => void
  subjects: FilterOption[]
  grades: FilterOption[]
  semesters: FilterOption[]
  units: FilterOption[]
  lessons: FilterOption[]
  groups?: FilterOption[]
  totalPoints: number
  /** If set, locks the subject field to this id (teacher mode) */
  lockedSubjectId?: string
}

const INPUT =
  'w-full px-3.5 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white transition-colors'
const SELECT = INPUT

export function ExamBuilderSettings({
  form,
  onChange,
  subjects,
  grades,
  semesters,
  units,
  lessons,
  groups,
  totalPoints,
  lockedSubjectId,
}: Props) {
  const set = (key: keyof ExamFormState, val: any) => {
    const next = { ...form, [key]: val }
    // Cascade resets when parent hierarchy changes
    if (key === 'gradeId' || key === 'subjectId' || key === 'semesterId') {
      next.unitId = ''
      next.lessonId = ''
      // Also reset bank filters that depend on hierarchy
      next.bankSearch = ''
    }
    if (key === 'unitId') next.lessonId = ''
    onChange(next)
  }

  const filteredUnits = units
    .filter(
      (u) =>
        (u as any).subject_id?.toString() === form.subjectId || !form.subjectId
    )
    .filter(
      (u) => (u as any).grade_id?.toString() === form.gradeId || !form.gradeId
    )
    .filter(
      (u) =>
        (u as any).semester_id?.toString() === form.semesterId ||
        !form.semesterId
    )

  const filteredLessons = lessons.filter(
    (l) => (l as any).unit_id?.toString() === form.unitId || !form.unitId
  )

  return (
    <div className="space-y-5">
      {/* ── Step Header ── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white shadow-md">
          ١
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">
            إعدادات الاختبار والتصفية
          </h2>
          <p className="text-sm text-slate-500">
            اختر المادة والصف والوحدة — ستُستخدم تلقائياً لفلترة بنك الأسئلة في
            الخطوة التالية
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Column 1: Basic Info ── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Group (teacher only) */}
          {groups && groups.length > 0 && (
            <div className="space-y-2 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4">
              <label className="flex items-center gap-2 text-sm font-black text-indigo-800">
                <Users className="h-4 w-4" /> المجموعة الدراسية{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.groupId || ''}
                  onChange={(e) => set('groupId', e.target.value)}
                  className={SELECT}
                >
                  <option value="">-- اختر المجموعة --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          {/* Title + Description */}
          <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              معلومات الاختبار
            </h3>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                عنوان الاختبار <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="مثال: اختبار الفصل الأول — وحدة الجبر"
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                وصف مختصر{' '}
                <span className="font-normal text-slate-400">(اختياري)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="وصف الاختبار يظهر للطالب قبل البدء..."
                rows={2}
                className={INPUT + ' resize-none'}
              />
            </div>
          </div>

          {/* Exam Type */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">
              نوع الاختبار
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {EXAM_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('examType', opt.value)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-center text-xs font-medium transition-all ${
                    form.examType === opt.value
                      ? opt.color +
                        ' ring-current/20 border-current shadow-sm ring-2 ring-offset-1'
                      : 'border-border bg-white text-muted-foreground hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 
            ═══════════════════════════════════════════════════════
            UNIFIED HIERARCHY: Subject → Grade → Semester → Unit → Lesson
            These values drive BOTH exam metadata AND the question bank filter.
            ═══════════════════════════════════════════════════════
          */}
          <div className="rounded-2xl border-2 border-primary/20 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-black text-primary">
                التصفية التسلسلية — تُطبَّق على الاختبار وبنك الأسئلة معاً
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  المادة الدراسية <span className="text-red-500">*</span>
                </label>
                {lockedSubjectId ? (
                  <div
                    className={
                      INPUT +
                      ' cursor-not-allowed border-primary/30 bg-primary/5 font-bold text-primary'
                    }
                  >
                    {subjects.find((s) => s.id.toString() === lockedSubjectId)
                      ?.name_ar || '—'}
                    <span className="mr-2 text-[10px] text-slate-400">
                      (مقفل لتخصصك)
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={form.subjectId}
                      onChange={(e) => set('subjectId', e.target.value)}
                      className={SELECT}
                    >
                      <option value="">كل المواد</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {(s as any).icon} {s.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Grade */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  الصف الدراسي <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.gradeId}
                    onChange={(e) => set('gradeId', e.target.value)}
                    className={SELECT}
                  >
                    <option value="">كل الصفوف</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Semester */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  الفصل الدراسي
                </label>
                <div className="relative">
                  <select
                    value={form.semesterId}
                    onChange={(e) => set('semesterId', e.target.value)}
                    className={SELECT}
                  >
                    <option value="">كل الفصول</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  الوحدة الدراسية
                </label>
                <div className="relative">
                  <select
                    value={form.unitId}
                    onChange={(e) => set('unitId', e.target.value)}
                    className={SELECT}
                    disabled={filteredUnits.length === 0}
                  >
                    <option value="">كل الوحدات</option>
                    {filteredUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lesson — full width */}
              {filteredLessons.length > 0 && (
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    الدرس المحدد
                  </label>
                  <select
                    value={form.lessonId}
                    onChange={(e) => set('lessonId', e.target.value)}
                    className={SELECT}
                  >
                    <option value="">كل الدروس</option>
                    {filteredLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Live summary pill */}
            {(form.subjectId || form.gradeId) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.subjectId && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {
                      subjects.find((s) => s.id.toString() === form.subjectId)
                        ?.name_ar
                    }
                  </span>
                )}
                {form.gradeId && (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {
                      grades.find((g) => g.id.toString() === form.gradeId)
                        ?.name_ar
                    }
                  </span>
                )}
                {form.semesterId && (
                  <span className="rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                    {
                      semesters.find((s) => s.id.toString() === form.semesterId)
                        ?.name_ar
                    }
                  </span>
                )}
                {form.unitId && (
                  <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                    {
                      filteredUnits.find((u) => u.id.toString() === form.unitId)
                        ?.name_ar
                    }
                  </span>
                )}
                {form.lessonId && (
                  <span className="rounded-full border border-teal-200 bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {
                      filteredLessons.find(
                        (l) => l.id.toString() === form.lessonId
                      )?.name_ar
                    }
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Duration + Passing */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-600">
              <Clock className="h-4 w-4 text-primary" /> زمن ودرجة النجاح
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold">
                  المدة (دقيقة) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">
                  نسبة النجاح (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.passingScore}
                    onChange={(e) => set('passingScore', e.target.value)}
                    placeholder="50"
                    className={`${INPUT} pl-7`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-semibold">
                تعليمات الاختبار
              </label>
              <textarea
                value={form.instructions}
                onChange={(e) => set('instructions', e.target.value)}
                placeholder="تعليمات تظهر للطالب قبل البدء..."
                rows={2}
                className={INPUT + ' resize-none'}
              />
            </div>
          </div>
        </div>

        {/* ── Column 2: Advanced settings ── */}
        <div className="space-y-4">
          {/* Schedule */}
          <div className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              جدولة الاختبار
            </h3>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                تاريخ البدء
              </label>
              <input
                type="datetime-local"
                value={form.availableFrom}
                onChange={(e) => set('availableFrom', e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                تاريخ الانتهاء
              </label>
              <input
                type="datetime-local"
                value={form.availableUntil}
                onChange={(e) => set('availableUntil', e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                عدد المحاولات
              </label>
              <select
                value={form.allowedAttempts}
                onChange={(e) => set('allowedAttempts', e.target.value)}
                className={SELECT}
              >
                {[1, 2, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'محاولة' : 'محاولات'}
                  </option>
                ))}
                <option value="-1">غير محدود</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-600">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> خيارات
              الاختبار
            </h3>
            {(
              [
                [
                  'shuffleQuestions',
                  'ترتيب عشوائي للأسئلة',
                  'تظهر الأسئلة بترتيب مختلف',
                ],
                ['shuffleOptions', 'ترتيب عشوائي للخيارات', 'تُخلط خيارات MCQ'],
                [
                  'showResultsImmediately',
                  'عرض النتيجة فوراً',
                  'يرى الطالب درجته بعد التسليم',
                ],
              ] as [keyof ExamFormState, string, string][]
            ).map(([key, label, desc]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set(key, !form[key])}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-all ${form[key] ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form[key] ? 'translate-x-[1.35rem]' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
              <div>
                <p className="text-sm font-semibold">نشر الاختبار</p>
                <p className="text-xs text-muted-foreground">
                  متاح للطلاب فور الحفظ
                </p>
              </div>
              <button
                type="button"
                onClick={() => set('isPublished', !form.isPublished)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                  form.isPublished
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {form.isPublished ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {form.isPublished ? 'منشور' : 'مسودة'}
              </button>
            </div>
          </div>

          {/* Total points summary */}
          {totalPoints > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-5 text-center text-white shadow-lg">
              <p className="mb-1 text-xs font-bold text-blue-100">
                الدرجة الكلية للاختبار
              </p>
              <p className="text-4xl font-black">{totalPoints}</p>
              <p className="mt-1 text-xs text-blue-200">درجة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
