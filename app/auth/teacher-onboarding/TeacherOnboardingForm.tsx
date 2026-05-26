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
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => setSelectedSubject(subject.id)}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-4 transition-all ${
              selectedSubject === subject.id
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-3xl">{subject.icon}</div>
            <span className="text-center text-sm font-bold">
              {subject.name_ar}
            </span>
            {selectedSubject === subject.id && (
              <div className="absolute right-2 top-2">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || !selectedSubject}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-4 font-bold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:bg-slate-300"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'حفظ ومتابعة إلى لوحة التحكم'
        )}
      </button>
    </form>
  )
}
