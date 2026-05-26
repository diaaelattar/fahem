'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Power,
  PowerOff,
} from 'lucide-react'
import { toast } from 'sonner'

export function TeacherVerifyActions({
  teacherId,
  isVerified,
  isActive,
}: {
  teacherId: string
  isVerified: boolean
  isActive: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const update = async (
    data: Partial<{ is_verified: boolean; is_active: boolean }>
  ) => {
    setLoading(true)
    let error
    if (data.is_active !== undefined) {
      const { error: err } = await supabase
        .from('profiles')
        .update({ is_active: data.is_active })
        .eq('id', teacherId)
      error = err
    } else if (data.is_verified !== undefined) {
      const { error: err } = await supabase
        .from('teachers')
        .update({ is_verified: data.is_verified })
        .eq('id', teacherId)
      error = err
    }
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('تم التحديث بنجاح')
    router.refresh()
  }

  return (
    <div className="flex shrink-0 flex-col gap-3">
      <button
        onClick={() => update({ is_verified: !isVerified })}
        disabled={loading}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-60 ${isVerified ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-indigo-700 shadow-lg hover:bg-indigo-50'}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isVerified ? (
          <ShieldOff className="h-4 w-4" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {isVerified ? 'إلغاء التوثيق' : 'توثيق المعلم'}
      </button>
      <button
        onClick={() => update({ is_active: !isActive })}
        disabled={loading}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-60 ${isActive ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
      >
        {isActive ? (
          <>
            <PowerOff className="h-4 w-4" />
            إيقاف الحساب
          </>
        ) : (
          <>
            <Power className="h-4 w-4" />
            تفعيل الحساب
          </>
        )}
      </button>
    </div>
  )
}
