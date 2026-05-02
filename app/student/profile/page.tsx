'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Lock, User } from 'lucide-react'
import { useToast } from '@/components/ui/Toaster'

export default function StudentProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('students').select('*, grades(name_ar)').eq('id', user.id).single(),
      ])
      setProfile(p); setStudent(s)
      setFullName(p?.full_name || '')
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!fullName.trim()) { toast('الاسم مطلوب', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', profile.id)
    setSaving(false)
    error ? toast(`خطأ: ${error.message}`, 'error') : toast('تم التحديث ✅', 'success')
  }

  const handleChangePwd = async () => {
    if (newPassword.length < 6) { toast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return }
    if (newPassword !== confirmPassword) { toast('كلمتا المرور غير متطابقتين', 'error'); return }
    setChangingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPwd(false)
    if (error) toast(`خطأ: ${error.message}`, 'error')
    else { toast('تم تغيير كلمة المرور ✅', 'success'); setNewPassword(''); setConfirmPassword('') }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">ملفي الشخصي</h1>
        <p className="text-muted-foreground mt-1">إدارة بياناتك الشخصية</p>
      </div>

      {/* Info card */}
      {student && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center text-2xl font-bold text-white">
            {profile?.full_name?.[0] || '؟'}
          </div>
          <div>
            <p className="font-bold text-base">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="flex gap-2 mt-1 text-xs text-green-700">
              <span className="bg-green-100 px-2 py-0.5 rounded-full">{student.grades?.name_ar}</span>
              {student.class_section && <span className="bg-green-100 px-2 py-0.5 rounded-full">فصل {student.class_section}</span>}
              {student.student_code && <span className="font-mono bg-green-100 px-2 py-0.5 rounded-full">{student.student_code}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" />تعديل الاسم</h2>
        <input value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="الاسم الكامل"
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />تغيير كلمة المرور</h2>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
          placeholder="كلمة المرور الجديدة" dir="ltr"
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          placeholder="تأكيد كلمة المرور" dir="ltr"
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <button onClick={handleChangePwd} disabled={changingPwd || !newPassword}
          className="flex items-center gap-2 border border-border px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted disabled:opacity-60 transition-colors">
          {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          تغيير كلمة المرور
        </button>
      </div>
    </div>
  )
}
