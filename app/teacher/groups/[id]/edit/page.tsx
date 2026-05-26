'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, ArrowRight, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditGroupPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('student_groups')
        .select('name_ar, is_active')
        .eq('id', params.id)
        .single()
      if (data) {
        setName(data.name_ar)
        setIsActive(data.is_active)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('اسم المجموعة مطلوب')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('student_groups')
      .update({ name_ar: name.trim(), is_active: isActive })
      .eq('id', params.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else {
      toast.success('تم حفظ التعديلات!')
      router.push(`/teacher/groups/${params.id}`)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase
      .from('student_groups')
      .delete()
      .eq('id', params.id)
    setDeleting(false)
    if (error) toast.error(error.message)
    else {
      toast.success('تم حذف المجموعة')
      router.push('/teacher/groups')
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )

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
        <Link
          href={`/teacher/groups/${params.id}`}
          className="font-medium transition-colors hover:text-indigo-600"
        >
          {name}
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="font-bold text-slate-800">تعديل</span>
      </div>

      <h1 className="text-2xl font-black text-slate-800">تعديل المجموعة</h1>

      <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            اسم المجموعة *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-bold text-slate-700">حالة المجموعة</p>
            <p className="mt-0.5 text-xs text-slate-500">
              المجموعات الموقوفة لا تظهر للطلاب
            </p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative h-6 w-12 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          حفظ التعديلات
        </button>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 rounded-2xl border border-red-100 bg-white p-6">
        <h3 className="flex items-center gap-2 font-bold text-red-700">
          <AlertTriangle className="h-4 w-4" />
          منطقة الخطر
        </h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
            حذف المجموعة نهائياً
          </button>
        ) : (
          <div className="space-y-3">
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              ⚠️ سيؤدي هذا إلى حذف المجموعة وإزالة جميع الطلاب منها. لا يمكن
              التراجع.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                تأكيد الحذف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
