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
  ArrowLeft,
  GraduationCap,
  School,
  BookOpen,
  Globe,
  Library,
  Landmark,
} from 'lucide-react'

// ====== Types ======
interface Stage {
  id: number
  name_ar: string
  sort_order: number
}
interface Grade {
  id: number
  name_ar: string
  stage_id: number
  grade_number: number
}
interface Subject {
  id: number
  name_ar: string
  name_en: string | null
  icon: string
  teaching_language: string | null
  education_types: string[] | null
  category: string | null
}

// ====== Config ======
const STAGE_CONFIG: Record<
  string,
  { icon: any; gradient: string; accent: string }
> = {
  'المرحلة الابتدائية': {
    icon: BookOpen,
    gradient: 'from-emerald-400 to-teal-500',
    accent: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  },
  'المرحلة الإعدادية': {
    icon: School,
    gradient: 'from-blue-400 to-indigo-500',
    accent: 'border-blue-400 bg-blue-50 text-blue-700',
  },
  'المرحلة الثانوية': {
    icon: GraduationCap,
    gradient: 'from-violet-400 to-purple-600',
    accent: 'border-violet-400 bg-violet-50 text-violet-700',
  },
}

const EDU_TYPES = [
  {
    id: 'public',
    label: 'تعليم عام',
    sublabel: 'المواد الأساسية كلها بالعربية',
    icon: Landmark,
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 border-blue-200 hover:border-blue-500',
    selectedBg: 'border-blue-500 bg-blue-50 ring-2 ring-blue-300',
    emoji: '🏫',
  },
  {
    id: 'language',
    label: 'تعليم لغات',
    sublabel: 'العلوم والرياضيات بالإنجليزية',
    icon: Globe,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-500',
    selectedBg: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300',
    emoji: '🌐',
  },
  {
    id: 'azhar',
    label: 'تعليم أزهر',
    sublabel: 'يشمل المواد الدينية المتخصصة',
    icon: Library,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 border-amber-200 hover:border-amber-500',
    selectedBg: 'border-amber-500 bg-amber-50 ring-2 ring-amber-300',
    emoji: '🕌',
  },
]

const LANG_BADGE: Record<
  string,
  { label: string; flag: string; color: string }
