'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  School,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Settings,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface SchoolManagerClientProps {
  initialSchools: any[]
}

export function SchoolManagerClient({ initialSchools }: SchoolManagerClientProps) {
  const supabase = createClient()
  const [schools, setSchools] = useState(initialSchools)
  const [search, setSearch] = useState('')
  
  // حالات مودال إنشاء مدرسة جديدة
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [district, setDistrict] = useState('')
  const [type, setType] = useState('private')
  const [stage, setStage] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // حساب مدير المدرسة تلقائياً
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // حالات مودال التأكيد للعمليات الحرجة
  const [confirmData, setConfirmData] = useState<{
    type: 'status' | 'plan'
    schoolId: string
    currentStatus?: boolean
    newPlan?: string
    message: string
  } | null>(null)

  // Refs للمودالات لتفعيل Focus Trap
  const createModalRef = useRef<HTMLDivElement>(null)
  const confirmModalRef = useRef<HTMLDivElement>(null)

  // تفعيل Focus Trap للمودالات
  useFocusTrap(createModalRef, isModalOpen, () => handleCloseModal())
  useFocusTrap(confirmModalRef, !!confirmData, () => setConfirmData(null))

  const filteredSchools = schools.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.slug?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/create-school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          governorate,
          district,
          type,
          stage,
          adminName: adminName.trim() || null,
          adminEmail: adminEmail.trim() || null,
          adminPassword: adminPassword || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'حدث خطأ غير متوقع أثناء التسجيل.')
      }

      if (result.success && result.school) {
        setSchools([result.school, ...schools])
        toast.success('تم تسجيل المدرسة وحساب المدير بنجاح!')
        handleCloseModal()
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل المدرسة.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActiveClick = (school: any) => {
    setConfirmData({
      type: 'status',
      schoolId: school.id,
      currentStatus: school.is_active,
      message: `هل أنت متأكد من أنك تريد ${school.is_active ? 'إيقاف تفعيل' : 'تفعيل'} مدرسة "${school.name}"؟`,
    })
  }

  const handleUpdatePlanClick = (school: any, plan: string) => {
    setConfirmData({
      type: 'plan',
      schoolId: school.id,
      newPlan: plan,
      message: `هل أنت متأكد من تغيير باقة مدرسة "${school.name}" إلى الباقة "${plan.toUpperCase()}"؟`,
    })
  }

  const handleConfirmAction = async () => {
    if (!confirmData) return
    const { type, schoolId, currentStatus, newPlan } = confirmData
    setConfirmData(null)

    if (type === 'status') {
      try {
        const { error } = await supabase
          .from('schools')
          .update({ is_active: !currentStatus })
          .eq('id', schoolId)

        if (error) throw new Error(error.message)

        setSchools(
          schools.map((s) => (s.id === schoolId ? { ...s, is_active: !currentStatus } : s))
        )
        toast.success('تم تحديث حالة تفعيل المدرسة بنجاح!')
      } catch (err: any) {
        toast.error('فشل تعديل حالة تفعيل المدرسة: ' + err.message)
      }
    } else if (type === 'plan') {
      try {
        const { error } = await supabase
          .from('schools')
          .update({ subscription_plan: newPlan })
          .eq('id', schoolId)

        if (error) throw new Error(error.message)

        setSchools(
          schools.map((s) => (s.id === schoolId ? { ...s, subscription_plan: newPlan } : s))
        )
        toast.success('تم تحديث باقة الاشتراك بنجاح!')
      } catch (err: any) {
        toast.error('فشل تحديث باقة الاشتراك: ' + err.message)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setName('')
    setSlug('')
    setGovernorate('')
    setDistrict('')
    setType('private')
    setStage('all')
    setError('')
    setAdminName('')
    setAdminEmail('')
    setAdminPassword('')
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الترويسة والإجراءات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">إدارة المؤسسات والمدارس</h2>
          <p className="text-xs text-slate-500 mt-1">تفعيل الحسابات المدرسية وتنسيق الباقات وتراخيص العمل للمؤسسات.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-lg shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>تسجيل مدرسة جديدة</span>
        </button>
      </div>

      {/* البحث والتصفية */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث باسم المدرسة أو المعرف..."
          aria-label="البحث باسم المدرسة أو المعرف"
          className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>

      {/* الجدول */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredSchools.length > 0 ? (
            <table className="w-full text-right text-sm" role="table">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold bg-slate-50">
                  <th className="p-4 font-semibold" scope="col">اسم المدرسة</th>
                  <th className="p-4 font-semibold" scope="col">رابط المعرّف (Slug)</th>
                  <th className="p-4 font-semibold" scope="col">نوع المرحلة</th>
                  <th className="p-4 font-semibold text-center" scope="col">الباقة الحالية</th>
                  <th className="p-4 font-semibold text-center" scope="col">الحالة</th>
                  <th className="p-4 font-semibold text-left" scope="col">التفعيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSchools.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-primary">
                        <School className="h-4.5 w-4.5" aria-hidden="true" />
                      </div>
                      {s.name}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500">{s.slug}</td>
                    <td className="p-4 text-xs">
                      {s.governorate} — {s.district || 'عام'}
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={s.subscription_plan}
                        onChange={(e) => handleUpdatePlanClick(s, e.target.value)}
                        aria-label={`تعديل باقة مدرسة ${s.name}`}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="free">مجاني (Free)</option>
                        <option value="basic">أساسي (Basic)</option>
                        <option value="pro">شامل (Pro)</option>
                        <option value="enterprise">مؤسسي (Enterprise)</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        s.is_active
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {s.is_active ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => handleToggleActiveClick(s)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          s.is_active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        aria-label={s.is_active ? `إيقاف تفعيل مدرسة ${s.name}` : `تفعيل مدرسة ${s.name}`}
                      >
                        {s.is_active ? 'إيقاف التفعيل' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <School className="h-12 w-12 text-slate-200 mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold">لا توجد مدارس مسجلة حالياً</p>
            </div>
          )}
        </div>
      </div>

      {/* مودال إضافة مدرسة جديدة */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-school-modal-title"
        >
          <div
            ref={createModalRef}
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-slate-800">
                <School className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 id="create-school-modal-title" className="text-lg font-bold">تسجيل مدرسة جديدة بالمنصة</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="إغلاق نافذة التسجيل"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label htmlFor="school-name-input" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  اسم المدرسة بالكامل
                </label>
                <input
                  id="school-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="مدرسة المستقبل الخاصة"
                  className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="school-slug-input" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  معرّف الرابط اللاتيني الفريد (Slug)
                </label>
                <input
                  id="school-slug-input"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="future-school"
                  className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="school-gov-input" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    المحافظة
                  </label>
                  <input
                    id="school-gov-input"
                    type="text"
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    required
                    placeholder="القاهرة"
                    className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="school-dist-input" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    الإدارة التعليمية
                  </label>
                  <input
                    id="school-dist-input"
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="إدارة النزهة"
                    className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="school-type-select" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    النوع
                  </label>
                  <select
                    id="school-type-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="public">حكومي</option>
                    <option value="private">خاص</option>
                    <option value="language">لغات</option>
                    <option value="azhar">أزهري</option>
                    <option value="technical">فني</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="school-stage-select" className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    المراحل
                  </label>
                  <select
                    id="school-stage-select"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="primary">ابتدائي</option>
                    <option value="preparatory">إعدادي</option>
                    <option value="secondary">ثانوي</option>
                    <option value="all">الكل</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                  <span>👤 حساب مدير المدرسة (اختياري)</span>
                </div>
                
                <div>
                  <label htmlFor="school-admin-name" className="mb-1.5 block text-[11px] font-bold text-slate-500 uppercase">
                    اسم مدير الحساب
                  </label>
                  <input
                    id="school-admin-name"
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="أحمد علي"
                    className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="school-admin-email" className="mb-1.5 block text-[11px] font-bold text-slate-500 uppercase">
                      البريد الإلكتروني للقرين
                    </label>
                    <input
                      id="school-admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@school.com"
                      className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="school-admin-password" className="mb-1.5 block text-[11px] font-bold text-slate-500 uppercase">
                      كلمة مرور الحساب
                    </label>
                    <input
                      id="school-admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white hover:bg-primary/95 transition-all shadow-md disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
                    جاري التسجيل...
                  </>
                ) : (
                  'تسجيل المدرسة وحفظها'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مودال التأكيد الموحد للعمليات الحرجة */}
      {confirmData && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            ref={confirmModalRef}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
              <AlertCircle className="h-6 w-6 text-amber-500" aria-hidden="true" />
            </div>
            
            <div className="space-y-2">
              <h3 id="confirm-modal-title" className="text-base font-extrabold text-slate-800">تأكيد الإجراء الحرج</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{confirmData.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmData(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-600/10"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
