'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function PremiumToggle({
  profileId,
  initialIsPremium,
}: {
  profileId: string
  initialIsPremium: boolean
}) {
  const [isPremium, setIsPremium] = useState(initialIsPremium)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const togglePremium = async () => {
    setLoading(true)
    const newValue = !isPremium
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: newValue })
      .eq('id', profileId)

    if (!error) {
      setIsPremium(newValue)
      toast.success(newValue ? 'تم ترقية الحساب إلى VIP بنجاح!' : 'تم إلغاء ترقية VIP بنجاح.')
      router.refresh()
    } else {
      console.error('Error updating premium status', error)
      toast.error('حدث خطأ أثناء التحديث: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={togglePremium}
      disabled={loading}
      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black transition-all ${
        isPremium
          ? 'border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
      title={isPremium ? 'حساب VIP مشترك' : 'حساب مجاني'}
      aria-label={isPremium ? 'إلغاء الاشتراك المميز VIP' : 'ترقية الحساب إلى VIP'}
    >
      <Star
        className={`h-3 w-3 ${isPremium ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
        aria-hidden="true"
      />
      {isPremium ? 'VIP' : 'مجاني'}
    </button>
  )
}
