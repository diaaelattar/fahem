'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileSpreadsheet,
  Search,
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface ExamManagerClientProps {
  initialExams: any[]
  subjects: any[]
  grades: any[]
  teachers: any[]
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
    } catch (err: any) {
      alert('فشل تعديل حالة النشر: ' + err.message)
    }
  }

  const handleDeleteExam = async (id: string) => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذا الامتحان نهائياً؟')
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)

      setExams(exams.filter((e) => e.id !== id))
    } catch (err: any) {
      alert('فشل حذف الامتحان: ' + err.message)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
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
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none min-w-[150px]"
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
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold bg-slate-900/20">
                  <th className="p-4 font-semibold">عنوان الامتحان</th>
                  <th className="p-4 font-semibold">بواسطة المعلم</th>
                  <th className="p-4 font-semibold">الصف والمادة</th>
                  <th className="p-4 font-semibold text-center">الأسئلة والدرجة</th>
                  <th className="p-4 font-semibold text-center">حالة النشر</th>
                  <th className="p-4 font-semibold text-left">إجراءات</th>
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
                      >
                        {e.is_published ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>منشور</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>مخفي</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => handleDeleteExam(e.id)}
                        className="p-2 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-900/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <FileSpreadsheet className="h-12 w-12 text-slate-800 mb-3" />
              <p className="text-sm font-semibold">لا توجد اختبارات مضافة حالياً</p>
              <p className="text-xs text-slate-600 mt-1">تظهر هنا الامتحانات المنشأة بواسطة المعلمين في المدرسة.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
