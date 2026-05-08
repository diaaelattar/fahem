'use client'

import { saveStudentGradeAction } from './actions'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brain, Loader2, CheckCircle, ArrowRight, GraduationCap, School, BookOpen } from 'lucide-react'

// ألوان وأيقونات تناسب كل مرحلة
const STAGE_CONFIG: Record<string, { icon: any, color: string, bg: string }> = {
  'المرحلة الابتدائية': { icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-100' },
  'المرحلة الإعدادية': { icon: School, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 hover:border-blue-500 hover:bg-blue-100' },
  'المرحلة الثانوية': { icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-100' }
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [stages, setStages] = useState<{ id: number; name_ar: string; sort_order: number }[]>([])
  const [grades, setGrades] = useState<{ id: number; name_ar: string; stage_id: number; grade_number: number }[]>([])
  
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      
      const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'يا بطل'
      setUserName(firstName)

      // جلب المراحل والصفوف
      const [stagesRes, gradesRes] = await Promise.all([
        supabase.from('educational_stages').select('*').order('sort_order'),
        supabase.from('grades').select('*').order('grade_number')
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      await saveStudentGradeAction(user.id, selectedGrade)
      router.push('/student/dashboard')
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ الصف: ' + err.message)
      setLoading(false)
    }
  }

  // فلترة الصفوف بناءً على المرحلة المختارة
  const filteredGrades = grades.filter(g => g.stage_id === selectedStage)

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg">
        
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Brain className="w-10 h-10 text-yellow-300" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">أهلاً بك {userName}! 👋</h1>
          <p className="text-blue-100 text-sm">خطوات بسيطة وننطلق نحو القمة</p>
        </div>

        {/* Card Section */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500">
          
          {/* Progress Bar */}
          <div className="flex">
            <div className={`h-1.5 transition-all duration-500 ${currentStep >= 1 ? 'w-1/2 bg-primary' : 'w-1/2 bg-slate-100'}`} />
            <div className={`h-1.5 transition-all duration-500 ${currentStep >= 2 ? 'w-1/2 bg-primary' : 'w-1/2 bg-slate-100'}`} />
          </div>

          <div className="p-8">
            {fetching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">جاري تجهيز بياناتك...</p>
              </div>
            ) : (
              <>
                {/* Step 1: Stage Selection */}
                {currentStep === 1 && (
                  <div className="animate-fade-in">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold mb-2">اختر مرحلتك الدراسية</h2>
                      <p className="text-muted-foreground text-sm">أخبرنا بأي مرحلة تدرس حالياً لنخصص لك المحتوى</p>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      {stages.map(stage => {
                        const isSelected = selectedStage === stage.id
                        const config = STAGE_CONFIG[stage.name_ar] || { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/5 border-primary/20 hover:border-primary/50' }
                        const Icon = config.icon
                        
                        return (
                          <button
                            key={stage.id}
                            onClick={() => setSelectedStage(stage.id)}
                            className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-right
                              ${isSelected ? `border-primary bg-primary/5 ring-2 ring-primary/20` : config.bg}
                            `}
                          >
                            <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 ml-4 ${config.color}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-lg">{stage.name_ar}</div>
                            </div>
                            {isSelected && <CheckCircle className="w-6 h-6 text-primary shrink-0" />}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={handleNextStep}
                      disabled={!selectedStage}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/25"
                    >
                      التالي <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                )}

                {/* Step 2: Grade Selection */}
                {currentStep === 2 && (
                  <div className="animate-fade-in">
                    <button 
                      onClick={handlePrevStep}
                      className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 mb-4 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" /> عودة للمراحل
                    </button>
                    
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold mb-2">أي صف دراسي؟</h2>
                      <p className="text-muted-foreground text-sm">الخطوة الأخيرة، اختر صفك بالتحديد</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {filteredGrades.map(grade => {
                        const isSelected = selectedGrade === grade.id
                        return (
                          <button
                            key={grade.id}
                            onClick={() => setSelectedGrade(grade.id)}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center
                              ${isSelected 
                                ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm' 
                                : 'border-border hover:border-primary/40 hover:bg-slate-50'
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${
                              isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {grade.grade_number}
                            </div>
                            <span className="font-bold text-sm">{grade.name_ar}</span>
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={!selectedGrade || loading}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/25"
                    >
                      {loading
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري تجهيز الميدان...</>
                        : 'انطلق الآن 🚀'
                      }
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
