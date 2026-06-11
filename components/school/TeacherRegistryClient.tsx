'use client'

import { useState } from 'react'
import {
  Users,
  Search,
  BookOpen,
  Plus,
  Mail,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface TeacherRegistryClientProps {
  initialTeachers: any[]
  subjects: any[]
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

export function TeacherRegistryClient({ initialTeachers, subjects }: TeacherRegistryClientProps) {
  const [teachers, setTeachers] = useState(initialTeachers)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  
  // حالات مودال الدعوة
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // تصفية المعلمين بناء على البحث والفلاتر
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
    
    // specialty_id في جدول teachers
    const specialtyId = t.teachers?.[0]?.specialty_id
    const matchesSubject = !subjectFilter || specialtyId?.toString() === subjectFilter
    
    return matchesSearch && matchesSubject
  })

  // خريطة أسماء المواد
  const subjectNameMap = new Map<number, string>()
  subjects.forEach((s) => subjectNameMap.set(s.id, s.name_ar))

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
        body: JSON.stringify({ email: inviteEmail, role: 'teacher' })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء توليد الدعوة.')
      }

      setGeneratedLink(data.inviteLink)
      showToast('تم توليد رابط الدعوة بنجاح ✓', 'success')
    } catch (err: any) {
      setInviteError(err.message || 'فشل توليد رابط الدعوة.')
      showToast(err.message || 'فشل توليد رابط الدعوة.', 'error')
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
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {/* الترويسة وأزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">أعضاء هيئة التدريس</h2>
          <p className="text-xs text-slate-400 mt-1">إضافة، دعوة، ومراقبة المعلمين المسجلين في مدرستك.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/10 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>دعوة معلم جديد</span>
        </button>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث بالاسم أو البريد الإلكتروني..."
            className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-cyan-500 focus:outline-none"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none min-w-[150px]"
        >
          <option value="">كل التخصصات والمواد</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name_ar}
            </option>
          ))}
        </select>
      </div>

      {/* جدول البيانات */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filteredTeachers.length > 0 ? (
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold bg-slate-900/20">
                  <th className="p-4 font-semibold">اسم المعلم</th>
                  <th className="p-4 font-semibold">البريد الإلكتروني</th>
                  <th className="p-4 font-semibold">مادة التخصص</th>
                  <th className="p-4 font-semibold text-center">تاريخ الانضمام</th>
                  <th className="p-4 font-semibold text-left">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredTeachers.map((t) => {
                  const specId = t.teachers?.[0]?.specialty_id
                  return (
                    <tr key={t.id} className="text-slate-300 hover:text-white transition-colors">
                      <td className="p-4 font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                          {t.full_name?.charAt(0) || 'م'}
                        </div>
                        {t.full_name}
                      </td>
                      <td className="p-4 text-xs text-slate-400">{t.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/20 border border-cyan-900/40 px-2.5 py-1 rounded-full w-fit">
                          <BookOpen className="h-3 w-3" />
                          <span>{subjectNameMap.get(specId) || 'عام'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 text-center">
                        {new Date(t.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-left">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-2 py-1 rounded-md">
                          نشط
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Users className="h-12 w-12 text-slate-800 mb-3" />
              <p className="text-sm font-semibold">لم يتم العثور على أي معلم مضاف</p>
              <p className="text-xs text-slate-600 mt-1">تأكد من كتابة الاسم بشكل صحيح أو قم بدعوة معلم جديد.</p>
            </div>
          )}
        </div>
      </div>

      {/* مودال دعوة معلم جديد */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold">توليد دعوة انضمام معلم</h3>
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
                  سيقوم النظام بإنشاء رمز دعوة فريد وتأمين حساب المعلم ليتم ربطه فورياً بمدرستك عند انضمامه.
                </p>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    البريد الإلكتروني للمعلم
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="teacher@school.com"
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
                  انسخ الرابط التالي وشاركه مع المعلم. تنتهي صلاحية الرابط تلقائياً بعد 7 أيام.
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
