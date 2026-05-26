'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'

export interface QuestionFilters {
  search: string
  gradeId: string
  subjectId: string
  semesterId: string
  unitId: string
  lessonId: string
  questionType: string
  difficulty: string
}

interface FilterOption {
  id: number | string
  name_ar: string
  icon?: string
}

interface Props {
  filters: QuestionFilters
  onChange: (f: QuestionFilters) => void
  grades: FilterOption[]
  subjects: FilterOption[]
  semesters: FilterOption[]
  units: FilterOption[]
  lessons: FilterOption[]
  totalShown: number
  totalInBank: number
}

const SELECT_CLS =
  'w-full px-3 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30'

export function QuestionFilterSidebar({
  filters,
  onChange,
  grades,
  subjects,
  semesters,
  units,
  lessons,
  totalShown,
  totalInBank,
}: Props) {
  const set = (key: keyof QuestionFilters, val: string) => {
    const next = { ...filters, [key]: val }
    // إعادة تعيين الفلاتر التابعة عند تغيير الأصل
    if (key === 'gradeId' || key === 'subjectId') {
      next.unitId = ''
      next.lessonId = ''
    }
    if (key === 'unitId') next.lessonId = ''
    onChange(next)
  }

  const hasActive = Object.values(filters).some((v) => v !== '')

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          فلترة الأسئلة
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {totalShown}/{totalInBank}
          </span>
          {hasActive && (
            <button
              onClick={() =>
                onChange({
                  search: '',
                  gradeId: '',
                  subjectId: '',
                  semesterId: '',
                  unitId: '',
                  lessonId: '',
                  questionType: '',
                  difficulty: '',
                })
              }
              className="flex items-center gap-1 text-xs text-red-500 hover:underline"
            >
              <X className="h-3 w-3" /> مسح
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="ابحث في نص السؤال..."
            className="w-full rounded-xl border border-border py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Grade */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
            الصف الدراسي
          </label>
          <select
            value={filters.gradeId}
            onChange={(e) => set('gradeId', e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">كل الصفوف</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name_ar}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
            المادة الدراسية
          </label>
          <select
            value={filters.subjectId}
            onChange={(e) => set('subjectId', e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">كل المواد</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name_ar}
              </option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
            الفصل الدراسي
          </label>
          <select
            value={filters.semesterId}
            onChange={(e) => set('semesterId', e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">كل الفصول</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_ar}
              </option>
            ))}
          </select>
        </div>

        {/* Unit */}
        {units.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              الوحدة الدراسية
            </label>
            <select
              value={filters.unitId}
              onChange={(e) => set('unitId', e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">كل الوحدات</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name_ar}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lesson */}
        {lessons.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              الدرس
            </label>
            <select
              value={filters.lessonId}
              onChange={(e) => set('lessonId', e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">كل الدروس</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name_ar}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
            نوع السؤال
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['', 'الكل'],
              ['mcq', 'اختيار متعدد'],
              ['true_false', 'صح/خطأ'],
              ['fill_blank', 'ملء فراغ'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => set('questionType', val)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  filters.questionType === val
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
            مستوى الصعوبة
          </label>
          <div className="flex gap-1.5">
            {[
              ['', 'الكل', ''],
              ['easy', 'سهل', 'text-green-600 border-green-300'],
              ['medium', 'متوسط', 'text-yellow-600 border-yellow-300'],
              ['hard', 'صعب', 'text-red-600 border-red-300'],
            ].map(([val, label, cls]) => (
              <button
                key={val}
                onClick={() => set('difficulty', val)}
                className={`flex-1 rounded-lg border py-1 text-xs transition-colors ${
                  filters.difficulty === val
                    ? 'border-primary bg-primary text-white'
                    : `bg-white ${cls || 'border-border'} hover:border-primary/50`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
