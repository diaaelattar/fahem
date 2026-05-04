'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Lock, User, GraduationCap, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [grades, setGrades] = useState<{ id: number; name_ar: string }[]>([])
  const [fullName, setFullName] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingGrade, setSavingGrade] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: s }, { data: g }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('students').select('*, grades(name_ar)').eq('id', user.id).single(),
        supabase.from('grades').select('id, name_ar').order('grade_number'),
      ])
      setProfile(p)
      setStudent(s)
      setGrades(g || [])
      setFullName(p?.full_name || '')
      setSelectedGrade(s?.grade_id || null)
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveName = async () => {
    if (!fullName.trim()) { toast.error('الاسم مطلوب'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', profile.id)
    setSaving(false)
    error ? toast.error(`خطأ: ${error.message}`) : toast.success('تم تحديث الاسم بنجاح!')
  }

  const handleSaveGrade = async () => {
    if (!selectedGrade) { toast.error('يرجى اختيار الصف الدراسي'); return }
    setSavingGrade(true)
    const { error } = await supabase.from('students').update({ grade_id: selectedGrade }).eq('id', profile.id)
    setSavingGrade(false)
    if (error) {
      toast.error(`خطأ: ${error.message}`)
    } else {
      toast.success('تم تغيير الصف الدراسي بنجاح!')
      setStudent((prev: any) => ({ ...prev, grade_id: selectedGrade }))
    }
  }

  const handleChangePwd = async () => {
    if (newPassword.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    if (newPassword !== confirmPassword) { toast.error('كلمتا المرور غير متطابقتين'); return }
    setChangingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPwd(false)
    if (error) toast.error(`خطأ: ${error.message}`)
    else { toast.success('تم تغيير كلمة المرور بنجاح!'); setNewPassword(''); setConfirmPassword('') }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  const currentGradeName = grades.find(g => g.id === (student?.grade_id))?.name_ar || 'غير محدد'

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">ملفي الشخصي</h1>
        <p className="text-muted-foreground mt-1">إدارة بياناتك الشخصية</p>
      </div>

      {/* Info card */}
      {student && (
        <div className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
          <img
            src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name}&backgroundColor=1B4F72&textColor=ffffff`}
            alt={profile?.full_name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {currentGradeName}
              </span>
              {student.class_section && <span className="bg-muted px-2 py-0.5 rounded-full">فصل {student.class_section}</span>}
              {student.student_code && <span className="font-mono bg-muted px-2 py-0.5 rounded-full">{student.student_code}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Edit name */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" />تعديل الاسم</h2>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="الاسم الكامل"
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={handleSaveName} disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الاسم
        </button>
      </div>

      {/* Change Grade */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          تغيير الصف الدراسي
        </h2>
        <p className="text-xs text-muted-foreground">الصف الحالي: <strong>{currentGradeName}</strong></p>
        <div className="grid grid-cols-1 gap-2">
          {grades.map(grade => (
            <button
              key={grade.id}
              onClick={() => setSelectedGrade(grade.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-right font-medium text-sm
                ${selectedGrade === grade.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
            >
              <span>{grade.name_ar}</span>
              {selectedGrade === grade.id
                ? <CheckCircle className="w-5 h-5 text-primary" />
                : <div className="w-5 h-5 rounded-full border-2 border-border" />
              }
            </button>
          ))}
        </div>
        <button
          onClick={handleSaveGrade}
          disabled={savingGrade || selectedGrade === student?.grade_id}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors w-full justify-center"
        >
          {savingGrade ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
          {selectedGrade === student?.grade_id ? 'هذا هو صفك الحالي' : 'تغيير الصف'}
        </button>
      </div>

      {/* Change password */}
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
