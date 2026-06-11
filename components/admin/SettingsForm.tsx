'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, User, Building2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { TwoFactorSetup } from '../school/TwoFactorSetup'

export function SettingsForm({ profile, admin }: { profile: any; admin: any }) {
  const supabase = createClient()

  const [fullName, setFullName] = useState(profile.full_name)
  const [department, setDepartment] = useState(admin?.department || '')
  const [schoolName, setSchoolName] = useState(admin?.school_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('الاسم مطلوب')
      return
    }
    setSavingProfile(true)
    try {
      const [pRes, aRes] = await Promise.all([
        supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', profile.id),
        supabase
          .from('admins')
          .upsert({
            id: profile.id,
            department: department || null,
            school_name: schoolName || null,
          }),
      ])
      if (pRes.error) throw pRes.error
      toast.success('تم حفظ المعلومات الشخصية بنجاح!')
    } catch (err: any) {
      toast.error('خطأ: ' + err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      toast.success('تم تغيير كلمة المرور بنجاح!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error('خطأ: ' + err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Personal Info */}
      <div className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <User className="h-4 w-4 text-primary" />
          المعلومات الشخصية
        </h2>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            الاسم الكامل
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            البريد الإلكتروني
          </label>
          <input
            value={profile.email}
            disabled
            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              اسم المدرسة
            </label>
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="مثال: مدرسة النيل الثانوية"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">القسم</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="مثال: قسم العلوم"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {savingProfile ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ المعلومات
        </button>
      </div>

      {/* Password */}
      <div className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Lock className="h-4 w-4 text-primary" />
          تغيير كلمة المرور
        </h2>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            كلمة المرور الجديدة
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="6 أحرف على الأقل"
            dir="ltr"
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            تأكيد كلمة المرور
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            dir="ltr"
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={savingPassword || !newPassword}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          {savingPassword ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          تغيير كلمة المرور
        </button>
      </div>

      {/* الأمن والمصادقة الثنائية (2FA) */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <TwoFactorSetup />
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 font-bold text-red-800">⚠️ منطقة الخطر</h2>
        <p className="mb-4 text-sm text-red-700">
          هذه الإجراءات لا يمكن التراجع عنها. تصرف بحذر.
        </p>
        <button
          className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
          disabled
        >
          حذف جميع البيانات (معطّل)
        </button>
      </div>
    </div>
  )
}
