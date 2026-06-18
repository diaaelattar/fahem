'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'
import { saveTeacherSubjectAction } from './actions'

interface DBSubject {
  id: number
  name_ar: string
  icon: string
}

interface Props {
  dbGrades: any[] // Kept for backwards compatibility but not used
  dbSubjects: DBSubject[]
}

export function TeacherOnboardingForm({ dbSubjects }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSubject) {
      setError('يرجى اختيار مادتك الأساسية للمتابعة')
      return
    }

    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('يرجى تسجيل الدخول أولاً')

      await saveTeacherSubjectAction(user.id, selectedSubject)

      // استخدام window.location.href لإجبار المتصفح على تحديث كامل
      // يضمن مزامنة كوكيز الجلسة مع الـ middleware بعد تحديث subject_id
      window.location.href = '/teacher/dashboard'
    } catch (err: unknown) {
      setError((err as Error).message || 'حدث خطأ أثناء حفظ البيانات')
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

      <div>
        <label className="mb-3 block text-sm font-bold text-slate-700">
          اختر المادة التي تدرسها:
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {dbSubjects.map((sub) => {
            const isSelected = selectedSubject === sub.id
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubject(sub.id)}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-3xl">{sub.icon || '📚'}</span>
                <span className="font-bold text-sm text-center">{sub.name_ar}</span>
                {isSelected && (
                  <div className="absolute top-2 left-2">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !selectedSubject}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-4 font-bold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            حفظ ومتابعة إلى لوحة التحكم
          </>
        )}
      </button>
    </form>
  )
}
