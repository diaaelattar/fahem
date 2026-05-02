'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

export default function NewStudentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [gradeId, setGradeId] = useState('')
  const [classSection, setClassSection] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [grades, setGrades] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number').then(({ data }) => setGrades(data || []))
  }, [])

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const pwd = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setPassword(pwd)
    setShowPassword(true)
  }

  const handleSave = async () => {
    if (!fullName.trim()) { toast({ title: 'الاسم الكامل مطلوب', type: 'error' }); return }
    if (!email.trim() || !email.includes('@')) { toast({ title: 'البريد الإلكتروني غير صحيح', type: 'error' }); return }
    if (!password || password.length < 6) { toast({ title: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'error' }); return }
    if (!gradeId) { toast({ title: 'الصف الدراسي مطلوب', type: 'error' }); return }

    setSaving(true)
    try {
      // Create user in Supabase Auth using admin API
      const response = await fetch('/api/admin/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, gradeId: parseInt(gradeId), classSection, parentPhone }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({ title: `تم إنشاء حساب ${fullName} بنجاح ✅`, type: 'success' })
      setTimeout(() => router.push('/admin/students'), 800)
    } catch (err: any) {
      toast({ title: 'خطأ في إنشاء الحساب', description: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">إضافة طالب جديد</h1>
        <p className="text-muted-foreground mt-1">أنشئ حساباً للطالب وشارك بياناته معه</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-1.5">الاسم الكامل *</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="مثال: أحمد محمد علي"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">البريد الإلكتروني *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="student@school.edu.eg"
            dir="ltr"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">كلمة المرور *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                dir="ltr"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pl-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={generatePassword}
              className="px-3 py-2 text-xs border border-border rounded-xl hover:bg-muted transition-colors whitespace-nowrap">
              توليد تلقائي
            </button>
          </div>
          {password && showPassword && (
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ احفظ هذه البيانات لمشاركتها مع الطالب: <code className="bg-muted px-1 rounded">{email}</code> / <code className="bg-muted px-1 rounded">{password}</code>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1.5">الصف الدراسي *</label>
            <select value={gradeId} onChange={e => setGradeId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none">
              <option value="">اختر الصف</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">الفصل / الشعبة</label>
            <input value={classSection} onChange={e => setClassSection(e.target.value)}
              placeholder="مثال: 3/1 أو أ"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1.5">هاتف ولي الأمر</label>
          <input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            dir="ltr"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          إنشاء حساب الطالب
        </button>
        <button onClick={() => router.back()} className="border border-border px-5 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors">
          إلغاء
        </button>
      </div>
    </div>
  )
}
