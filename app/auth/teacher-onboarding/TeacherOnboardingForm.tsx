'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

interface Subject {
  id: number
  name_ar: string
  icon: string
}

export function TeacherOnboardingForm({ subjects }: { subjects: Subject[] }) {
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSubject) {
      setError('يرجى اختيار مادتك التخصصية للمتابعة')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const { error: updateError } = await supabase
        .from('teachers')
        .update({ subject_id: selectedSubject })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/teacher/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ البيانات')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => setSelectedSubject(subject.id)}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
              selectedSubject === subject.id
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-3xl">{subject.icon}</div>
            <span className="font-bold text-sm text-center">{subject.name_ar}</span>
            {selectedSubject === subject.id && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || !selectedSubject}
        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ ومتابعة إلى لوحة التحكم'}
      </button>
    </form>
  )
}
