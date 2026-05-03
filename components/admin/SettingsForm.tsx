'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, User, Building2, Lock } from 'lucide-react'

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
    if (!fullName.trim()) { alert('الاسم مطلوب'); return }
    setSavingProfile(true)
    try {
      const [pRes, aRes] = await Promise.all([
        supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', profile.id),
        supabase.from('admins').upsert({ id: profile.id, department: department || null, school_name: schoolName || null }),
      ])
      if (pRes.error) throw pRes.error
      alert('تم حفظ المعلومات الشخصية ✅')
    } catch (err: any) {
      alert('خطأ: ' + err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    if (newPassword !== confirmPassword) { alert('كلمتا المرور غير متطابقتين'); return }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      alert('تم تغيير كلمة المرور بنجاح ✅')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      alert('خطأ: ' + err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" />المعلومات الشخصية</h2>

        <div>
          <label className="text-sm font-semibold block mb-1.5">الاسم الكامل</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">البريد الإلكتروني</label>
          <input value={profile.email} disabled
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-muted text-muted-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1.5">اسم المدرسة</label>
            <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
              placeholder="مثال: مدرسة النيل الثانوية"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">القسم</label>
            <input value={department} onChange={e => setDepartment(e.target.value)}
              placeholder="مثال: قسم العلوم"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={savingProfile}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60 transition-colors">
          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ المعلومات
        </button>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />تغيير كلمة المرور</h2>

        <div>
          <label className="text-sm font-semibold block mb-1.5">كلمة المرور الجديدة</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="6 أحرف على الأقل"
            dir="ltr"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">تأكيد كلمة المرور</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            dir="ltr"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <button onClick={handleChangePassword} disabled={savingPassword || !newPassword}
          className="flex items-center gap-2 border border-border hover:bg-muted px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60 transition-colors">
          {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          تغيير كلمة المرور
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="font-bold text-red-800 mb-2">⚠️ منطقة الخطر</h2>
        <p className="text-sm text-red-700 mb-4">هذه الإجراءات لا يمكن التراجع عنها. تصرف بحذر.</p>
        <button className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors" disabled>
          حذف جميع البيانات (معطّل)
        </button>
      </div>
    </div>
  )
}
