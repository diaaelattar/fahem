'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  Lock,
  Printer,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Clock,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react'

interface Props {
  profile: { id: string; full_name: string; email?: string }
  teacher: {
    subject_id?: string
    is_verified?: boolean
    subscription_status?: string
    subscription_ends_at?: string
    print_directorate?: string | null
    print_administration?: string | null
    print_school_name?: string | null
    print_academic_year?: string | null
    print_header_type?: 'official' | 'personal' | 'both'
    teacher_display_name?: string | null
    teacher_title?: string | null
    teacher_phone?: string | null
    teacher_social?: string | null
    teacher_logo_url?: string | null
    teacher_watermark_text?: string | null
    show_watermark?: boolean
  }
  subjectName: string
  allSubjects?: { id: number; name_ar: string }[]
}

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-400'
const labelCls = 'block text-sm font-bold text-slate-700 mb-1.5'

export function TeacherSettingsClient({
  profile,
  teacher,
  subjectName,
  allSubjects,
}: Props) {
  const supabase = createClient()

  /* ── Subject State ── */
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    teacher.subject_id?.toString() || ''
  )
  const [subjectSaving, setSubjectSaving] = useState(false)
  const [subjectMsg, setSubjectMsg] = useState<{
    type: 'ok' | 'err'
    text: string
  } | null>(null)

  const updateSubject = async (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId)
    if (!newSubjectId) return
    setSubjectSaving(true)
    setSubjectMsg(null)
    const { error } = await supabase
      .from('teachers')
      .update({ subject_id: parseInt(newSubjectId) })
      .eq('id', profile.id)
    setSubjectSaving(false)
    if (error) {
      setSubjectMsg({ type: 'err', text: 'فشل حفظ المادة: ' + error.message })
    } else {
      setSubjectMsg({ type: 'ok', text: 'تم تحديث المادة بنجاح ✓' })
      setTimeout(() => setSubjectMsg(null), 3000)
    }
  }

  /* ── Print Settings State ── */
  const [print, setPrint] = useState({
    directorate: teacher.print_directorate ?? '',
    administration: teacher.print_administration ?? '',
    schoolName: teacher.print_school_name ?? '',
    academicYear: teacher.print_academic_year ?? '',
    headerType: (teacher.print_header_type || 'official') as
      | 'official'
      | 'personal'
      | 'both',
    displayName: teacher.teacher_display_name ?? '',
    title: teacher.teacher_title ?? '',
    phone: teacher.teacher_phone ?? '',
    social: teacher.teacher_social ?? '',
    logoUrl: teacher.teacher_logo_url ?? '',
    watermarkText: teacher.teacher_watermark_text ?? '',
    showWatermark: teacher.show_watermark ?? false,
  })
  const [printSaving, setPrintSaving] = useState(false)
  const [printMsg, setPrintMsg] = useState<{
    type: 'ok' | 'err'
    text: string
  } | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  /* ── Password State ── */
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{
    type: 'ok' | 'err'
    text: string
  } | null>(null)

  /* ── Save print settings ── */
  const savePrint = async () => {
    setPrintSaving(true)
    setPrintMsg(null)
    const { error } = await supabase
      .from('teachers')
      .update({
        print_directorate: print.directorate,
        print_administration: print.administration,
        print_school_name: print.schoolName,
        print_academic_year: print.academicYear,
        print_header_type: print.headerType,
        teacher_display_name: print.displayName,
        teacher_title: print.title,
        teacher_phone: print.phone,
        teacher_social: print.social,
        teacher_logo_url: print.logoUrl,
        teacher_watermark_text: print.watermarkText,
        show_watermark: print.showWatermark,
      })
      .eq('id', profile.id)

    setPrintSaving(false)
    setPrintMsg(
      error
        ? { type: 'err', text: 'حدث خطأ أثناء الحفظ: ' + error.message }
        : { type: 'ok', text: 'تم حفظ الإعدادات بنجاح ✓' }
    )
    if (!error) setTimeout(() => setPrintMsg(null), 3000)
  }

  /* ── Upload Logo ── */
  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `teacher_logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('documents').getPublicUrl(filePath)
      setPrint((p) => ({ ...p, logoUrl: data.publicUrl }))
    } catch (err: any) {
      alert('خطأ في رفع اللوجو: ' + err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  /* ── Change password ── */
  const changePassword = async () => {
    setPwMsg(null)
    if (!passwords.next || passwords.next.length < 6) {
      return setPwMsg({
        type: 'err',
        text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
      })
    }
    if (passwords.next !== passwords.confirm) {
      return setPwMsg({
        type: 'err',
        text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين',
      })
    }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({
      password: passwords.next,
    })
    setPwSaving(false)
    if (error) {
      setPwMsg({ type: 'err', text: 'فشل تغيير كلمة المرور: ' + error.message })
    } else {
      setPwMsg({ type: 'ok', text: 'تم تغيير كلمة المرور بنجاح ✓' })
      setPasswords({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwMsg(null), 3000)
    }
  }

  const isTrialActive = !teacher.is_verified && teacher.subscription_ends_at
  const daysLeft = isTrialActive
    ? Math.max(
        0,
        Math.ceil(
          (new Date(teacher.subscription_ends_at!).getTime() - Date.now()) /
            86400000
        )
      )
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">⚙️ الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-500">
          إدارة ملفك الشخصي وإعدادات الطباعة المتقدمة وكلمة المرور
        </p>
      </div>

      {/* ── Account info ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
          <User className="h-5 w-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">معلومات الحساب</h2>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div>
            <label className={labelCls}>الاسم الكامل</label>
            <input className={inputCls} value={profile.full_name} disabled />
          </div>
          <div>
            <label className={labelCls}>البريد الإلكتروني</label>
            <input
              className={inputCls}
              value={profile.email ?? '—'}
              disabled
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelCls}>المادة الدراسية</label>
            {allSubjects && allSubjects.length > 0 ? (
              <div className="space-y-2">
                <select
                  className={inputCls}
                  value={selectedSubjectId}
                  onChange={(e) => updateSubject(e.target.value)}
                  disabled={subjectSaving}
                >
                  <option value="">-- اختر المادة --</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name_ar}
                    </option>
                  ))}
                </select>
                {subjectMsg && (
                  <div
                    className={`text-xs font-bold ${subjectMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {subjectMsg.text}
                  </div>
                )}
              </div>
            ) : (
              <input className={inputCls} value={subjectName || '—'} disabled />
            )}
          </div>
          <div>
            <label className={labelCls}>حالة الاشتراك</label>
            <div className="mt-1 flex items-center gap-2">
              {teacher.is_verified ? (
                <span className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> حساب موثَّق ومفعَّل
                </span>
              ) : isTrialActive ? (
                <span className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700">
                  <Clock className="h-4 w-4" /> فترة تجريبية — {daysLeft} يوم
                  متبقٍ
                </span>
              ) : (
                <span className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700">
                  <AlertCircle className="h-4 w-4" /> انتهت الفترة التجريبية
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Print settings ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
          <Printer className="h-5 w-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">
            تخصيص رأس ورقة الاختبار (الترويسة)
          </h2>
        </div>

        <div className="space-y-8 p-6">
          {/* Header Type */}
          <div>
            <label className="mb-3 block text-base font-black text-slate-800">
              شكل الترويسة عند الطباعة
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'official', label: 'رسمية (مديرية ومدرسة)' },
                { id: 'personal', label: 'شخصية (بيانات المعلم)' },
                { id: 'both', label: 'دمج (رسمية + شخصية)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    setPrint((p) => ({ ...p, headerType: opt.id as any }))
                  }
                  className={`rounded-xl border-2 p-3 text-sm font-bold transition-all ${
                    print.headerType === opt.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Official Data */}
            {(print.headerType === 'official' ||
              print.headerType === 'both') && (
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <h3 className="flex items-center gap-2 font-bold text-slate-700">
                  🏢 البيانات الرسمية
                </h3>
                <div>
                  <label className={labelCls}>مديرية التربية والتعليم</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: القاهرة"
                    value={print.directorate}
                    onChange={(e) =>
                      setPrint((p) => ({ ...p, directorate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>الإدارة التعليمية</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: مصر الجديدة"
                    value={print.administration}
                    onChange={(e) =>
                      setPrint((p) => ({
                        ...p,
                        administration: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>اسم المدرسة</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: مدرسة النور الثانوية"
                    value={print.schoolName}
                    onChange={(e) =>
                      setPrint((p) => ({ ...p, schoolName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>العام الدراسي</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: 2024 / 2025"
                    value={print.academicYear}
                    onChange={(e) =>
                      setPrint((p) => ({ ...p, academicYear: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Personal Data */}
            {(print.headerType === 'personal' ||
              print.headerType === 'both') && (
              <div className="space-y-4 rounded-2xl border border-indigo-50 bg-indigo-50/50 p-5">
                <h3 className="flex items-center gap-2 font-bold text-indigo-800">
                  👨‍🏫 البيانات الشخصية
                </h3>
                <div>
                  <label className={labelCls}>اسم الشهرة للمعلم</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: أ. أحمد علي"
                    value={print.displayName}
                    onChange={(e) =>
                      setPrint((p) => ({ ...p, displayName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>اللقب / الصفة الوظيفية</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: خبير تدريس الفيزياء"
                    value={print.title}
                    onChange={(e) =>
                      setPrint((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>رقم الهاتف</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: 01012345678"
                    value={print.phone}
                    onChange={(e) =>
                      setPrint((p) => ({ ...p, phone: e.target.value }))
                    }
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className={labelCls}>وسائل التواصل (اختياري)</label>
                  <input
                    className={inputCls}
                    autoComplete="off"
                    placeholder="مثال: Youtube: Physics With Ahmed"
                    value={print.social}
                    onChange={(e) =>
                      setPrint((p) => ({ ...p, social: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Logo Upload */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">🖼️ اللوجو الشخصي</h3>
              <div className="flex items-center gap-4">
                {print.logoUrl ? (
                  <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
                    <img
                      src={print.logoUrl}
                      alt="Logo"
                      className="h-full w-full object-contain p-2"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setPrint((p) => ({ ...p, logoUrl: '' }))}
                        className="text-xs font-bold text-white"
                      >
                        إزالة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">
                    {uploadingLogo ? (
                      'جاري الرفع...'
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5" /> رفع صورة لوجو جديد
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadLogo}
                      disabled={uploadingLogo}
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">
                    يفضل استخدام صورة شفافة PNG خلفيتها بيضاء.
                  </p>
                </div>
              </div>
            </div>

            {/* Watermark */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">
                ©️ العلامة المائية لحفظ الحقوق
              </h3>
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="font-bold text-slate-700">
                    تفعيل العلامة المائية في الخلفية
                  </span>
                  <div
                    className={`relative h-6 w-12 rounded-full transition-colors ${print.showWatermark ? 'bg-indigo-500' : 'bg-slate-300'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={print.showWatermark}
                      onChange={(e) =>
                        setPrint((p) => ({
                          ...p,
                          showWatermark: e.target.checked,
                        }))
                      }
                    />
                    <div
                      className={`absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${print.showWatermark ? '-translate-x-6' : 'translate-x-0'}`}
                    />
                  </div>
                </label>
                {print.showWatermark && (
                  <div>
                    <label className={labelCls}>نص العلامة المائية</label>
                    <input
                      className={inputCls}
                      placeholder="مثال: سلسلة الاستباق - أ. أحمد علي"
                      value={print.watermarkText}
                      onChange={(e) =>
                        setPrint((p) => ({
                          ...p,
                          watermarkText: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mt-8">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
              👀 معاينة حية للترويسة
            </h3>
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6">
              {print.showWatermark && print.watermarkText && (
                <div className="pointer-events-none absolute inset-0 flex rotate-[-35deg] items-center justify-center overflow-hidden whitespace-nowrap text-6xl font-black opacity-5">
                  {print.watermarkText.repeat(10)}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                {/* Right Side */}
                <div className="flex-1 text-right font-semibold leading-relaxed">
                  {(print.headerType === 'official' ||
                    print.headerType === 'both') && (
                    <>
                      <div>محافظة: {print.directorate || '..............'}</div>
                      <div>
                        إدارة: {print.administration || '..............'}
                      </div>
                      <div>مدرسة: {print.schoolName || '..............'}</div>
                    </>
                  )}
                  {print.headerType === 'personal' && (
                    <>
                      <div className="text-lg font-black">
                        {print.displayName || 'اسم المعلم'}
                      </div>
                      <div className="text-slate-600">
                        {print.title || 'اللقب الوظيفي'}
                      </div>
                      <div className="text-slate-500">
                        {print.phone || 'رقم الهاتف'}
                      </div>
                    </>
                  )}
                </div>

                {/* Center Logo */}
                <div className="flex flex-1 flex-col items-center justify-center">
                  {print.logoUrl ? (
                    <img
                      src={print.logoUrl}
                      alt="Logo"
                      className="max-h-16 object-contain"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                  <div className="mt-2 font-black">
                    اختبار الفصل الدراسي الأول
                  </div>
                  <div className="text-xs">المادة: {subjectName}</div>
                </div>

                {/* Left Side */}
                <div
                  className="flex-1 text-left font-semibold leading-relaxed"
                  dir="ltr"
                >
                  {print.headerType === 'both' && (
                    <>
                      <div className="text-right text-lg font-black" dir="rtl">
                        {print.displayName || 'اسم المعلم'}
                      </div>
                      <div className="text-right text-slate-600" dir="rtl">
                        {print.title || 'اللقب الوظيفي'}
                      </div>
                      <div className="text-right text-slate-500" dir="rtl">
                        {print.phone || 'رقم الهاتف'}
                      </div>
                    </>
                  )}
                  {print.headerType !== 'both' && (
                    <>
                      <div className="text-right" dir="rtl">
                        العام: {print.academicYear || '2024 / 2025'}
                      </div>
                      <div className="text-right" dir="rtl">
                        الزمن: ساعتان
                      </div>
                      <div className="text-right" dir="rtl">
                        الدرجة: 50
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {printMsg && (
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${printMsg.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}
              >
                {printMsg.type === 'ok' ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {printMsg.text}
              </div>
            )}

            <button
              onClick={savePrint}
              disabled={printSaving || uploadingLogo}
              className="mr-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {printSaving ? 'جاري الحفظ…' : 'حفظ إعدادات الترويسة والطباعة'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Change password ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
          <Lock className="h-5 w-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">تغيير كلمة المرور</h2>
        </div>
        <div className="space-y-5 p-6">
          <div className="relative">
            <label className={labelCls}>كلمة المرور الجديدة</label>
            <input
              type={showPw ? 'text' : 'password'}
              className={inputCls + ' pl-11'}
              placeholder="6 أحرف على الأقل"
              value={passwords.next}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, next: e.target.value }))
              }
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute left-3 top-10 text-slate-400 hover:text-slate-600"
            >
              {showPw ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div>
            <label className={labelCls}>تأكيد كلمة المرور الجديدة</label>
            <input
              type={showPw ? 'text' : 'password'}
              className={inputCls}
              placeholder="أعد كتابة كلمة المرور"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              dir="ltr"
            />
          </div>

          {pwMsg && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${pwMsg.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}
            >
              {pwMsg.type === 'ok' ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {pwMsg.text}
            </div>
          )}

          <button
            onClick={changePassword}
            disabled={pwSaving || !passwords.next || !passwords.confirm}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-700 active:scale-95 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {pwSaving ? 'جاري التغيير…' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </section>
    </div>
  )
}
