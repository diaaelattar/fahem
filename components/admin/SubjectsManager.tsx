'use client'

// components/admin/SubjectsManager.tsx
// واجهة إدارة المواد الدراسية للأدمن — إضافة، تعديل، حذف، وتحديد المراحل ونوع التعليم

import { useState } from 'react'
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  GraduationCap,
  School,
  Loader2,
} from 'lucide-react'

export interface SubjectItem {
  id: number
  name_ar: string
  name_en: string | null
  category: string | null
  applicable_stages: string[] | null
  education_types: string[] | null
  teaching_language: string | null
  icon: string
  color: string
}

interface SubjectsManagerProps {
  initialSubjects: SubjectItem[]
}

const STAGES = [
  { id: 'primary', label: 'المرحلة الابتدائية', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'preparatory', label: 'المرحلة الإعدادية', icon: School, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'secondary', label: 'المرحلة الثانوية', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

const EDU_TYPES = [
  { id: 'public', label: 'تعليم عام', emoji: '🏫', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 'language', label: 'مدارس لغات', emoji: '🌐', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'azhar', label: 'تعليم أزهري', emoji: '🕌', color: 'text-amber-700 bg-amber-50 border-amber-200' },
]

const CATEGORIES = ['علوم', 'لغات', 'آداب', 'عام']
const PRESET_ICONS = ['📖', '🌍', '🔢', '🔬', '🗺️', '⚡', '🧪', '📜', '💻', '🧬', '🧠', '👥', '🪨', '🗼', '🕌', '📐', '📘', '⭐']
const PRESET_COLORS = ['#C5A028', '#1B4F72', '#117A65', '#1A5276', '#784212', '#1B2631', '#4A235A', '#2C3E50', '#1E8449', '#B7950B', '#6C3483', '#A04000', '#2874A6', '#7D6608', '#145A32']

export default function SubjectsManager({ initialSubjects }: SubjectsManagerProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all')
  const [selectedEduFilter, setSelectedEduFilter] = useState<string>('all')
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form State
  const [formData, setFormData] = useState<{
    id?: number
    name_ar: string
    name_en: string
    category: string
    applicable_stages: string[]
    education_types: string[]
    teaching_language: string
    icon: string
    color: string
  }>({
    name_ar: '',
    name_en: '',
    category: 'علوم',
    applicable_stages: ['primary', 'preparatory', 'secondary'],
    education_types: ['public', 'language'],
    teaching_language: 'arabic',
    icon: '📚',
    color: '#1B4F72',
  })

  // Deleting State
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text })
    setTimeout(() => setFeedbackMsg(null), 5000)
  }

  // Open modal for Create
  const handleOpenCreate = () => {
    setModalMode('create')
    setFormData({
      name_ar: '',
      name_en: '',
      category: 'علوم',
      applicable_stages: ['preparatory'],
      education_types: ['public', 'language'],
      teaching_language: 'arabic',
      icon: '📚',
      color: '#1B4F72',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (subject: SubjectItem) => {
    setModalMode('edit')
    setFormData({
      id: subject.id,
      name_ar: subject.name_ar,
      name_en: subject.name_en || '',
      category: subject.category || 'عام',
      applicable_stages: subject.applicable_stages || [],
      education_types: subject.education_types || [],
      teaching_language: subject.teaching_language || 'arabic',
      icon: subject.icon || '📚',
      color: subject.color || '#1B4F72',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Toggle stage in form
  const toggleStage = (stageId: string) => {
    setFormData((prev) => {
      const exists = prev.applicable_stages.includes(stageId)
      return {
        ...prev,
        applicable_stages: exists
          ? prev.applicable_stages.filter((s) => s !== stageId)
          : [...prev.applicable_stages, stageId],
      }
    })
  }

  // Toggle education type in form
  const toggleEduType = (eduId: string) => {
    setFormData((prev) => {
      const exists = prev.education_types.includes(eduId)
      return {
        ...prev,
        education_types: exists
          ? prev.education_types.filter((e) => e !== eduId)
          : [...prev.education_types, eduId],
      }
    })
  }

  // Submit Save / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.name_ar.trim()) {
      setFormError('يرجى إدخال اسم المادة باللغة العربية')
      return
    }

    if (formData.applicable_stages.length === 0) {
      setFormError('يرجى تحديد مرحلة دراسية واحدة على الأقل تنطبق عليها المادة')
      return
    }

    if (formData.education_types.length === 0) {
      setFormError('يرجى تحديد نوع تعليم واحد على الأقل (عام، لغات، أزهر)')
      return
    }

    setIsSubmitting(true)
    try {
      const url = '/api/admin/subjects'
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'فشلت العملية')
      }

      if (modalMode === 'create') {
        setSubjects((prev) => [...prev, result.subject])
        showFeedback('success', `تمت إضافة مادة "${result.subject.name_ar}" بنجاح!`)
      } else {
        setSubjects((prev) =>
          prev.map((s) => (s.id === result.subject.id ? result.subject : s))
        )
        showFeedback('success', `تم تحديث مادة "${result.subject.name_ar}" بنجاح!`)
      }

      setIsModalOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  const handleDelete = async (subject: SubjectItem) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف مادة "${subject.name_ar}" نهائياً من النظام؟`)) {
      return
    }

    setDeletingId(subject.id)
    try {
      const res = await fetch(`/api/admin/subjects?id=${subject.id}`, {
        method: 'DELETE',
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'فشل حذف المادة')
      }

      setSubjects((prev) => prev.filter((s) => s.id !== subject.id))
      showFeedback('success', `تم حذف مادة "${subject.name_ar}" بنجاح`)
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'تعذر حذف المادة')
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered Subjects for Display
  const filteredList = subjects.filter((s) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchNameAr = s.name_ar.toLowerCase().includes(q)
      const matchNameEn = s.name_en?.toLowerCase().includes(q)
      if (!matchNameAr && !matchNameEn) return false
    }

    // Stage filter
    if (selectedStageFilter !== 'all') {
      if (!s.applicable_stages || !s.applicable_stages.includes(selectedStageFilter)) {
        return false
      }
    }

    // Education type filter
    if (selectedEduFilter !== 'all') {
      if (!s.education_types || !s.education_types.includes(selectedEduFilter)) {
        return false
      }
    }

    // Category filter
    if (selectedCatFilter !== 'all') {
      if (s.category !== selectedCatFilter) return false
    }

    return true
  })

  // Counters
  const primaryCount = subjects.filter((s) => s.applicable_stages?.includes('primary')).length
  const prepCount = subjects.filter((s) => s.applicable_stages?.includes('preparatory')).length
  const secondaryCount = subjects.filter((s) => s.applicable_stages?.includes('secondary')).length

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">إجمالي المواد المسجلة</p>
          <p className="mt-1 text-2xl font-black text-foreground">{subjects.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-emerald-700">مواد المرحلة الابتدائية</p>
          <p className="mt-1 text-2xl font-black text-emerald-800">{primaryCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-blue-700">مواد المرحلة الإعدادية</p>
          <p className="mt-1 text-2xl font-black text-blue-800">{prepCount}</p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-purple-700">مواد المرحلة الثانوية</p>
          <p className="mt-1 text-2xl font-black text-purple-800">{secondaryCount}</p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 shadow-sm transition-all ${
            feedbackMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <Check className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-bold">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Action Bar & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث باسم المادة بالعربية أو الإنجليزية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-4 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          إضافة مادة جديدة
        </button>
      </div>

      {/* Filter Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground ml-2">تصفية حسب المرحلة:</span>
        <button
          onClick={() => setSelectedStageFilter('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            selectedStageFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          الكل ({subjects.length})
        </button>
        {STAGES.map((st) => {
          const count = subjects.filter((s) => s.applicable_stages?.includes(st.id)).length
          return (
            <button
              key={st.id}
              onClick={() => setSelectedStageFilter(st.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedStageFilter === st.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <st.icon className="h-3.5 w-3.5" />
              {st.label} ({count})
            </button>
          )
        })}

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        <span className="text-xs font-bold text-muted-foreground ml-2">نوع التعليم:</span>
        <button
          onClick={() => setSelectedEduFilter('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            selectedEduFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          الكل
        </button>
        {EDU_TYPES.map((et) => (
          <button
            key={et.id}
            onClick={() => setSelectedEduFilter(et.id)}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              selectedEduFilter === et.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            <span>{et.emoji}</span>
            {et.label}
          </button>
        ))}

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        <span className="text-xs font-bold text-muted-foreground ml-2">التصنيف:</span>
        <button
          onClick={() => setSelectedCatFilter('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            selectedCatFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          الكل
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCatFilter(cat)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              selectedCatFilter === cat
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Subjects Grid */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="font-bold text-foreground">لا توجد مواد دراسية مطابقة للبحث</p>
          <p className="text-xs text-muted-foreground mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((subject) => (
            <div
              key={subject.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
                      style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                    >
                      {subject.icon}
                    </span>
                    <div>
                      <h3 className="font-black text-foreground text-base">{subject.name_ar}</h3>
                      <p className="text-xs font-medium text-muted-foreground font-sans">
                        {subject.name_en || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Category Pill */}
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                    {subject.category || 'عام'}
                  </span>
                </div>

                {/* Stages Badges */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-muted-foreground">المراحل الدراسية:</div>
                  <div className="flex flex-wrap gap-1">
                    {STAGES.map((st) => {
                      const isApplicable = subject.applicable_stages?.includes(st.id)
                      return (
                        <span
                          key={st.id}
                          className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${
                            isApplicable
                              ? st.color
                              : 'border-transparent bg-muted/40 text-muted-foreground/40 line-through opacity-50'
                          }`}
                        >
                          <st.icon className="h-3 w-3" />
                          {st.label.replace('المرحلة ', '')}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Education Types Badges */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-muted-foreground">نوع المدارس:</div>
                  <div className="flex flex-wrap gap-1">
                    {EDU_TYPES.map((et) => {
                      const isApplicable = subject.education_types?.includes(et.id)
                      return (
                        <span
                          key={et.id}
                          className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${
                            isApplicable
                              ? et.color
                              : 'border-transparent bg-muted/40 text-muted-foreground/40 opacity-40'
                          }`}
                        >
                          <span>{et.emoji}</span>
                          {et.label}
                        </span>
                      )
                    })}
                    <span className="mr-auto rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {subject.teaching_language === 'english' ? '🇬🇧 إنجليزي' : subject.teaching_language === 'french' ? '🇫🇷 فرنسي' : '🇪🇬 عربي'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs font-mono text-muted-foreground/60">ID: #{subject.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(subject)}
                    className="flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    تعديل
                  </button>
                  <button
                    disabled={deletingId === subject.id}
                    onClick={() => handleDelete(subject)}
                    className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === subject.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {modalMode === 'create' ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                </span>
                <div>
                  <h2 className="font-bold text-lg text-foreground">
                    {modalMode === 'create' ? 'إضافة مادة دراسية جديدة' : `تعديل مادة: ${formData.name_ar}`}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    حدد اسم المادة، والمراحل والمدارس التي تظهر بها للطلاب والمعلمين
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Names */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    اسم المادة بالعربية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الرياضيات"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    اسم المادة بالإنجليزية
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: Mathematics"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Category & Language */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">التصنيف الأكاديمي</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">لغة التدريس</label>
                  <select
                    value={formData.teaching_language}
                    onChange={(e) => setFormData({ ...formData, teaching_language: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="arabic">العربية (Arabic)</option>
                    <option value="english">الإنجليزية (English)</option>
                    <option value="french">الفرنسية (French)</option>
                  </select>
                </div>
              </div>

              {/* Applicable Stages Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  المراحل الدراسية المنطبقة <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {STAGES.map((st) => {
                    const isChecked = formData.applicable_stages.includes(st.id)
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => toggleStage(st.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all text-right ${
                          isChecked
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                            isChecked ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                        <st.icon className="h-4 w-4 shrink-0" />
                        <span>{st.label.replace('المرحلة ', '')}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  مثال: التاريخ والأحياء في الثانوية فقط، الدراسات الاجتماعية في الابتدائية والإعدادية فقط.
                </p>
              </div>

              {/* Education Types Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  نوع التعليم والمدارس <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {EDU_TYPES.map((et) => {
                    const isChecked = formData.education_types.includes(et.id)
                    return (
                      <button
                        type="button"
                        key={et.id}
                        onClick={() => toggleEduType(et.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all text-right ${
                          isChecked
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                            isChecked ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                        <span>{et.emoji}</span>
                        <span>{et.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    الأيقونة (رمز تعبيري)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-16 rounded-xl border border-border bg-muted/20 p-2 text-center text-xl focus:border-primary focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      {PRESET_ICONS.slice(0, 8).map((ic) => (
                        <button
                          type="button"
                          key={ic}
                          onClick={() => setFormData({ ...formData, icon: ic })}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted text-sm"
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">اللون التعريفي</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-xl border border-border bg-transparent p-1"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-24 rounded-xl border border-border bg-muted/20 px-2 py-1.5 text-xs font-mono focus:border-primary focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {PRESET_COLORS.slice(0, 4).map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setFormData({ ...formData, color: c })}
                          className="h-6 w-6 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {modalMode === 'create' ? 'إضافة المادة' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
