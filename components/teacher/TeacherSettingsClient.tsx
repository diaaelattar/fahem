'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User, Lock, Printer, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, ShieldCheck, Clock,
  UploadCloud, Image as ImageIcon
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

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-400'
const labelCls = 'block text-sm font-bold text-slate-700 mb-1.5'

export function TeacherSettingsClient({ profile, teacher, subjectName, allSubjects }: Props) {
  const supabase = createClient()

  /* ── Subject State ── */
  const [selectedSubjectId, setSelectedSubjectId] = useState(teacher.subject_id?.toString() || '')
  const [subjectSaving, setSubjectSaving] = useState(false)
  const [subjectMsg, setSubjectMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const updateSubject = async (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId)
    if (!newSubjectId) return
    setSubjectSaving(true)
    setSubjectMsg(null)
    const { error } = await supabase.from('teachers').update({ subject_id: parseInt(newSubjectId) }).eq('id', profile.id)
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
    headerType: (teacher.print_header_type || 'official') as 'official' | 'personal' | 'both',
    displayName: teacher.teacher_display_name ?? '',
    title: teacher.teacher_title ?? '',
    phone: teacher.teacher_phone ?? '',
    social: teacher.teacher_social ?? '',
    logoUrl: teacher.teacher_logo_url ?? '',
    watermarkText: teacher.teacher_watermark_text ?? '',
    showWatermark: teacher.show_watermark ?? false,
  })
  const [printSaving, setPrintSaving] = useState(false)
  const [printMsg, setPrintMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  /* ── Password State ── */
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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
    setPrintMsg(error
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
      
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage.from('documents').getPublicUrl(filePath)
      setPrint(p => ({ ...p, logoUrl: data.publicUrl }))
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
      return setPwMsg({ type: 'err', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' })
    }
    if (passwords.next !== passwords.confirm) {
      return setPwMsg({ type: 'err', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين' })
    }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.next })
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
    ? Math.max(0, Math.ceil((new Date(teacher.subscription_ends_at!).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">⚙️ الإعدادات</h1>
        <p className="text-slate-500 text-sm mt-1">إدارة ملفك الشخصي وإعدادات الطباعة المتقدمة وكلمة المرور</p>
      </div>

      {/* ── Account info ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <User className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">معلومات الحساب</h2>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>الاسم الكامل</label>
            <input className={inputCls} value={profile.full_name} disabled />
          </div>
          <div>
            <label className={labelCls}>البريد الإلكتروني</label>
            <input className={inputCls} value={profile.email ?? '—'} disabled dir="ltr" />
          </div>
          <div>
            <label className={labelCls}>المادة الدراسية</label>
            {allSubjects && allSubjects.length > 0 ? (
              <div className="space-y-2">
                <select
                  className={inputCls}
                  value={selectedSubjectId}
                  onChange={e => updateSubject(e.target.value)}
                  disabled={subjectSaving}
                >
                  <option value="">-- اختر المادة --</option>
                  {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                </select>
                {subjectMsg && (
                  <div className={`text-xs font-bold ${subjectMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
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
            <div className="flex items-center gap-2 mt-1">
              {teacher.is_verified ? (
                <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" /> حساب موثَّق ومفعَّل
                </span>
              ) : isTrialActive ? (
                <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm">
                  <Clock className="w-4 h-4" /> فترة تجريبية — {daysLeft} يوم متبقٍ
                </span>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" /> انتهت الفترة التجريبية
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Print settings ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Printer className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">تخصيص رأس ورقة الاختبار (الترويسة)</h2>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Header Type */}
          <div>
            <label className="block text-base font-black text-slate-800 mb-3">شكل الترويسة عند الطباعة</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'official', label: 'رسمية (مديرية ومدرسة)' },
                { id: 'personal', label: 'شخصية (بيانات المعلم)' },
                { id: 'both', label: 'دمج (رسمية + شخصية)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPrint(p => ({ ...p, headerType: opt.id as any }))}
                  className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
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

          <div className="grid md:grid-cols-2 gap-8">
            {/* Official Data */}
            {(print.headerType === 'official' || print.headerType === 'both') && (
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">🏢 البيانات الرسمية</h3>
                <div>
                  <label className={labelCls}>مديرية التربية والتعليم</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: القاهرة" value={print.directorate} onChange={e => setPrint(p => ({ ...p, directorate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>الإدارة التعليمية</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: مصر الجديدة" value={print.administration} onChange={e => setPrint(p => ({ ...p, administration: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>اسم المدرسة</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: مدرسة النور الثانوية" value={print.schoolName} onChange={e => setPrint(p => ({ ...p, schoolName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>العام الدراسي</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: 2024 / 2025" value={print.academicYear} onChange={e => setPrint(p => ({ ...p, academicYear: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Personal Data */}
            {(print.headerType === 'personal' || print.headerType === 'both') && (
              <div className="space-y-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-50">
                <h3 className="font-bold text-indigo-800 flex items-center gap-2">👨‍🏫 البيانات الشخصية</h3>
                <div>
                  <label className={labelCls}>اسم الشهرة للمعلم</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: أ. أحمد علي" value={print.displayName} onChange={e => setPrint(p => ({ ...p, displayName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>اللقب / الصفة الوظيفية</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: خبير تدريس الفيزياء" value={print.title} onChange={e => setPrint(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>رقم الهاتف</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: 01012345678" value={print.phone} onChange={e => setPrint(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className={labelCls}>وسائل التواصل (اختياري)</label>
                  <input className={inputCls} autoComplete="off" placeholder="مثال: Youtube: Physics With Ahmed" value={print.social} onChange={e => setPrint(p => ({ ...p, social: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Logo Upload */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">🖼️ اللوجو الشخصي</h3>
              <div className="flex items-center gap-4">
                {print.logoUrl ? (
                  <div className="relative group w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden bg-white shrink-0">
                    <img src={print.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => setPrint(p => ({ ...p, logoUrl: '' }))} className="text-white text-xs font-bold">إزالة</button>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl cursor-pointer transition-colors border border-slate-200">
                    {uploadingLogo ? 'جاري الرفع...' : <><UploadCloud className="w-5 h-5" /> رفع صورة لوجو جديد</>}
                    <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploadingLogo} />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">يفضل استخدام صورة شفافة PNG خلفيتها بيضاء.</p>
                </div>
              </div>
            </div>

            {/* Watermark */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">©️ العلامة المائية لحفظ الحقوق</h3>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-slate-700">تفعيل العلامة المائية في الخلفية</span>
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${print.showWatermark ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <input type="checkbox" className="hidden" checked={print.showWatermark} onChange={e => setPrint(p => ({ ...p, showWatermark: e.target.checked }))} />
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform right-1 ${print.showWatermark ? '-translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </label>
                {print.showWatermark && (
                  <div>
                    <label className={labelCls}>نص العلامة المائية</label>
                    <input className={inputCls} placeholder="مثال: سلسلة الاستباق - أ. أحمد علي" value={print.watermarkText} onChange={e => setPrint(p => ({ ...p, watermarkText: e.target.value }))} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mt-8">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">👀 معاينة حية للترويسة</h3>
            <div className="bg-white border-2 border-dashed border-slate-300 p-6 rounded-2xl relative overflow-hidden">
              {print.showWatermark && print.watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-35deg] text-6xl font-black whitespace-nowrap overflow-hidden">
                  {print.watermarkText.repeat(10)}
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                {/* Right Side */}
                <div className="text-right flex-1 font-semibold leading-relaxed">
                  {(print.headerType === 'official' || print.headerType === 'both') && (
                    <>
                      <div>محافظة: {print.directorate || '..............'}</div>
                      <div>إدارة: {print.administration || '..............'}</div>
                      <div>مدرسة: {print.schoolName || '..............'}</div>
                    </>
                  )}
                  {print.headerType === 'personal' && (
                    <>
                      <div className="text-lg font-black">{print.displayName || 'اسم المعلم'}</div>
                      <div className="text-slate-600">{print.title || 'اللقب الوظيفي'}</div>
                      <div className="text-slate-500">{print.phone || 'رقم الهاتف'}</div>
                    </>
                  )}
                </div>

                {/* Center Logo */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  {print.logoUrl ? (
                    <img src={print.logoUrl} alt="Logo" className="max-h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                  <div className="font-black mt-2">اختبار الفصل الدراسي الأول</div>
                  <div className="text-xs">المادة: {subjectName}</div>
                </div>

                {/* Left Side */}
                <div className="text-left flex-1 font-semibold leading-relaxed" dir="ltr">
                  {print.headerType === 'both' && (
                    <>
                      <div className="text-lg font-black text-right" dir="rtl">{print.displayName || 'اسم المعلم'}</div>
                      <div className="text-slate-600 text-right" dir="rtl">{print.title || 'اللقب الوظيفي'}</div>
                      <div className="text-slate-500 text-right" dir="rtl">{print.phone || 'رقم الهاتف'}</div>
                    </>
                  )}
                  {print.headerType !== 'both' && (
                    <>
                      <div className="text-right" dir="rtl">العام: {print.academicYear || '2024 / 2025'}</div>
                      <div className="text-right" dir="rtl">الزمن: ساعتان</div>
                      <div className="text-right" dir="rtl">الدرجة: 50</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {printMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${printMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {printMsg.type === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {printMsg.text}
              </div>
            )}
            
            <button
              onClick={savePrint}
              disabled={printSaving || uploadingLogo}
              className="mr-auto flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
            >
              <Save className="w-5 h-5" />
              {printSaving ? 'جاري الحفظ…' : 'حفظ إعدادات الترويسة والطباعة'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Change password ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Lock className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">تغيير كلمة المرور</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="relative">
            <label className={labelCls}>كلمة المرور الجديدة</label>
            <input
              type={showPw ? 'text' : 'password'}
              className={inputCls + ' pl-11'}
              placeholder="6 أحرف على الأقل"
              value={passwords.next}
              onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
              dir="ltr"
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute left-3 top-10 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div>
            <label className={labelCls}>تأكيد كلمة المرور الجديدة</label>
            <input
              type={showPw ? 'text' : 'password'}
              className={inputCls}
              placeholder="أعد كتابة كلمة المرور"
              value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              dir="ltr"
            />
          </div>

          {pwMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${pwMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {pwMsg.type === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {pwMsg.text}
            </div>
          )}

          <button
            onClick={changePassword}
            disabled={pwSaving || !passwords.next || !passwords.confirm}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
          >
            <Lock className="w-4 h-4" />
            {pwSaving ? 'جاري التغيير…' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </section>

    </div>
  )
}