> = {
  english: {
    label: 'English',
    flag: '🇬🇧',
    color: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  french: {
    label: 'Français',
    flag: '🇫🇷',
    color: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  },
  arabic: {
    label: 'عربي',
    flag: '🇪🇬',
    color: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
}

// Fallback subjects per education type if DB is empty
const FALLBACK_SUBJECTS: Record<string, Subject[]> = {
  public: [
    {
      id: -1,
      name_ar: 'اللغة العربية',
      name_en: 'Arabic',
      icon: '📖',
      teaching_language: 'arabic',
      education_types: ['public', 'language', 'azhar'],
      category: 'لغات',
    },
    {
      id: -2,
      name_ar: 'اللغة الإنجليزية',
      name_en: 'English',
      icon: '🗣️',
      teaching_language: 'arabic',
      education_types: ['public', 'language'],
      category: 'لغات',
    },
    {
      id: -3,
      name_ar: 'الرياضيات',
      name_en: 'Mathematics',
      icon: '🔢',
      teaching_language: 'arabic',
      education_types: ['public', 'azhar'],
      category: 'علوم',
    },
    {
      id: -4,
      name_ar: 'العلوم',
      name_en: 'Science',
      icon: '🔬',
      teaching_language: 'arabic',
      education_types: ['public', 'azhar'],
      category: 'علوم',
    },
    {
      id: -5,
      name_ar: 'الدراسات الاجتماعية',
      name_en: 'Social Studies',
      icon: '🗺️',
      teaching_language: 'arabic',
      education_types: ['public', 'azhar'],
      category: 'آداب',
    },
    {
      id: -6,
      name_ar: 'التربية الدينية',
      name_en: 'Religion',
      icon: '📿',
      teaching_language: 'arabic',
      education_types: ['public', 'language', 'azhar'],
      category: 'عام',
    },
  ],
  language: [
    {
      id: -1,
      name_ar: 'اللغة العربية',
      name_en: 'Arabic',
      icon: '📖',
      teaching_language: 'arabic',
      education_types: ['public', 'language', 'azhar'],
      category: 'لغات',
    },
    {
      id: -2,
      name_ar: 'اللغة الإنجليزية',
      name_en: 'English',
      icon: '🗣️',
      teaching_language: 'arabic',
      education_types: ['public', 'language'],
      category: 'لغات',
    },
    {
      id: -7,
      name_ar: 'الرياضيات',
      name_en: 'Mathematics',
      icon: '🔢',
      teaching_language: 'english',
      education_types: ['language'],
      category: 'علوم',
    },
    {
      id: -8,
      name_ar: 'العلوم',
      name_en: 'Science',
      icon: '🔬',
      teaching_language: 'english',
      education_types: ['language'],
      category: 'علوم',
    },
    {
      id: -9,
      name_ar: 'اللغة الفرنسية',
      name_en: 'French',
      icon: '🇫🇷',
      teaching_language: 'french',
      education_types: ['language'],
      category: 'لغات',
    },
    {
      id: -6,
      name_ar: 'التربية الدينية',
      name_en: 'Religion',
      icon: '📿',
      teaching_language: 'arabic',
      education_types: ['public', 'language', 'azhar'],
      category: 'عام',
    },
    {
      id: -5,
      name_ar: 'الدراسات الاجتماعية',
      name_en: 'Social Studies',
      icon: '🗺️',
      teaching_language: 'arabic',
      education_types: ['public', 'azhar'],
      category: 'آداب',
    },
  ],
  azhar: [
    {
      id: -1,
      name_ar: 'اللغة العربية',
      name_en: 'Arabic',
      icon: '📖',
      teaching_language: 'arabic',
      education_types: ['public', 'language', 'azhar'],
      category: 'لغات',
    },
    {
      id: -3,
      name_ar: 'الرياضيات',
      name_en: 'Mathematics',
      icon: '🔢',
      teaching_language: 'arabic',
      education_types: ['public', 'azhar'],
      category: 'علوم',
    },
    {
      id: -4,
      name_ar: 'العلوم',
      name_en: 'Science',
      icon: '🔬',
      teaching_language: 'arabic',
      education_types: ['public', 'azhar'],
      category: 'علوم',
    },
    {
      id: -10,
      name_ar: 'الفقه',
      name_en: 'Islamic Jurisprudence',
      icon: '📜',
      teaching_language: 'arabic',
      education_types: ['azhar'],
      category: 'عام',
    },
    {
      id: -11,
      name_ar: 'التفسير',
      name_en: 'Quran Exegesis',
      icon: '📗',
      teaching_language: 'arabic',
      education_types: ['azhar'],
      category: 'عام',
    },
    {
      id: -12,
      name_ar: 'التجويد',
      name_en: 'Tajweed',
      icon: '🕌',
      teaching_language: 'arabic',
      education_types: ['azhar'],
      category: 'عام',
    },
    {
      id: -13,
      name_ar: 'الحديث النبوي',
      name_en: 'Hadith',
      icon: '📘',
      teaching_language: 'arabic',
      education_types: ['azhar'],
      category: 'عام',
    },
    {
      id: -14,
      name_ar: 'التوحيد',
      name_en: 'Tawheed',
      icon: '⭐',
      teaching_language: 'arabic',
      education_types: ['azhar'],
      category: 'عام',
    },
  ],
}

// ====== Component ======
export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [stages, setStages] = useState<Stage[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [currentStep, setCurrentStep] = useState(1)
  const TOTAL_STEPS = 4

  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [selectedEduType, setSelectedEduType] = useState<string | null>(null)

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

      const [stagesRes, gradesRes, subjectsRes] = await Promise.all([
        supabase.from('educational_stages').select('*').order('sort_order'),
        supabase.from('grades').select('*').order('grade_number'),
        supabase
          .from('subjects')
          .select(
            'id, name_ar, name_en, icon, teaching_language, education_types, category'
          )
          .order('id'),
      ])

      if (stagesRes.data) setStages(stagesRes.data)
      if (gradesRes.data) setGrades(gradesRes.data)
      if (subjectsRes.data && subjectsRes.data.length > 0)
        setSubjects(subjectsRes.data as Subject[])

      setFetching(false)
    }
    init()
  }, [])

  // Filtered subjects by education type
  const displaySubjects = (): Subject[] => {
    if (!selectedEduType) return []
    const eduType = selectedEduType

    // Try DB subjects first
    if (subjects.length > 0) {
      const filtered = subjects.filter((s) => {
        if (!s.education_types || s.education_types.length === 0) return true
        return s.education_types.includes(eduType)
      })
      if (filtered.length > 0) return filtered
    }

    // Fallback
    return FALLBACK_SUBJECTS[eduType] || []
  }

  const filteredGrades = grades.filter((g) => g.stage_id === selectedStage)
  const stageName = stages.find((s) => s.id === selectedStage)?.name_ar || ''
  const stageConfig = STAGE_CONFIG[stageName] || {
    icon: GraduationCap,
    gradient: 'from-primary to-blue-500',
    accent: 'border-primary bg-primary/5 text-primary',
  }
  const eduTypeConfig = EDU_TYPES.find((e) => e.id === selectedEduType)

  const handleSave = async () => {
    if (!selectedGrade || !selectedEduType) return
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      await saveStudentGradeAction(user.id, selectedGrade, selectedEduType)
      // استخدام window.location.href بدلاً من router.push لإجبار المتصفح على تحديث كامل
      // يضمن مزامنة كوكيز الجلسة وتحديث حالة الطالب مع الـ middleware والـ Server Components
      window.location.href = '/student/dashboard'
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message)
      setLoading(false)
    }
  }

  const StepHeader = ({
    title,
    subtitle,
  }: {
    title: string
    subtitle: string
  }) => (
    <div className="mb-6 text-center">
      <h2 className="mb-1.5 text-2xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )

  return (
    <div
      className="bg-hero-pattern flex min-h-screen items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        {/* Top Header */}
        <div className="mb-8 animate-fade-in text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/30 bg-white/15 shadow-2xl backdrop-blur">
            <Brain className="h-10 w-10 text-yellow-300" />
          </div>
          <h1 className="mb-1 font-display text-3xl font-bold text-white">
            أهلاً بك {userName}! 👋
          </h1>
          <p className="text-sm text-blue-100">خطوات بسيطة وننطلق نحو القمة</p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Progress Bar */}
          <div className="flex">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 transition-all duration-500 ${
                  i < currentStep ? 'bg-primary' : 'bg-slate-100'
                } ${i === 0 ? '' : 'border-r border-white'}`}
              />
            ))}
          </div>

          {/* Step Counter */}
          <div className="flex items-center justify-between px-8 pb-0 pt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              الخطوة {currentStep} من {TOTAL_STEPS}
            </span>
            {currentStep > 1 && (
              <button
                onClick={() => {
                  setCurrentStep((s) => s - 1)
                  if (currentStep === 3) setSelectedEduType(null)
                  if (currentStep === 2) setSelectedGrade(null)
                }}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowRight className="h-3.5 w-3.5" /> رجوع
              </button>
            )}
          </div>

          <div className="p-8 pt-4">
            {fetching ? (
              <div className="flex flex-col items-center justify-center py-14">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                <p className="font-medium text-muted-foreground">
                  جاري تجهيز بياناتك...
                </p>
              </div>
            ) : (
              <>
                {/* ===== STEP 1: Stage ===== */}
                {currentStep === 1 && (
                  <div className="animate-fade-in">
                    <StepHeader
                      title="اختر مرحلتك الدراسية"
                      subtitle="نخصص لك المحتوى المناسب تماماً"
                    />
                    <div className="mb-8 space-y-3">
                      {stages.map((stage) => {
                        const isSelected = selectedStage === stage.id
                        const cfg = STAGE_CONFIG[stage.name_ar] || {
                          icon: BookOpen,
                          gradient: 'from-slate-400 to-slate-600',
                          accent: 'border-slate-300 bg-slate-50 text-slate-700',
                        }
                        const Icon = cfg.icon
                        return (
                          <button
                            key={stage.id}
                            onClick={() => setSelectedStage(stage.id)}
                            className={`flex w-full items-center rounded-2xl border-2 p-4 text-right transition-all ${
                              isSelected
                                ? `scale-[1.01] border-primary bg-primary/5 ring-2 ring-primary/20`
                                : 'border-border hover:border-primary/40 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cfg.gradient} ml-4 flex shrink-0 items-center justify-center shadow-sm`}
                            >
                              <Icon className="h-6 w-6 text-white" />
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
                      onClick={() => selectedStage && setCurrentStep(2)}
                      disabled={!selectedStage}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      التالي <ArrowLeft className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* ===== STEP 2: Grade ===== */}
                {currentStep === 2 && (
                  <div className="animate-fade-in">
                    <StepHeader
                      title="أي صف دراسي؟"
                      subtitle="الخطوة الثانية — اختر صفك بالتحديد"
                    />
                    <div className="mb-8 grid grid-cols-2 gap-3">
                      {filteredGrades.map((grade) => {
                        const isSelected = selectedGrade === grade.id
                        return (
                          <button
                            key={grade.id}
                            onClick={() => setSelectedGrade(grade.id)}
                            className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all ${
                              isSelected
                                ? 'scale-[1.02] border-primary bg-primary/5 text-primary shadow-sm ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/40 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`mb-2 flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold transition-colors ${
                                isSelected
                                  ? 'bg-primary text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {grade.grade_number}
                            </div>
                            <span className="text-sm font-bold leading-tight">
                              {grade.name_ar}
                            </span>
                            {isSelected && (
                              <CheckCircle className="mt-1.5 h-4 w-4 text-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => selectedGrade && setCurrentStep(3)}
                      disabled={!selectedGrade}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      التالي <ArrowLeft className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* ===== STEP 3: Education Type ===== */}
                {currentStep === 3 && (
                  <div className="animate-fade-in">
                    <StepHeader
                      title="نوعية تعليمك؟"
                      subtitle="سنعرض لك المواد بلغتها الصحيحة"
                    />
                    <div className="mb-8 space-y-3">
                      {EDU_TYPES.map((type) => {
                        const isSelected = selectedEduType === type.id
                        const Icon = type.icon
                        return (
                          <button
                            key={type.id}
                            onClick={() => setSelectedEduType(type.id)}
                            className={`flex w-full items-center rounded-2xl border-2 p-4 text-right transition-all ${isSelected ? type.selectedBg + ' scale-[1.01]' : type.bg}`}
                          >
                            <div
                              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${type.gradient} ml-4 flex shrink-0 items-center justify-center shadow-md`}
                            >
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-base font-bold">
                                <span>{type.emoji}</span> {type.label}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {type.sublabel}
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
                      onClick={() => selectedEduType && setCurrentStep(4)}
                      disabled={!selectedEduType}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      التالي <ArrowLeft className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* ===== STEP 4: Subjects Preview + Confirm ===== */}
                {currentStep === 4 && (
                  <div className="animate-fade-in">
                    {/* Summary Badge */}
                    <div
                      className={`mb-5 flex items-center gap-3 rounded-2xl p-3 ${stageConfig.accent} border-2`}
                    >
                      <span className="text-2xl">{eduTypeConfig?.emoji}</span>
                      <div>
                        <div className="text-sm font-bold">
                          {stageName} — {eduTypeConfig?.label}
                        </div>
                        <div className="text-xs opacity-70">
                          {grades.find((g) => g.id === selectedGrade)?.name_ar}
                        </div>
                      </div>
                    </div>

                    <StepHeader
                      title="مواد دراستك"
                      subtitle="هذه المواد ستكون متاحة لك على المنصة"
                    />

                    <div className="mb-6 grid max-h-64 grid-cols-2 gap-2.5 overflow-y-auto pr-1">
                      {displaySubjects().map((subj) => {
                        const lang = subj.teaching_language || 'arabic'
                        const badge = LANG_BADGE[lang] || LANG_BADGE.arabic
                        return (
                          <div
                            key={subj.id}
                            className="flex items-center gap-2.5 rounded-xl border border-border bg-slate-50 p-3 transition-colors hover:bg-white"
                          >
                            <span className="shrink-0 text-2xl">
                              {subj.icon || '📚'}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold leading-tight">
                                {subj.name_ar}
                              </div>
                              <span
                                className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.color}`}
                              >
                                {badge.flag} {badge.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all hover:brightness-105 disabled:opacity-60"
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
