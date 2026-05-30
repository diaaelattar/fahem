'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Search,
  BookOpen,
  Plus,
  Mail,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
  Upload,
  UserPlus
} from 'lucide-react'

interface StudentRegistryClientProps {
  initialStudents: any[]
  schoolClasses: any[]
  grades: any[]
}

export function StudentRegistryClient({ initialStudents, schoolClasses, grades }: StudentRegistryClientProps) {
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  
  // حالات مودال الدعوة
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  // فلاتر التصفية
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    
    // grade_id في جدول students
    const studentGradeId = s.students?.[0]?.grade_id
    const matchesGrade = !gradeFilter || studentGradeId?.toString() === gradeFilter

    // في خيار التصفية حسب الفصل:
    // سنقوم بمطابقة الطلاب المنضمين للفصل
    // أو إذا كان المخزن هو class_section
    const matchesClass = !classFilter // حالياً للتصفية المبسطة
    
    return matchesSearch && matchesGrade && matchesClass
  })

  // خرائط الأسماء
  const gradeNameMap = new Map<number, string>()
  grades.forEach((g) => gradeNameMap.set(g.id, g.name_ar))

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setLoadingInvite(true)
    setGeneratedLink('')
    setCopied(false)

    try {
      const res = await fetch('/api/school/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'student' })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء توليد الدعوة.')
      }

      setGeneratedLink(data.inviteLink)
    } catch (err: any) {
      setInviteError(err.message || 'فشل توليد رابط الدعوة.')
    } finally {
      setLoadingInvite(false)
    }
  }

  const handleCopyLink = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setInviteEmail('')
    setInviteError('')
    setGeneratedLink('')
    setCopied(false)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الترويسة وإجراءات الإضافة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">إدارة شؤون الطلاب</h2>
          <p className="text-xs text-slate-400 mt-1">عرض وتصفية طلاب المدرسة ودعوتهم أو استيرادهم جماعياً.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/school/students/import"
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-sm px-4 py-3 rounded-xl transition-all"
          >
            <Upload className="h-4 w-4 text-cyan-400" />
            <span>استيراد ملف Excel/CSV</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/10"
          >
            <UserPlus className="h-4 w-4" />
            <span>دعوة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث باسم الطالب أو البريد..."
            className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-cyan-500 focus:outline-none"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none min-w-[150px]"
        >
          <option value="">كل الصفوف الدراسية</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name_ar}
            </option>
          ))}
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none min-w-[150px]"
        >
          <option value="">كل الفصول</option>
          {schoolClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* جدول الطلاب */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold bg-slate-900/20">
                  <th className="p-4 font-semibold">اسم الطالب</th>
                  <th className="p-4 font-semibold">البريد الإلكتروني</th>
                  <th className="p-4 font-semibold">الصف الدراسي</th>
                  <th className="p-4 font-semibold text-center">كود الطالب</th>
                  <th className="p-4 font-semibold text-left">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredStudents.map((s) => {
                  const studentGradeId = s.students?.[0]?.grade_id
                  const studentCode = s.students?.[0]?.student_code
                  return (
                    <tr key={s.id} className="text-slate-300 hover:text-white transition-colors">
                      <td className="p-4 font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {s.full_name?.charAt(0) || 'ط'}
                        </div>
                        {s.full_name}
                      </td>
                      <td className="p-4 text-xs text-slate-400">{s.email}</td>
                      <td className="p-4">
                        <span className="text-xs text-slate-300">
                          {gradeNameMap.get(studentGradeId) || 'غير محدد'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-center text-slate-400 font-mono">
                        {studentCode || '—'}
                      </td>
                      <td className="p-4 text-xs text-slate-500 text-left">
                        {new Date(s.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <GraduationCap className="h-12 w-12 text-slate-800 mb-3" />
              <p className="text-sm font-semibold">لم يتم العثور على أي طالب مضاف</p>
              <p className="text-xs text-slate-600 mt-1">تأكد من اختيار الفلاتر الصحيحة أو أضف طالباً جديداً.</p>
            </div>
          )}
        </div>
      </div>

      {/* مودال دعوة طالب جديد */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-bold">توليد دعوة انضمام طالب</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  سيقوم النظام بإنشاء رمز دعوة فريد يربط الطالب بفصل دراسي وبالمدرسة تلقائياً عند إتمام التسجيل.
                </p>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    البريد الإلكتروني للطالب
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="student@school.com"
                    className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                {inviteError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    {inviteError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loadingInvite}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-60"
                >
                  {loadingInvite ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                      جاري التوليد...
                    </>
                  ) : (
                    'إنشاء رمز ورابط الدعوة'
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-900/30 rounded-xl flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white">تم توليد رابط الدعوة بنجاح!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  انسخ الرابط التالي وشاركه مع الطالب ليقوم بالتسجيل والانضمام تلقائياً.
                </p>
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left font-mono text-xs text-slate-300 break-all select-all flex items-center justify-between gap-3">
                  <span className="truncate flex-1 select-all">{generatedLink}</span>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
                >
                  إغلاق النافذة
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
