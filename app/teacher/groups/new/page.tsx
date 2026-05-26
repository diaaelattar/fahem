'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewGroupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('')
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('اسم المجموعة مطلوب')
      return
    }
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!teacher)
        throw new Error('لا يوجد حساب معلم مرتبط بهذا البريد الإلكتروني')

      const invite_code = generateCode()
      const { data, error } = await supabase
        .from('student_groups')
        .insert({ teacher_id: user.id, name_ar: name.trim(), invite_code })
        .select()
        .single()

      if (error) throw error
      toast.success('تم إنشاء المجموعة بنجاح!')
      router.push(`/teacher/groups/${data.id}`)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/teacher/groups"
          className="font-medium transition-colors hover:text-indigo-600"
        >
          المجموعات
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="font-bold text-slate-800">مجموعة جديدة</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-800">
          إنشاء مجموعة جديدة
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          أنشئ مجموعة لطلابك وأرسل لهم كود الانضمام
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            اسم المجموعة *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="مثال: سنتر النجاح — الصف الثالث الثانوي"
            className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="mb-1 text-xs font-bold text-indigo-700">
            💡 سيتم إنشاء كود دعوة تلقائياً
          </p>
          <p className="text-xs text-indigo-600">
            يمكن لطلابك الانضمام بهذا الكود من صفحة /student/join-group
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
        </button>
      </div>
    </div>
  )
}
