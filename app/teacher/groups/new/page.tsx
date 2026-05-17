'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createGroupAction } from './actions'
import { ArrowRight, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewGroupPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [grades, setGrades] = useState<any[]>([])

  useEffect(() => {
    supabase.from('grades').select('id, name_ar').order('grade_number').then(({ data }) => {
      if (data) setGrades(data)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    try {
      await createGroupAction(formData)
      router.push('/teacher/groups')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/teacher/groups" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">إنشاء مجموعة جديدة</h1>
          <p className="text-sm text-slate-500 mt-1">أضف مجموعة جديدة لدعوة طلابك إليها لاحقاً.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">اسم المجموعة <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="name" 
              required
              placeholder="مثال: مجموعة يوم الإثنين 4م - الصف الأول"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">المرحلة الدراسية (اختياري)</label>
            <select 
              name="grade_id" 
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium bg-white"
            >
              <option value="">-- للجميع --</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name_ar}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link href="/teacher/groups" className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
              إلغاء
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
              حفظ المجموعة
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
