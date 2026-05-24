'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2, ShieldCheck, ShieldOff, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'

export function TeacherVerifyActions({ teacherId, isVerified, isActive }: {
  teacherId: string
  isVerified: boolean
  isActive: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const update = async (data: Partial<{ is_verified: boolean; is_active: boolean }>) => {
    setLoading(true)
    let error;
    if (data.is_active !== undefined) {
      const { error: err } = await supabase.from('profiles').update({ is_active: data.is_active }).eq('id', teacherId)
      error = err
    } else if (data.is_verified !== undefined) {
      const { error: err } = await supabase.from('teachers').update({ is_verified: data.is_verified }).eq('id', teacherId)
      error = err
    }
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('تم التحديث بنجاح')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <button
        onClick={() => update({ is_verified: !isVerified })}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${isVerified ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'}`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isVerified ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        {isVerified ? 'إلغاء التوثيق' : 'توثيق المعلم'}
      </button>
      <button
        onClick={() => update({ is_active: !isActive })}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${isActive ? 'bg-red-500/80 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
      >
        {isActive ? <><PowerOff className="w-4 h-4" />إيقاف الحساب</> : <><Power className="w-4 h-4" />تفعيل الحساب</>}
      </button>
    </div>
  )
}
