'use client'

import { useState, useRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { createClient } from '@/lib/supabase/client'
import {
  FileSpreadsheet,
  Search,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react'

interface ExamManagerClientProps {
  initialExams: any[]
  subjects: any[]
  grades: any[]
  teachers: any[]
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
  examTitle,
  onConfirm,
  onCancel,
  loading
}: {
  examTitle: string
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
      aria-labelledby="confirm-exam-delete-title"
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
            <h3 id="confirm-exam-delete-title" className="text-base font-bold text-white">تأكيد حذف الامتحان</h3>
            <p className="text-xs text-slate-400 mt-0.5">هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
        </div>

        <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4">
          <p className="text-sm text-rose-300 leading-relaxed">
            هل أنت متأكد من حذف الامتحان <span className="font-bold text-white">&quot;{examTitle}&quot;</span> نهائياً؟
            <br />
            <span className="text-xs text-rose-400/80 mt-1 block">ستُحذف جميع نتائج الطلاب المرتبطة به بشكل دائم.</span>
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {loading ? 'جارٍ الحذف...' : 'نعم، احذف الامتحان'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ExamManagerClient({
  initialExams,
  subjects,
  grades,
  teachers
}: ExamManagerClientProps) {
  const supabase = createClient()
  const [exams, setExams] = useState(initialExams)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  // حالات تأكيد الحذف
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // خرائط الأسماء
  const subjectMap = new Map<number, string>()
  subjects.forEach((s) => subjectMap.set(s.id, s.name_ar))

  const gradeMap = new Map<number, string>()
  grades.forEach((g) => gradeMap.set(g.id, g.name_ar))

  const teacherMap = new Map<string, string>()
  teachers.forEach((t) => teacherMap.set(t.id, t.full_name))

  const filteredExams = exams.filter((e) => {
    const matchesSearch = e.title?.toLowerCase().includes(search.toLowerCase())
    const matchesSubject = !subjectFilter || e.subject_id?.toString() === subjectFilter
    return matchesSearch && matchesSubject
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_published: !currentStatus })
        .eq('id', id)

      if (error) throw new Error(error.message)

      setExams(
        exams.map((e) => (e.id === id ? { ...e, is_published: !currentStatus } : e))
      )
      showToast(
        !currentStatus ? 'تم نشر الامتحان للطلاب ✓' : 'تم إخفاء الامتحان عن الطلاب.',
        'success'
      )
    } catch (err: any) {
      showToast('فشل تعديل حالة النشر: ' + err.message, 'error')
    }
  }

  const handleDeleteExam = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', deleteTarget.id)

      if (error) throw new Error(error.message)

      setExams(exams.filter((e) => e.id !== deleteTarget.id))
      showToast(`تم حذف الامتحان "${deleteTarget.title}" بنجاح.`, 'success')
    } catch (err: any) {
      showToast('فشل حذف الامتحان: ' + err.message, 'error')
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
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
          examTitle={deleteTarget.title}
          onConfirm={handleDeleteExam}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* الترويسة */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white">إدارة الامتحانات المدرسية</h2>
        <p className="text-xs text-slate-400 mt-1">مراقبة، تفعيل، وإلغاء الامتحانات المنشأة بواسطة معلمي المدرسة.</p>
      </div>

      {/* البحث والتصفية */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث باسم الامتحان..."
            className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-cyan-500 focus:outline-none"
            aria-label="بحث في الامتحانات"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none min-w-[150px]"
          aria-label="تصفية حسب المادة"
        >
          <option value="">كل المواد</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name_ar}
            </option>
          ))}
        </select>
      </div>

      {/* الجدول */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filteredExams.length > 0 ? (
            <table className="w-full text-right text-sm" role="table" aria-label="جدول الامتحانات المدرسية">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold bg-slate-900/20">
                  <th className="p-4 font-semibold" scope="col">عنوان الامتحان</th>
                  <th className="p-4 font-semibold" scope="col">بواسطة المعلم</th>
                  <th className="p-4 font-semibold" scope="col">الصف والمادة</th>
                  <th className="p-4 font-semibold text-center" scope="col">الأسئلة والدرجة</th>
                  <th className="p-4 font-semibold text-center" scope="col">حالة النشر</th>
                  <th className="p-4 font-semibold text-left" scope="col">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredExams.map((e) => (
                  <tr key={e.id} className="text-slate-300 hover:text-white transition-colors">
                    <td className="p-4 font-semibold text-white max-w-[220px] truncate">{e.title}</td>
                    <td className="p-4 text-xs text-slate-400">
                      {teacherMap.get(e.teacher_id) || 'معلم بالمدرسة'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-300">{subjectMap.get(e.subject_id) || 'مادة عامة'}</span>
                        <span className="text-[10px] text-slate-500">{gradeMap.get(e.grade_id) || 'صف عام'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-center">
                      <div className="flex flex-col gap-0.5">
                        <span>{e.questions_count || 0} أسئلة</span>
                        <span className="text-[10px] text-slate-500">{e.total_points || 0} درجة</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(e.id, e.is_published)}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all ${
                          e.is_published
                            ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40'
                            : 'text-amber-400 bg-amber-950/20 border-amber-900/40'
                        }`}
                        aria-label={e.is_published ? `إخفاء امتحان ${e.title}` : `نشر امتحان ${e.title}`}
                        aria-pressed={e.is_published}
                      >
                        {e.is_published ? (
                          <>
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            <span>منشور</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" aria-hidden="true" />
                            <span>مخفي</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => setDeleteTarget({ id: e.id, title: e.title })}
                        className="p-2 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-900/30 transition-colors"
                        aria-label={`حذف امتحان ${e.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500" role="status">
              <FileSpreadsheet className="h-12 w-12 text-slate-800 mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold">لا توجد اختبارات مضافة حالياً</p>
              <p className="text-xs text-slate-600 mt-1">تظهر هنا الامتحانات المنشأة بواسطة المعلمين في المدرسة.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
