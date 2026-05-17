'use client'

import { BookOpen, Clock, SlidersHorizontal, Eye, EyeOff } from 'lucide-react'
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
}

const INPUT = 'w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
const SELECT = INPUT + ' bg-white'

export function ExamBuilderSettings({ form, onChange, subjects, grades, semesters, units, lessons, groups, totalPoints }: Props) {
  const set = (key: keyof ExamFormState, val: any) => {
    const next = { ...form, [key]: val }
    if (key === 'gradeId' || key === 'subjectId' || key === 'semesterId') {
      next.unitId = ''
      next.lessonId = ''
    }
    if (key === 'unitId') next.lessonId = ''
    onChange(next)
  }

  const filteredUnits = units.filter(u => {
    if (!form.gradeId && !form.subjectId) return true
    return true
  })

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> المعلومات الأساسية
        </h3>

        {/* Group Selection (Only if groups are provided for Teachers) */}
        {groups && groups.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
            <label className="text-sm font-bold text-indigo-900 block mb-1.5">اختر المجموعة الدراسية *</label>
            <select value={form.groupId || ''} onChange={e => set('groupId', e.target.value)} className={SELECT}>
              <option value="">-- اختر المجموعة --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
            </select>
          </div>
        )}

        {/* Exam Type */}
        <div>
          <label className="text-sm font-semibold block mb-2">نوع الاختبار *</label>
          <div className="grid grid-cols-2 gap-2">
            {EXAM_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('examType', opt.value)}
                className={`text-xs px-3 py-2 rounded-xl border-2 text-right transition-all font-medium ${
                  form.examType === opt.value
                    ? opt.color + ' border-current ring-2 ring-offset-1 ring-current/30'
                    : 'bg-white border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">عنوان الاختبار *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="مثال: اختبار الفصل الأول - الجبر"
            className={INPUT}
          />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">وصف الاختبار</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="وصف مختصر..."
            rows={2}
            className={INPUT + ' resize-none'}
          />
        </div>

        {/* Hierarchy: Subject / Grade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1.5">المادة *</label>
            <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)} className={SELECT}>
              <option value="">اختر المادة</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">الصف *</label>
            <select value={form.gradeId} onChange={e => set('gradeId', e.target.value)} className={SELECT}>
              <option value="">اختر الصف</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
            </select>
          </div>
        </div>

        {/* Hierarchy: Semester / Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1.5">الفصل الدراسي</label>
            <select value={form.semesterId} onChange={e => set('semesterId', e.target.value)} className={SELECT}>
              <option value="">اختياري</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">الوحدة الدراسية</label>
            <select value={form.unitId} onChange={e => set('unitId', e.target.value)} className={SELECT} disabled={filteredUnits.length === 0}>
              <option value="">اختياري</option>
              {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.name_ar}</option>)}
            </select>
          </div>
        </div>

        {/* Lesson */}
        {lessons.length > 0 && (
          <div>
            <label className="text-sm font-semibold block mb-1.5">الدرس المحدد</label>
            <select value={form.lessonId} onChange={e => set('lessonId', e.target.value)} className={SELECT}>
              <option value="">اختياري</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.name_ar}</option>)}
            </select>
          </div>
        )}

        {/* Duration / Passing */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1.5">المدة (دقيقة) *</label>
            <input type="number" min={1} max={300} value={form.duration}
              onChange={e => set('duration', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">نسبة النجاح (%)</label>
            <div className="relative">
              <input type="number" min={1} max={100} value={form.passingScore}
                onChange={e => set('passingScore', e.target.value)}
                placeholder="50"
                className={`${INPUT} pl-8`} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">تعليمات الاختبار</label>
          <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)}
            placeholder="تعليمات تظهر للطالب قبل بدء الاختبار..."
            rows={3} className={INPUT + ' resize-none'} />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> جدولة الاختبار
          </h3>
          <div>
            <label className="text-sm font-semibold block mb-1.5">تاريخ البدء</label>
            <input type="datetime-local" value={form.availableFrom}
              onChange={e => set('availableFrom', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">تاريخ الانتهاء</label>
            <input type="datetime-local" value={form.availableUntil}
              onChange={e => set('availableUntil', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">عدد المحاولات</label>
            <select value={form.allowedAttempts} onChange={e => set('allowedAttempts', e.target.value)} className={SELECT}>
              {[1,2,3,5,10].map(n => <option key={n} value={n}>{n} {n===1?'محاولة':'محاولات'}</option>)}
              <option value="-1">غير محدود</option>
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" /> خيارات الاختبار
          </h3>
          {([
            ['shuffleQuestions', 'ترتيب عشوائي للأسئلة', 'تظهر الأسئلة بترتيب مختلف لكل طالب'],
            ['shuffleOptions',   'ترتيب عشوائي للخيارات', 'تُخلط خيارات MCQ لكل طالب'],
            ['showResultsImmediately', 'عرض النتيجة فوراً', 'يرى الطالب درجته بعد التسليم مباشرة'],
          ] as [keyof ExamFormState, string, string][]).map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button type="button" onClick={() => set(key, !form[key])}
                className={`w-11 h-6 rounded-full transition-colors relative ${form[key] ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-[1.4rem]' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">نشر الاختبار</p>
              <p className="text-xs text-muted-foreground">متاح للطلاب فور الحفظ</p>
            </div>
            <button type="button" onClick={() => set('isPublished', !form.isPublished)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                form.isPublished ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
              {form.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {form.isPublished ? 'منشور' : 'مسودة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
