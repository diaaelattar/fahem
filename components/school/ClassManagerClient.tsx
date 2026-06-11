'use client'

import { useState, useRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  Plus,
  Trash2,
  Users,
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'

interface ClassManagerClientProps {
  initialClasses: any[]
  grades: any[]
  classStudentCounts: { [classId: string]: number }
  schoolId: string
}

// ======= Toast Component =======
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 ${
        type === 'success'
          ? 'bg-emerald-950/90 border-emerald-800/50 text-emerald-300 backdrop-blur-xl'
          : 'bg-red-950/90 border-red-800/50 text-red-300 backdrop-blur-xl'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {type === 'success'
        ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        : <AlertCircle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />}
      <span>{message}</span>
      <button onClick={onClose} className="mr-1 text-current opacity-60 hover:opacity-100 transition-opacity" aria-label="إغلاق الإشعار">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ======= Confirm Delete Modal =======
function ConfirmDeleteModal({
  targetName,
  onConfirm,
  onCancel,
  loading
}: {
  targetName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, true, onCancel)

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-rose-900/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-rose-400" aria-hidden="true" />
          </div>
          <div>
            <h3 id="confirm-delete-title" className="text-base font-bold text-white">تأكيد حذف الفصل</h3>
            <p className="text-xs text-slate-400 mt-0.5">هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
        </div>

        <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4">
          <p className="text-sm text-rose-300 leading-relaxed">
            هل أنت متأكد من حذف الفصل <span className="font-bold text-white">&quot;{targetName}&quot;</span>؟
            <br />
            <span className="text-xs text-rose-400/80 mt-1 block">سيتم فصل جميع الطلاب المرتبطين به تلقائياً.</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl text-sm transition-colors"
          >
            إلغاء الأمر
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
            {loading ? 'جارٍ الحذف...' : 'نعم، احذف الفصل'}
          </button>
        </div>
      </div>
    </div>
  )
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

  // حالات تأكيد الحذف
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // حقول نموذج إنشاء فصل جديد
  const [className, setClassName] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [semester, setSemester] = useState('1')
  const [error, setError] = useState('')

  // خريطة لتسريع البحث عن أسماء الصفوف
  const gradeNameMap = new Map<number, string>()
  grades.forEach((g) => gradeNameMap.set(g.id, g.name_ar))

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

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
        setClasses([data[0], ...classes])
        handleCloseModal()
        showToast(`تم إنشاء الفصل "${className}" بنجاح ✓`, 'success')
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الفصل.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)

    try {
      const { error: deleteError } = await supabase
        .from('school_classes')
        .delete()
        .eq('id', deleteTarget.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setClasses(classes.filter((c) => c.id !== deleteTarget.id))
      showToast(`تم حذف الفصل "${deleteTarget.name}" بنجاح.`, 'success')
    } catch (err: any) {
      showToast('فشل حذف الفصل: ' + err.message, 'error')
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
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
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          targetName={deleteTarget.name}
          onConfirm={handleDeleteClass}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* الترويسة وإجراءات الإضافة */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">إدارة الفصول الدراسية</h2>
          <p className="text-xs text-slate-400 mt-1">تنسيق وتوزيع وتعيين الفصول المدرسية وهيكل التعليم.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/10 shrink-0"
          aria-label="إنشاء فصل دراسي جديد"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>إنشاء فصل جديد</span>
        </button>
      </div>

      {/* قائمة الفصول (Classes Grid) */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="قائمة الفصول الدراسية">
          {classes.map((c) => {
            const count = classStudentCounts[c.id] || 0
            const gradeName = gradeNameMap.get(c.grade_id) || 'صف غير محدد'
            return (
              <div
                key={c.id}
                className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all hover:scale-[1.01]"
                role="listitem"
              >
                {/* تأثير توهج خلفي خفيف */}
                <div className="absolute top-[-30%] left-[-20%] w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" aria-hidden="true" />

                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{c.name}</h3>
                    <span className="text-xs text-slate-400 block truncate">{gradeName}</span>
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold pt-1">
                      <Users className="h-4 w-4 shrink-0 text-cyan-500" aria-hidden="true" />
                      <span>{count} طالب مسجل</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                    className="p-2 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-900/30 transition-colors shrink-0"
                    aria-label={`حذف فصل ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 rounded-2xl border border-slate-900 bg-slate-950/20" role="status">
          <BookOpen className="h-12 w-12 text-slate-800 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold">لا توجد فصول دراسية مضافة حالياً</p>
          <p className="text-xs text-slate-600 mt-1">اضغط على زر &quot;إنشاء فصل جديد&quot; في الأعلى للبدء.</p>
        </div>
      )}

      {/* مودال إنشاء فصل جديد */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-class-title"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" aria-hidden="true" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                <h3 id="create-class-title" className="text-lg font-bold">إنشاء فصل دراسي جديد</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="إغلاق النافذة"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label htmlFor="class-name-input" className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  اسم الفصل الدراسي (مثال: 3 / أ)
                </label>
                <input
                  id="class-name-input"
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  placeholder="3 / أ"
                  className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="grade-select-input" className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  الصف الدراسي العام
                </label>
                <select
                  id="grade-select-input"
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
                  <label htmlFor="semester-select-input" className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    الفصل الدراسي (الترم)
                  </label>
                  <select
                    id="semester-select-input"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-950/80 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="1">الترم الأول</option>
                    <option value="2">الترم الثاني</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="academic-year-input" className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    السنة الدراسية
                  </label>
                  <input
                    id="academic-year-input"
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
                <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-xs text-red-400" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
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
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-200" aria-hidden="true" />
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
