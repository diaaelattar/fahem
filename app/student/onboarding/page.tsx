'use client'

import { saveStudentGradeAction } from './actions'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brain, Loader2, CheckCircle, BookOpen } from 'lucide-react'

const GRADES = [
  { id: null, label: 'اختر صفك الدراسي', disabled: true },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [grades, setGrades] = useState<{ id: number; name_ar: string }[]>([])
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserName(user.user_metadata?.full_name?.split(' ')[0] || 'يا صديقي')

      // Fetch all grades sorted by stage then grade number
      const { data } = await supabase
        .from('grades')
        .select('id, name_ar, educational_stages(name_ar, sort_order)')
        .order('grade_number')
      setGrades(data || [])
      setFetching(false)
    }
    init()
  }, [])

  const handleSave = async () => {
    if (!selectedGrade) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      await saveStudentGradeAction(user.id, selectedGrade)
      router.push('/student/dashboard')
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ الصف: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-2xl">
            <Brain className="w-11 h-11 text-yellow-300" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">أهلاً {userName}! 👋</h1>
          <p className="text-blue-200 text-sm mt-1">خطوة واحدة تفصلك عن التدريب والتحديات</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-700 p-6 text-white text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
            <h2 className="text-xl font-bold">اختر صفك الدراسي</h2>
            <p className="text-blue-200 text-sm mt-1">لنخصّص المحتوى المناسب لك</p>
          </div>

          <div className="p-6">
            {fetching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {grades.map(grade => (
                  <button
                    key={grade.id}
                    onClick={() => setSelectedGrade(grade.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-right font-bold text-lg
                      ${selectedGrade === grade.id
                        ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.01]'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      }`}
                  >
                    <span>{grade.name_ar}</span>
                    {selectedGrade === grade.id
                      ? <CheckCircle className="w-6 h-6 text-primary" />
                      : <div className="w-6 h-6 rounded-full border-2 border-border" />
                    }
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!selectedGrade || loading}
              className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/25"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
                : 'ابدأ رحلتك 🚀'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
