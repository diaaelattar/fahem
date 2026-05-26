'use client'

import { saveStudentGradeAction } from './actions'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Brain,
  Loader2,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  School,
  BookOpen,
} from 'lucide-react'

// ألوان وأيقونات تناسب كل مرحلة
const STAGE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'المرحلة الابتدائية': {
    icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-100',
  },
  'المرحلة الإعدادية': {
    icon: School,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200 hover:border-blue-500 hover:bg-blue-100',
  },
  'المرحلة الثانوية': {
    icon: GraduationCap,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-100',
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [stages, setStages] = useState<
    { id: number; name_ar: string; sort_order: number }[]
  >([])
  const [grades, setGrades] = useState<
    { id: number; name_ar: string; stage_id: number; grade_number: number }[]
  >([])

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'يا بطل'
      setUserName(firstName)

      // جلب المراحل والصفوف
      const [stagesRes, gradesRes] = await Promise.all([
        supabase.from('educational_stages').select('*').order('sort_order'),
        supabase.from('grades').select('*').order('grade_number'),
      ])

      if (stagesRes.data) setStages(stagesRes.data)
      if (gradesRes.data) setGrades(gradesRes.data)

      setFetching(false)
    }
    init()
  }, [])

  const handleNextStep = () => {
    if (currentStep === 1 && selectedStage) {
      setCurrentStep(2)
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
      setSelectedGrade(null)
    }
  }

  const handleSave = async () => {
    if (!selectedGrade) return
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await saveStudentGradeAction(user.id, selectedGrade)
      router.push('/student/dashboard')
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ الصف: ' + err.message)
      setLoading(false)
    }
  }

  // فلترة الصفوف بناءً على المرحلة المختارة
  const filteredGrades = grades.filter((g) => g.stage_id === selectedStage)

  return (
    <div
      className="bg-hero-pattern flex min-h-screen items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/30 bg-white/15 shadow-2xl backdrop-blur">
            <Brain className="h-10 w-10 text-yellow-300" />
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-white">
            أهلاً بك {userName}! 👋
          </h1>
          <p className="text-sm text-blue-100">خطوات بسيطة وننطلق نحو القمة</p>
        </div>

        {/* Card Section */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-500">
          {/* Progress Bar */}
          <div className="flex">
            <div
              className={`h-1.5 transition-all duration-500 ${currentStep >= 1 ? 'w-1/2 bg-primary' : 'w-1/2 bg-slate-100'}`}
            />
            <div
              className={`h-1.5 transition-all duration-500 ${currentStep >= 2 ? 'w-1/2 bg-primary' : 'w-1/2 bg-slate-100'}`}
            />
          </div>

          <div className="p-8">
            {fetching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                <p className="font-medium text-muted-foreground">
                  جاري تجهيز بياناتك...
                </p>
              </div>
            ) : (
              <>
                {/* Step 1: Stage Selection */}
                {currentStep === 1 && (
                  <div className="animate-fade-in">
                    <div className="mb-6 text-center">
                      <h2 className="mb-2 text-2xl font-bold">
                        اختر مرحلتك الدراسية
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        أخبرنا بأي مرحلة تدرس حالياً لنخصص لك المحتوى
                      </p>
                    </div>

                    <div className="mb-8 space-y-3">
                      {stages.map((stage) => {
                        const isSelected = selectedStage === stage.id
                        const config = STAGE_CONFIG[stage.name_ar] || {
                          icon: BookOpen,
                          color: 'text-primary',
                          bg: 'bg-primary/5 border-primary/20 hover:border-primary/50',
                        }
                        const Icon = config.icon

                        return (
                          <button
                            key={stage.id}
                            onClick={() => setSelectedStage(stage.id)}
                            className={`flex w-full items-center rounded-2xl border-2 p-4 text-right transition-all ${isSelected ? `border-primary bg-primary/5 ring-2 ring-primary/20` : config.bg} `}
                          >
                            <div
                              className={`ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${config.color}`}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="text-lg font-bold">
                                {stage.name_ar}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-6 w-6 shrink-0 text-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={handleNextStep}
                      disabled={!selectedStage}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      التالي <ArrowRight className="h-5 w-5 rotate-180" />
                    </button>
                  </div>
                )}

                {/* Step 2: Grade Selection */}
                {currentStep === 2 && (
                  <div className="animate-fade-in">
                    <button
                      onClick={handlePrevStep}
                      className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowRight className="h-4 w-4" /> عودة للمراحل
                    </button>

                    <div className="mb-6 text-center">
                      <h2 className="mb-2 text-2xl font-bold">أي صف دراسي؟</h2>
                      <p className="text-sm text-muted-foreground">
                        الخطوة الأخيرة، اختر صفك بالتحديد
                      </p>
                    </div>

                    <div className="mb-8 grid grid-cols-2 gap-3">
                      {filteredGrades.map((grade) => {
                        const isSelected = selectedGrade === grade.id
                        return (
                          <button
                            key={grade.id}
                            onClick={() => setSelectedGrade(grade.id)}
                            className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all ${
                              isSelected
                                ? 'scale-[1.02] border-primary bg-primary/5 text-primary shadow-sm'
                                : 'border-border hover:border-primary/40 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-colors ${
                                isSelected
                                  ? 'bg-primary text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {grade.grade_number}
                            </div>
                            <span className="text-sm font-bold">
                              {grade.name_ar}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={!selectedGrade || loading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" /> جاري
                          تجهيز الميدان...
                        </>
                      ) : (
                        'انطلق الآن 🚀'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
