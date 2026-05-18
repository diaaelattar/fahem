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
    if (!name.trim()) { toast.error('اسم المجموعة مطلوب'); return }
    setSaving(true)
    const { error } = await supabase
      .from('student_groups')
      .update({ name_ar: name.trim(), is_active: isActive })
      .eq('id', params.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else { toast.success('تم حفظ التعديلات!'); router.push(`/teacher/groups/${params.id}`) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('student_groups').delete().eq('id', params.id)
    setDeleting(false)
    if (error) toast.error(error.message)
    else { toast.success('تم حذف المجموعة'); router.push('/teacher/groups') }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="max-w-lg space-y-6" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/teacher/groups" className="hover:text-indigo-600 transition-colors font-medium">المجموعات</Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <Link href={`/teacher/groups/${params.id}`} className="hover:text-indigo-600 transition-colors font-medium">{name}</Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="font-bold text-slate-800">تعديل</span>
      </div>

      <h1 className="text-2xl font-black text-slate-800">تعديل المجموعة</h1>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">اسم المجموعة *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="font-bold text-sm text-slate-700">حالة المجموعة</p>
            <p className="text-xs text-slate-500 mt-0.5">المجموعات الموقوفة لا تظهر للطلاب</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ التعديلات
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-4">
        <h3 className="font-bold text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          منطقة الخطر
        </h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 font-bold text-sm border border-red-200 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            حذف المجموعة نهائياً
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3">⚠️ سيؤدي هذا إلى حذف المجموعة وإزالة جميع الطلاب منها. لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-border py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                إلغاء
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                تأكيد الحذف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
