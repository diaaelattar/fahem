'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, GraduationCap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewTeacherPage() {
  const supabase = createClient()
  const router = useRouter()
  const [subjects, setSubjects] = useState<{ id: number; name_ar: string; icon: string }[]>([])
  const [form, setForm] = useState({ email: '', fullName: '', subjectId: '', password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar').then(({ data }) => setSubjects(data || []))
  }, [])

  const handleCreate = async () => {
    if (!form.email || !form.fullName || !form.password) { toast.error('جميع الحقول مطلوبة'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullName: form.fullName, password: form.password, subjectId: form.subjectId || null })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'حدث خطأ')
      toast.success('تم إنشاء حساب المعلم بنجاح!')
      router.push('/admin/teachers')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/teachers" className="hover:text-indigo-600 font-medium transition-colors">المعلمون</Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="font-bold text-slate-800">إضافة معلم جديد</span>
      </div>

      <h1 className="text-2xl font-black flex items-center gap-2">
        <GraduationCap className="w-7 h-7 text-indigo-600" />
        إضافة معلم جديد
      </h1>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5 shadow-sm">
        {[
          { label: 'الاسم الكامل *', key: 'fullName', type: 'text', placeholder: 'أستاذ محمد أحمد' },
          { label: 'البريد الإلكتروني *', key: 'email', type: 'email', placeholder: 'teacher@example.com', dir: 'ltr' },
          { label: 'كلمة المرور *', key: 'password', type: 'password', placeholder: '••••••••' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm font-bold text-slate-700 mb-2">{f.label}</label>
            <input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              dir={f.dir || 'rtl'}
              className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">المادة التخصصية</label>
          <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors bg-white">
            <option value="">اختر المادة...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name_ar}</option>)}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-700 font-bold">💡 ملاحظة</p>
          <p className="text-xs text-blue-600 mt-1">سيتم إنشاء الحساب وإرسال بيانات الدخول للمعلم. يمكنه تسجيل الدخول فوراً.</p>
        </div>

        <button onClick={handleCreate} disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإنشاء...</> : <><Save className="w-5 h-5" />إنشاء الحساب</>}
        </button>
      </div>
    </div>
  )
}
