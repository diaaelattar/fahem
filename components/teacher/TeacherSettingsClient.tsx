'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User, Lock, Printer, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, ShieldCheck, Clock
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
  }
  subjectName: string
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-400'
const labelCls = 'block text-sm font-bold text-slate-700 mb-1.5'

export function TeacherSettingsClient({ profile, teacher, subjectName }: Props) {
  const supabase = createClient()

  /* ── Print Settings State ── */
  const [print, setPrint] = useState({
    directorate: teacher.print_directorate ?? '',
    administration: teacher.print_administration ?? '',
    schoolName: teacher.print_school_name ?? '',
    academicYear: teacher.print_academic_year ?? '',
  })
  const [printSaving, setPrintSaving] = useState(false)
  const [printMsg, setPrintMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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
      })
      .eq('id', profile.id)

    setPrintSaving(false)
    setPrintMsg(error
      ? { type: 'err', text: 'حدث خطأ أثناء الحفظ: ' + error.message }
      : { type: 'ok', text: 'تم حفظ الإعدادات بنجاح ✓' }
    )
    if (!error) setTimeout(() => setPrintMsg(null), 3000)
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
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">⚙️ الإعدادات</h1>
        <p className="text-slate-500 text-sm mt-1">إدارة ملفك الشخصي وإعدادات الطباعة وكلمة المرور</p>
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
            <input className={inputCls} value={subjectName || '—'} disabled />
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
          <h2 className="font-bold text-slate-800">إعدادات رأس ورقة الاختبار</h2>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            💡 هذه البيانات تظهر تلقائياً في رأس الاختبار عند الطباعة، ويتم حفظها لجميع اختباراتك.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>مديرية التربية والتعليم</label>
              <input className={inputCls} placeholder="مثال: القاهرة"
                value={print.directorate} onChange={e => setPrint(p => ({ ...p, directorate: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>الإدارة التعليمية</label>
              <input className={inputCls} placeholder="مثال: مصر الجديدة"
                value={print.administration} onChange={e => setPrint(p => ({ ...p, administration: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>اسم المدرسة</label>
              <input className={inputCls} placeholder="مثال: مدرسة النور الثانوية"
                value={print.schoolName} onChange={e => setPrint(p => ({ ...p, schoolName: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>العام الدراسي</label>
              <input className={inputCls} placeholder="مثال: 2024 / 2025"
                value={print.academicYear} onChange={e => setPrint(p => ({ ...p, academicYear: e.target.value }))} />
            </div>
          </div>

          {printMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${printMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {printMsg.type === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {printMsg.text}
            </div>
          )}

          <button
            onClick={savePrint}
            disabled={printSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {printSaving ? 'جاري الحفظ…' : 'حفظ إعدادات الطباعة'}
          </button>
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
