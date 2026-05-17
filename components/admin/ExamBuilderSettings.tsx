'use client'

import { BookOpen, Clock, SlidersHorizontal, Eye, EyeOff, Users, ChevronDown } from 'lucide-react'
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

const INPUT  = 'w-full px-3.5 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white transition-colors'
const SELECT = INPUT

export function ExamBuilderSettings({
  form, onChange, subjects, grades, semesters, units, lessons, groups, totalPoints, lockedSubjectId
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

  const filteredUnits    = units.filter(u => (u as any).subject_id?.toString() === form.subjectId || !form.subjectId)
    .filter(u => (u as any).grade_id?.toString() === form.gradeId || !form.gradeId)
    .filter(u => (u as any).semester_id?.toString() === form.semesterId || !form.semesterId)

  const filteredLessons  = lessons.filter(l => (l as any).unit_id?.toString() === form.unitId || !form.unitId)

  return (
    <div className="space-y-5">

      {/* ── Step Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-black flex items-center justify-center shadow-md">١</div>
        <div>
          <h2 className="font-black text-slate-800 text-lg">إعدادات الاختبار والتصفية</h2>
          <p className="text-sm text-slate-500">اختر المادة والصف والوحدة — ستُستخدم تلقائياً لفلترة بنك الأسئلة في الخطوة التالية</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Column 1: Basic Info ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Group (teacher only) */}
          {groups && groups.length > 0 && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-2">
              <label className="text-sm font-black text-indigo-800 flex items-center gap-2">
                <Users className="w-4 h-4" /> المجموعة الدراسية <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select value={form.groupId || ''} onChange={e => set('groupId', e.target.value)} className={SELECT}>
                  <option value="">-- اختر المجموعة --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Title + Description */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider">معلومات الاختبار</h3>
            <div>
              <label className="text-sm font-semibold block mb-1.5">عنوان الاختبار <span className="text-red-500">*</span></label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="مثال: اختبار الفصل الأول — وحدة الجبر"
                className={INPUT}
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5">وصف مختصر <span className="text-slate-400 font-normal">(اختياري)</span></label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="وصف الاختبار يظهر للطالب قبل البدء..."
                rows={2}
                className={INPUT + ' resize-none'}
              />
            </div>
          </div>

          {/* Exam Type */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider mb-3">نوع الاختبار</h3>
            <div className="grid grid-cols-3 gap-2">
              {EXAM_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('examType', opt.value)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 text-center transition-all font-medium text-xs ${
                    form.examType === opt.value
                      ? opt.color + ' border-current ring-2 ring-offset-1 ring-current/20 shadow-sm'
                      : 'bg-white border-border text-muted-foreground hover:border-slate-300'
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
          <div className="bg-white rounded-2xl border-2 border-primary/20 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-black text-sm text-primary">التصفية التسلسلية — تُطبَّق على الاختبار وبنك الأسئلة معاً</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Subject */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-slate-600">المادة الدراسية <span className="text-red-500">*</span></label>
                {lockedSubjectId ? (
                  <div className={INPUT + ' text-primary font-bold bg-primary/5 border-primary/30 cursor-not-allowed'}>
                    {subjects.find(s => s.id.toString() === lockedSubjectId)?.name_ar || '—'}
                    <span className="text-[10px] text-slate-400 mr-2">(مقفل لتخصصك)</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)} className={SELECT}>
                      <option value="">كل المواد</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{(s as any).icon} {s.name_ar}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Grade */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-slate-600">الصف الدراسي <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={form.gradeId} onChange={e => set('gradeId', e.target.value)} className={SELECT}>
                    <option value="">كل الصفوف</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                  </select>
                </div>
              </div>

              {/* Semester */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-slate-600">الفصل الدراسي</label>
                <div className="relative">
                  <select value={form.semesterId} onChange={e => set('semesterId', e.target.value)} className={SELECT}>
                    <option value="">كل الفصول</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                  </select>
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-slate-600">الوحدة الدراسية</label>
                <div className="relative">
                  <select
                    value={form.unitId}
                    onChange={e => set('unitId', e.target.value)}
                    className={SELECT}
                    disabled={filteredUnits.length === 0}
                  >
                    <option value="">كل الوحدات</option>
                    {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.name_ar}</option>)}
                  </select>
                </div>
              </div>

              {/* Lesson — full width */}
              {filteredLessons.length > 0 && (
                <div className="col-span-2">
                  <label className="text-xs font-semibold block mb-1.5 text-slate-600">الدرس المحدد</label>
                  <select value={form.lessonId} onChange={e => set('lessonId', e.target.value)} className={SELECT}>
                    <option value="">كل الدروس</option>
                    {filteredLessons.map(l => <option key={l.id} value={l.id}>{l.name_ar}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Live summary pill */}
            {(form.subjectId || form.gradeId) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.subjectId && (
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full border border-primary/20">
                    {subjects.find(s => s.id.toString() === form.subjectId)?.name_ar}
                  </span>
                )}
                {form.gradeId && (
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-200">
                    {grades.find(g => g.id.toString() === form.gradeId)?.name_ar}
                  </span>
                )}
                {form.semesterId && (
                  <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2.5 py-1 rounded-full border border-violet-200">
                    {semesters.find(s => s.id.toString() === form.semesterId)?.name_ar}
                  </span>
                )}
                {form.unitId && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200">
                    {filteredUnits.find(u => u.id.toString() === form.unitId)?.name_ar}
                  </span>
                )}
                {form.lessonId && (
                  <span className="text-xs bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-full border border-teal-200">
                    {filteredLessons.find(l => l.id.toString() === form.lessonId)?.name_ar}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Duration + Passing */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> زمن ودرجة النجاح
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5">المدة (دقيقة) <span className="text-red-500">*</span></label>
                <input type="number" min={1} max={300} value={form.duration}
                  onChange={e => set('duration', e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5">نسبة النجاح (%)</label>
                <div className="relative">
                  <input type="number" min={1} max={100} value={form.passingScore}
                    onChange={e => set('passingScore', e.target.value)}
                    placeholder="50" className={`${INPUT} pl-7`} />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">%</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-semibold block mb-1.5">تعليمات الاختبار</label>
              <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)}
                placeholder="تعليمات تظهر للطالب قبل البدء..." rows={2} className={INPUT + ' resize-none'} />
            </div>
          </div>
        </div>

        {/* ── Column 2: Advanced settings ── */}
        <div className="space-y-4">
          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider">جدولة الاختبار</h3>
            <div>
              <label className="text-xs font-semibold block mb-1.5">تاريخ البدء</label>
              <input type="datetime-local" value={form.availableFrom}
                onChange={e => set('availableFrom', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5">تاريخ الانتهاء</label>
              <input type="datetime-local" value={form.availableUntil}
                onChange={e => set('availableUntil', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5">عدد المحاولات</label>
              <select value={form.allowedAttempts} onChange={e => set('allowedAttempts', e.target.value)} className={SELECT}>
                {[1,2,3,5,10].map(n => <option key={n} value={n}>{n} {n===1?'محاولة':'محاولات'}</option>)}
                <option value="-1">غير محدود</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" /> خيارات الاختبار
            </h3>
            {([
              ['shuffleQuestions', 'ترتيب عشوائي للأسئلة', 'تظهر الأسئلة بترتيب مختلف'],
              ['shuffleOptions',   'ترتيب عشوائي للخيارات', 'تُخلط خيارات MCQ'],
              ['showResultsImmediately', 'عرض النتيجة فوراً', 'يرى الطالب درجته بعد التسليم'],
            ] as [keyof ExamFormState, string, string][]).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <button type="button" onClick={() => set(key, !form[key])}
                  className={`shrink-0 w-11 h-6 rounded-full transition-all relative ${form[key] ? 'bg-primary' : 'bg-slate-200'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form[key] ? 'translate-x-[1.35rem]' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <div>
                <p className="text-sm font-semibold">نشر الاختبار</p>
                <p className="text-xs text-muted-foreground">متاح للطلاب فور الحفظ</p>
              </div>
              <button type="button" onClick={() => set('isPublished', !form.isPublished)}
                className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border-2 transition-all font-bold ${
                  form.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                {form.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {form.isPublished ? 'منشور' : 'مسودة'}
              </button>
            </div>
          </div>

          {/* Total points summary */}
          {totalPoints > 0 && (
            <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg text-center">
              <p className="text-xs font-bold text-blue-100 mb-1">الدرجة الكلية للاختبار</p>
              <p className="text-4xl font-black">{totalPoints}</p>
              <p className="text-xs text-blue-200 mt-1">درجة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
