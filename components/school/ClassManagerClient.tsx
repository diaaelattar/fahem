'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  Plus,
  Trash2,
  Users,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface ClassManagerClientProps {
  initialClasses: any[]
  grades: any[]
  classStudentCounts: { [classId: string]: number }
  schoolId: string
}

export function ClassManagerClient({
  initialClasses,
  grades,
  classStudentCounts,
  schoolId
}: ClassManagerClientProps) {
  const supabase = createClient()
  const [classes, setClasses] = useState(initialClasses)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // حقول نموذج إنشاء فصل جديد
  const [className, setClassName] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [semester, setSemester] = useState('1')
  const [error, setError] = useState('')

  // خريطة لتسريع البحث عن أسماء الصفوف
  const gradeNameMap = new Map<number, string>()
  grades.forEach((g) => gradeNameMap.set(g.id, g.name_ar))

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!className || !gradeId) {
      setError('يرجى ملء جميع الحقول المطلوبة.')
      setLoading(false)
      return
    }

    try {
      const { data, error: insertError } = await supabase
        .from('school_classes')
        .insert({
          school_id: schoolId,
          name: className,
          grade_id: parseInt(gradeId),
          semester_id: parseInt(semester),
          academic_year: academicYear
        })
        .select()

      if (insertError) {
        throw new Error(insertError.message)
      }

      if (data && data[0]) {
        // تحديث القائمة المحلية
        setClasses([data[0], ...classes])
        handleCloseModal()
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الفصل.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClass = async (id: string) => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذا الفصل؟ سيتم فصل الطلاب المرتبطين به تلقائياً.')
    if (!confirmDelete) return

    try {
      const { error: deleteError } = await supabase
        .from('school_classes')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setClasses(classes.filter((c) => c.id !== id))
    } catch (err: any) {
      alert('فشل حذف الفصل: ' + err.message)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setClassName('')
    setGradeId('')
    setSemester('1')
    setAcademicYear('2025-2026')
    setError('')
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الترويسة وإجراءات الإضافة */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">إدارة الفصول الدراسية</h2>
          <p className="text-xs text-slate-400 mt-1">تنسيق وتوزيع وتعيين الفصول المدرسية وهيكل التعليم.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/10 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>إنشاء فصل جديد</span>
        </button>
      </div>

      {/* قائمة الفصول (Classes Grid) */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => {
            const count = classStudentCounts[c.id] || 0
            const gradeName = gradeNameMap.get(c.grade_id) || 'صف غير محدد'
            return (
              <div
                key={c.id}
                className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all hover:scale-[1.01]"
              >
                {/* تأثير توهج خلفي خفيف */}
                <div className="absolute top-[-30%] left-[-20%] w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{c.name}</h3>
                    <span className="text-xs text-slate-400 block truncate">{gradeName}</span>
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold pt-1">
                      <Users className="h-4 w-4 shrink-0 text-cyan-500" />
                      <span>{count} طالب مسجل</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="p-2 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-900/30 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 rounded-2xl border border-slate-900 bg-slate-950/20">
          <BookOpen className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-sm font-semibold">لا توجد فصول دراسية مضافة حالياً</p>
          <p className="text-xs text-slate-600 mt-1">اضغط على زر "إنشاء فصل جديد" في الأعلى للبدء.</p>
        </div>
      )}

      {/* مودال إنشاء فصل جديد */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold">إنشاء فصل دراسي جديد</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  اسم الفصل الدراسي (مثال: 3 / أ)
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  placeholder="3 / أ"
                  className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  الصف الدراسي العام
                </label>
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">اختر الصف...</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    الفصل الدراسي (الترم)
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-950/80 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="1">الترم الأول</option>
                    <option value="2">الترم الثاني</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    السنة الدراسية
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    required
                    placeholder="2025-2026"
                    className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء الفصل وحفظه'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
