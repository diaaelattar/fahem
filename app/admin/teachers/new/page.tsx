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
  const [subjects, setSubjects] = useState<
    { id: number; name_ar: string; icon: string }[]
  >([])
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    subjectId: '',
    password: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('subjects')
      .select('id, name_ar, icon')
      .order('name_ar')
      .then(({ data }) => setSubjects(data || []))
  }, [])

  const handleCreate = async () => {
    if (!form.email || !form.fullName || !form.password) {
      toast.error('جميع الحقول مطلوبة')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          fullName: form.fullName,
          password: form.password,
          subjectId: form.subjectId || null,
        }),
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
        <Link
          href="/admin/teachers"
          className="font-medium transition-colors hover:text-indigo-600"
        >
          المعلمون
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="font-bold text-slate-800">إضافة معلم جديد</span>
      </div>

      <h1 className="flex items-center gap-2 text-2xl font-black">
        <GraduationCap className="h-7 w-7 text-indigo-600" />
        إضافة معلم جديد
      </h1>

      <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
        {[
          {
            label: 'الاسم الكامل *',
            key: 'fullName',
            type: 'text',
            placeholder: 'أستاذ محمد أحمد',
          },
          {
            label: 'البريد الإلكتروني *',
            key: 'email',
            type: 'email',
            placeholder: 'teacher@example.com',
            dir: 'ltr',
          },
          {
            label: 'كلمة المرور *',
            key: 'password',
            type: 'password',
            placeholder: '••••••••',
          },
        ].map((f) => (
          <div key={f.key}>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {f.label}
            </label>
            <input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={(e) =>
                setForm((p) => ({ ...p, [f.key]: e.target.value }))
              }
              placeholder={f.placeholder}
              dir={f.dir || 'rtl'}
              className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
            />
          </div>
        ))}

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            المادة التخصصية
          </label>
          <select
            value={form.subjectId}
            onChange={(e) =>
              setForm((p) => ({ ...p, subjectId: e.target.value }))
            }
            className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
          >
            <option value="">اختر المادة...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name_ar}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-700">💡 ملاحظة</p>
          <p className="mt-1 text-xs text-blue-600">
            سيتم إنشاء الحساب وإرسال بيانات الدخول للمعلم. يمكنه تسجيل الدخول
            فوراً.
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              إنشاء الحساب
            </>
          )}
        </button>
      </div>
    </div>
  )
}
