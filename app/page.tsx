"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Brain,
  Swords,
  Trophy,
  Zap,
  BookOpen,
  TrendingUp,
  Star,
  Users,
  CheckCircle,
  ArrowLeft,
  Flame,
  GraduationCap,
  ChevronLeft,
  Upload,
  Play,
  Sparkles,
  School,
  FileText,
  Youtube,
  Music,
  ArrowRight,
  Lock,
  Plus,
  Phone,
  Building,
  Check,
  Clock,
  Shield,
  MessageSquare
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { createClient } from '@/lib/supabase/client'

// Types for interactive simulator
type UploadType = 'pdf' | 'youtube' | 'audio'

interface QuestionDemo {
  question: string
  options: string[]
  answer: string
  explanation: string
}

export default function HomePage() {
  // State for AI Simulator
  const [activeTab, setActiveTab] = useState<UploadType>('pdf')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simStep, setSimStep] = useState(0)
  const [simComplete, setSimComplete] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  // State for School Waitlist Form
  const [schoolName, setSchoolName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

  // State for School Login Modal
  const [showSchoolLoginModal, setShowSchoolLoginModal] = useState(false)
  const [schoolLoginEmail, setSchoolLoginEmail] = useState('')
  const [schoolLoginPassword, setSchoolLoginPassword] = useState('')
  const [schoolLoginLoading, setSchoolLoginLoading] = useState(false)
  const [schoolLoginError, setSchoolLoginError] = useState('')
  const [schoolLoginSuccess, setSchoolLoginSuccess] = useState('')

  // Real statistics
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    questionsCount: 0,
    examsCount: 0,
  })

  useEffect(() => {
    fetch('/api/stats/landing')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error)
  }, [])

  // Simulation steps for AI engine
  const simSteps = [
    'جاري قراءة الملف وتصفية المحتوى التعليمي...',
    'جاري تحديد المنهج الدراسي المصري والمفهوم العلمي جوهرياً...',
    'جاري تجاهل المقدمات والنصوص غير المرتبطة بالدرس بالذكاء الاصطناعي...',
    'توليد الأسئلة: MCQ، صح وخطأ، أكمل الفراغ، وأسئلة مقالية...',
    'تحسين الصياغة وإضافة شرح مفصل لكل سؤال KaTeX...'
  ]

  const demoQuestion: QuestionDemo = {
    question: 'سؤال: ما هو السبب الرئيسي لتصنيف الكائنات الحية في مجموعات متباينة؟',
    options: [
      'أ- لتسهيل دراستها والتعرف عليها وفق علاقاتها المشتركة.',
      'ب- لزيادة أعدادها بشكل صناعي داخل المختبرات.',
      'ج- لضمان بقائها في بيئات جافة فقط.',
      'د- ليس لها علاقة بالتصنيف والتقييم البيئي.'
    ],
    answer: 'أ- لتسهيل دراستها والتعرف عليها وفق علاقاتها المشتركة.',
    explanation: 'تسهيل الدراسة وتحديد درجة القرابة والتطور بين الكائنات الحية هو الغاية الأساسية وراء تصنيف العلماء لها في مجموعات متباينة بناءً على صفات وخصائص مشتركة.'
  }

  // Handle simulation of AI exam creation
  useEffect(() => {
    let interval: any
    if (simulating) {
      interval = setInterval(() => {
        setSimStep((prev) => {
          if (prev < simSteps.length - 1) {
            return prev + 1
          } else {
            clearInterval(interval)
            setSimulating(false)
            setSimComplete(true)
            return prev
          }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [simulating])

  const startSimulation = () => {
    setSimStep(0)
    setSimComplete(false)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setSimulating(true)
  }

  // Handle Drag & Drop Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startSimulation()
    }
  }

  // Handle School Form Submission (Real Database Insertion)
  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolName || !contactName || !phone || !email) return
    setSubmittingForm(true)
    setFormError('')
    try {
      const response = await fetch('/api/school/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolName,
          contactName,
          phone,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إرسال طلب الانضمام.')
      }

      setFormSubmitted(true)
    } catch (err: any) {
      setFormError(err.message || 'تعذر حفظ البيانات في قاعدة البيانات. حاول مجدداً.')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Handle School Login Authentication via Supabase
  const handleSchoolLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolLoginEmail || !schoolLoginPassword) return
    setSchoolLoginLoading(true)
    setSchoolLoginError('')
    setSchoolLoginSuccess('')

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: schoolLoginEmail,
        password: schoolLoginPassword,
      })

      if (authError) {
        throw new Error(
          authError.message === 'Invalid login credentials'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            : authError.message
        )
      }

      // Check if user has a profile or is teacher/admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (profile?.role === 'admin') {
        setSchoolLoginSuccess('تم تسجيل دخول المشرف بنجاح! جاري التوجيه للوحة تحكم الإدارة العامة...')
        setTimeout(() => {
          window.location.href = '/admin/dashboard'
        }, 1500)
      } else if (profile?.role === 'teacher') {
        setSchoolLoginSuccess('تم تسجيل دخول قائد المجموعة بنجاح! جاري التوجيه للوحة تحكم المعلمين...')
        setTimeout(() => {
          window.location.href = '/teacher/dashboard'
        }, 1500)
      } else {
        setSchoolLoginSuccess('تم التحقق بنجاح! حسابك مسجل ومحفوظ بأمان. جاري إعداد وتوجيه بوابتكم للمدارس...')
        setTimeout(() => {
          window.location.href = '/student/dashboard'
        }, 2000)
      }
    } catch (err: any) {
      setSchoolLoginError(err.message || 'فشل في الاتصال بمزود المصادقة.')
    } finally {
      setSchoolLoginLoading(false)
    }
  }
  return (
    <div
      className="min-h-screen bg-[#070e1c] text-slate-100 antialiased selection:bg-amber-500/20 selection:text-amber-400"
      dir="rtl"
    >
      {/* ── Glow Effects ────────────────────────────────────────── */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-blue-900/40 border-b border-indigo-500/10 text-center py-2 px-4 relative z-50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-blue-100">
          تحديث المنهج المصري 2026: المنصة تغطي بالكامل من **الصف الأول الابتدائي** إلى **الصف الثالث الثانوي** (١٢ صفاً دراسياً و١٩ مادة)!
        </span>
      </div>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-indigo-500/10 bg-[#070e1c]/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <Logo variant="horizontal" size="md" light />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-300">
            <a href="#demo" className="transition-colors hover:text-amber-400">محاكي الذكاء الاصطناعي</a>
            <a href="#pain" className="transition-colors hover:text-amber-400">السرعة الفائقة</a>
            <a href="#portals" className="transition-colors hover:text-amber-400">بوابات المنصة</a>
            <a href="#schools" className="transition-colors hover:text-amber-400 text-amber-400 font-extrabold">استبق مصر للمدارس 🏫</a>
            <a href="#ads" className="transition-colors hover:text-amber-400">قصص المعلمين</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:text-amber-400"
            >
              <Users className="h-4 w-4 text-indigo-400" />
              بوابة الدخول
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 px-5 py-2.5 text-sm font-black text-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 active:translate-y-0"
            >
              سجّل مجاناً
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-20 text-center sm:px-6 z-10">
        <div className="mx-auto max-w-5xl">
          {/* Active Badge */}
          <div className="mb-6 inline-flex animate-bounce items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-xs sm:text-sm shadow-inner backdrop-blur-md">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-amber-300">
              المنظومة التعليمية المتكاملة للمدارس والمعلمين والطلاب 🇪🇬
            </span>
          </div>

          <h1 className="mb-6 font-display text-4xl font-black leading-tight sm:text-7xl">
            حضّر، تفاعل، وتفوّق في
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(240,192,64,0.25)]">
              ثوانٍ بالذكاء الاصطناعي
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-300">
            المنصة التعليمية الأذكى في مصر! حوّل أي كتاب، أو ملخص، أو فيديو يوتيوب، أو تسجيل صوتي إلى امتحانات ذكية وتدريبات تفاعلية في ٤٥ ثانية فقط. تدعم المنظومة بالكامل طلاب المدارس من <span className="text-amber-400 font-extrabold underline underline-offset-4">الصف الأول الابتدائي إلى الصف الثالث الثانوي</span> للارتقاء بالتفوق القومي.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-16">
            <Link
              href="/auth/register"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-4 text-lg font-black text-slate-900 shadow-xl shadow-amber-500/25 transition-all hover:scale-105 hover:from-amber-400 hover:to-yellow-300 sm:w-auto"
            >
              أنشئ حسابك المجاني الآن
              <ArrowLeft className="h-5 w-5 shrink-0" />
            </Link>
            <a
              href="#demo"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-8 py-4 text-lg font-bold text-slate-200 backdrop-blur-md transition-all hover:bg-indigo-950/60 sm:w-auto"
            >
              <Sparkles className="h-5 w-5 text-indigo-400" />
              جرب محاكي التوليد فوراً
            </a>
          </div>

          {/* Quick Metrics Grid */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: `+${stats.studentsCount}`, label: 'طالب مسجل' },
              { value: `+${stats.teachersCount}`, label: 'معلم ومربي' },
              { value: `+${stats.questionsCount}`, label: 'سؤال في بنك الأسئلة' },
              { value: `+${stats.examsCount}`, label: 'اختبار مجاب' },
            ].map((s, index) => (
              <div
                key={index}
                className="rounded-2xl border border-indigo-500/10 bg-indigo-950/20 p-5 text-center shadow-lg backdrop-blur-md transition-all hover:border-indigo-500/20"
              >
                <div className="mb-1 text-2xl font-black text-amber-400">
                  {s.value}
                </div>
                <div className="text-xs font-bold text-slate-400 leading-normal">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive AI Simulator Section ───────────────────── */}
      <section id="demo" className="relative bg-[#0b1426] px-4 py-20 sm:px-6 border-y border-indigo-500/10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              قوة الذكاء الاصطناعي بين يديك
            </div>
            <h2 className="mb-4 font-display text-2xl sm:text-4xl font-black">
              جرّب الذكاء الاصطناعي لاستبق مصر (فاهم) بنفسك
            </h2>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              اختر نوع الملف، وقم بمحاكاة رفعه لترى كيف يقوم محرك استبق مصر (Gemini AI) بتصفية المناهج وتحويل المحتوى إلى اختبار تفاعلي في ثوانٍ.
            </p>
          </div>

          <div className="rounded-3xl border border-indigo-500/20 bg-[#070e1c]/90 overflow-hidden shadow-2xl">
            {/* Simulator Tabs */}
            <div className="flex border-b border-indigo-500/10 bg-[#0d172b]">
              {[
                { id: 'pdf', label: 'ملف PDF / Word / PPT', icon: FileText },
                { id: 'youtube', label: 'رابط فيديو يوتيوب', icon: Youtube },
                { id: 'audio', label: 'تسجيل صوتي أو شرح', icon: Music },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id as UploadType)
                    setSimulating(false)
                    setSimComplete(false)
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 ${
                    activeTab === t.id
                      ? 'border-amber-400 text-amber-400 bg-indigo-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.id.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* Simulator Body */}
            <div className="p-6 sm:p-10">
              {!simulating && !simComplete ? (
                <div>
                  {activeTab === 'pdf' && (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        dragActive
                          ? 'border-amber-400 bg-amber-500/5'
                          : 'border-indigo-500/25 bg-[#0b1426]/50 hover:border-indigo-500/40'
                      }`}
                    >
                      <Upload className="h-12 w-12 text-indigo-400 mb-4 animate-pulse" />
                      <h4 className="text-base font-bold text-slate-200 mb-2">اسحب وأفلت كتاب الوزارة أو ملخص الدرس هنا</h4>
                      <p className="text-xs text-slate-400 mb-6">يدعم ملفات PDF, DOCX, PPTX حتى 50 ميجابايت</p>
                      <button
                        onClick={startSimulation}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/10 transition-all hover:-translate-y-0.5"
                      >
                        اختر ملفاً من جهازك
                      </button>
                    </div>
                  )}

                  {activeTab === 'youtube' && (
                    <div className="max-w-xl mx-auto py-6">
                      <div className="flex flex-col gap-3">
                        <label className="text-xs sm:text-sm font-bold text-slate-300">أدخل رابط فيديو الشرح من اليوتيوب:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="مثال: https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="flex-1 rounded-xl border border-indigo-500/20 bg-[#0b1426] px-4 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={startSimulation}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 text-xs sm:text-sm font-bold transition-all shrink-0"
                          >
                            ابدأ التحليل والتوليد
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          سيقوم الذكاء الاصطناعي بالاستماع لصوت الفيديو واستخراج الدرس كاملاً ثم توليد الامتحان!
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#0b1426]/50 border border-indigo-500/10 rounded-2xl">
                      <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                        <Music className="h-8 w-8 text-rose-500" />
                      </div>
                      <h4 className="text-base font-bold text-slate-200 mb-2">ارفع ملف التسجيل الصوتي للحصة أو الشرح</h4>
                      <p className="text-xs text-slate-400 mb-6">يدعم MP3, WAV, M4A للدروس المسجلة</p>
                      <button
                        onClick={startSimulation}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 text-xs sm:text-sm font-bold transition-all"
                      >
                        ارفع الملف الصوتي
                      </button>
                    </div>
                  )}
                </div>
              ) : simulating ? (
                /* Generating Simulation Mode */
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="relative h-20 w-20 mb-8">
                    {/* Glowing spinner */}
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-amber-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-indigo-500/10 border-b-blue-400 animate-spin animate-reverse" />
                    <Brain className="absolute inset-0 m-auto h-8 w-8 text-amber-300 animate-pulse" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-200 mb-2">جاري توليد الامتحان بالذكاء الاصطناعي...</h3>
                  <div className="w-full max-w-md h-2 bg-indigo-950 rounded-full overflow-hidden mb-6 p-0.5 border border-indigo-500/15">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-400 rounded-full transition-all duration-1000"
                      style={{ width: `${((simStep + 1) / simSteps.length) * 100}%` }}
                    />
                  </div>

                  <p className="text-sm font-semibold text-amber-400 animate-pulse text-center">
                    {simSteps[simStep]}
                  </p>
                </div>
              ) : (
                /* Simulation Complete Show Result Question */
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-500/10">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      </span>
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                        اكتمل التوليد بنجاح في ٤٥ ثانية!
                      </span>
                    </div>
                    <button
                      onClick={startSimulation}
                      className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      امتحان جديد
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#0b1426] p-6 border border-indigo-500/15 mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-6">{demoQuestion.question}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {demoQuestion.options.map((opt) => {
                        const isCorrect = opt === demoQuestion.answer
                        const isSelected = opt === selectedAnswer
                        let btnStyle = 'border-indigo-500/20 bg-indigo-950/30 text-slate-300 hover:bg-indigo-950/50 hover:border-indigo-500/40'
                        
                        if (selectedAnswer) {
                          if (isCorrect) {
                            btnStyle = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                          } else if (isSelected) {
                            btnStyle = 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                          } else {
                            btnStyle = 'border-indigo-500/10 bg-indigo-950/10 text-slate-500 opacity-60'
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={!!selectedAnswer}
                            onClick={() => {
                              setSelectedAnswer(opt)
                              setShowExplanation(true)
                            }}
                            className={`w-full rounded-xl border p-4 text-right text-xs sm:text-sm font-semibold transition-all flex items-start gap-2.5 ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {selectedAnswer && isCorrect && <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400 mr-auto" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {showExplanation && (
                    <div className="rounded-2xl bg-amber-500/5 border border-amber-500/25 p-5 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                        <h4 className="text-sm font-black text-amber-400">تفسير الذكاء الاصطناعي (منهج الوزارة):</h4>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                        {demoQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain & Surprise Section (Comparison) ───────────────── */}
      <section id="pain" className="relative bg-[#070e1c] px-4 py-24 sm:px-6 z-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Copywriter Hooks */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400">
                <Clock className="h-3.5 w-3.5" />
                سؤال صريح لكل معلم مصري
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-black leading-tight text-white">
                بتقضي كام ساعة في <br />
                <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-amber-300 bg-clip-text text-transparent">
                  عمل أسئلة الامتحان؟
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                لو بتعمل أسئلة بايدك في ٢٠٢٦ — فالمعادلة اتغيرت! المدرسين في مصر بيقضوا ساعات طويلة جداً أسبوعياً لكتابة ومراجعة أسئلة الامتحانات (MCQ، صح وخطأ، أكمل) وتصميم نماذج الإجابات لكل درس وبكل صف.
              </p>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-5">
                <h4 className="text-amber-400 font-bold text-sm sm:text-base mb-1.5">💥 المفاجأة الحقيقية:</h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                  معلم في مصر قام برفع ملف الدرس على منصة استبق مصر (فاهم)، وصمم امتحاناً كاملاً ومنسقاً بنسبة ١٠٠٪ في <span className="text-amber-400 font-extrabold underline decoration-amber-400 decoration-2">٤٥ ثانية بالظبط!</span> لا تضيع وقتك الثمين في التحضير اليدوي بعد اليوم وركّز على تعليم وتوجيه طلابك.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">مطابقة للمواصفات الفنية للوزارة</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">مستويات متدرجة (سهل/متوسط/صعب)</span>
                </div>
              </div>
            </div>

            {/* Pain / Solution Split Box */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-indigo-500/10 bg-[#0b1426] p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-center text-white border-b border-indigo-500/10 pb-4">مقارنة التوفير والإنتاجية</h3>
                
                {/* Traditional */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-rose-400">
                    <span>الطريقة اليدوية التقليدية</span>
                    <span>3 إلى 4 ساعات</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-rose-500/20">
                    <div className="h-full bg-rose-500 rounded-full w-full" />
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>بحث مرهق بالكتب والملخصات عن أسئلة مناسبة.</li>
                    <li>إدخال يدوي وتنسيق متكرر قد يحتوي على أخطاء إملائية.</li>
                    <li>صعوبة إعداد نماذج الإجابات وتفاسيرها للطلاب.</li>
                  </ul>
                </div>

                {/* Fahem */}
                <div className="space-y-2.5 pt-4 border-t border-indigo-500/10">
                  <div className="flex justify-between text-xs font-bold text-amber-400">
                    <span>مع منصة استبق مصر الذكية</span>
                    <span>٤٥ ثانية فقط!</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-amber-500/20">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full w-6" />
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside font-semibold">
                    <li>رفع الدرس أو رابط اليوتيوب بنقرة واحدة.</li>
                    <li>تصفية المحتوى واستخراج أسئلة دقيقة فورياً.</li>
                    <li>نموذج إجابة وتفسير شامل باللغة العربية والرموز العلمية.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Covered Grades Section ────────────────────────────── */}
      <section className="relative bg-[#0b1426] px-4 py-20 sm:px-6 border-y border-indigo-500/10 z-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 font-display text-2xl sm:text-4xl font-black text-white">
              جميع المراحل والصفوف الدراسية بالمنهج المصري
            </h2>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              من الصف الأول الابتدائي وحتى شهادة الثانوية العامة! تدعم منصة استبق مصر (فاهم) نظام التعليم المصري بالكامل لـ ١٩ مادة دراسية وعلمية.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Primary */}
            <div className="rounded-3xl border border-indigo-500/10 bg-[#070e1c] p-6 hover:border-indigo-500/20 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-500/20">
                <BookOpen className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">المرحلة الابتدائية</h3>
              <p className="text-xs text-slate-400 mb-6">من الصف الأول الابتدائي إلى الصف السادس الابتدائي</p>
              <div className="space-y-2 border-t border-indigo-500/10 pt-4">
                {['الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'].map((g) => (
                  <div key={g} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>الصف {g}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prep */}
            <div className="rounded-3xl border border-amber-500/20 bg-[#070e1c] p-6 hover:border-amber-500/30 transition-all relative">
              <div className="absolute top-4 left-4 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/25">
                تفاعلية نشطة
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-500/20">
                <Flame className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">المرحلة الإعدادية</h3>
              <p className="text-xs text-slate-400 mb-6">من الصف الأول الإعدادي إلى الصف الثالث الإعدادي</p>
              <div className="space-y-2 border-t border-indigo-500/10 pt-4">
                {['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي'].map((g) => (
                  <div key={g} className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>الصف {g}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary */}
            <div className="rounded-3xl border border-indigo-500/10 bg-[#070e1c] p-6 hover:border-indigo-500/20 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-500/20">
                <GraduationCap className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">المرحلة الثانوية</h3>
              <p className="text-xs text-slate-400 mb-6">من الصف الأول الثانوي إلى الصف الثالث الثانوي العام</p>
              <div className="space-y-2 border-t border-indigo-500/10 pt-4">
                {['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي (علاقات التوجيه والامتحان الشامل)'].map((g) => (
                  <div key={g} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>الصف {g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The School Portal Section ("بوابة استبق مصر للمدارس") ───────── */}
      <section id="schools" className="relative bg-gradient-to-b from-[#070e1c] to-[#0b1426] px-4 py-24 sm:px-6 z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-6xl relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Info Column */}
            <div className="space-y-6 text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs sm:text-sm font-bold text-blue-300">
                <School className="h-4 w-4 text-blue-400" />
                <span>منظومة استبق مصر المتكاملة للمدارس 🏫</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-black leading-tight text-white">
                منظومة تعليمية ذكية
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-amber-300 bg-clip-text text-transparent">
                  تقود مدرستك نحو الصدارة
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                احصل على بوابة مخصصة بالكامل باسم وشعار مدرستك، مجهزة بأحدث أدوات الذكاء الاصطناعي لتسهيل عمل المعلمين وتتبع مستوى الطلاب بدقة متناهية. نوفر لك تدريباً مجانياً كاملاً ودعماً فنياً على مدار الساعة.
              </p>

              <div className="space-y-4 pt-4">
                {[
                  {
                    title: 'هوية بصرية مخصصة بالكامل',
                    desc: 'بوابة إلكترونية تحمل اسم وشعار مدرستك لتعزيز العلامة التجارية والموثوقية.',
                    icon: Shield,
                  },
                  {
                    title: 'تقارير أداء فورية وذكية',
                    desc: 'لوحة تحكم إدارية تمكن الإدارة والمشرفين من متابعة نسب التحصيل والاستيعاب فورياً.',
                    icon: TrendingUp,
                  },
                  {
                    title: 'توفير ٩٠٪ من وقت التحضير',
                    desc: 'تمكين المعلمين من تحضير الحصص وتوليد الامتحانات المنسقة في ٤٥ ثانية فقط.',
                    icon: Zap,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white mb-0.5">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-400 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Column */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-indigo-500/10 bg-[#0b1426] p-6 sm:p-8 space-y-6">
                {!formSubmitted ? (
                  <form onSubmit={handleSchoolSubmit} className="space-y-4">
                    <div className="text-center border-b border-indigo-500/10 pb-4 mb-4">
                      <h3 className="text-lg font-black text-amber-400">سجل اهتمام مدرستك الآن</h3>
                      <p className="text-xs text-slate-400">
                        احصل على ترخيص بوابتكم الخاصة وتدريب مجاني شامل للمشرفين والمعلمين
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">اسم المدرسة / المجمع التعليمي</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3.5 h-4.5 w-4.5 text-indigo-400" />
                        <input
                          type="text"
                          required
                          placeholder="مثال: مدرسة الفاروق الحديثة"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="w-full rounded-xl border border-indigo-500/20 bg-[#0b1426] pl-3 pr-10 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">اسم المسؤول أو ممثل المدرسة</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3.5 h-4.5 w-4.5 text-indigo-400" />
                        <input
                          type="text"
                          required
                          placeholder="مثال: أ/ محمود محمد - المدير العام"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full rounded-xl border border-indigo-500/20 bg-[#0b1426] pl-3 pr-10 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم الهاتف (الواتساب للتواصل)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-4.5 w-4.5 text-indigo-400" />
                        <input
                          type="tel"
                          required
                          placeholder="مثال: 01012345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-indigo-500/20 bg-[#0b1426] pl-3 pr-10 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">البريد الإلكتروني للمراسلات</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3.5 h-4.5 w-4.5 text-indigo-400" />
                        <input
                          type="email"
                          required
                          placeholder="school@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-indigo-500/20 bg-[#0b1426] pl-3 pr-10 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingForm}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-900 font-black py-4.5 text-sm transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                    >
                      {submittingForm ? (
                        <span className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>أرسل طلب انضمام المدرسة</span>
                          <ArrowLeft className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Form Success Message */
                  <div className="py-12 text-center space-y-5 animate-fadeIn">
                    <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Check className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-black text-emerald-400">تم تسجيل طلبكم بنجاح!</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      شكراً لتواصلكم معنا. تم حجز مقعد ذهبي لمدرستكم <span className="text-amber-400 font-bold">"{schoolName}"</span> في قائمة الانتظار. سيقوم مسؤول علاقات المدارس بالتواصل الهاتفي معكم عبر واتساب للتنسيق وتفعيل البوابة خلال ٤٨ ساعة عمل.
                    </p>
                    <button
                      onClick={() => setFormSubmitted(false)}
                      className="text-xs text-indigo-400 hover:text-amber-400 font-bold underline"
                    >
                      تسجيل مدرسة أخرى
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Multi-Portal Gateway (Students & Teachers) ─────────── */}
      <section id="portals" className="relative bg-[#070e1c] px-4 py-24 sm:px-6 z-10 border-t border-indigo-500/10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-2xl sm:text-4xl font-black text-white">
              بوابات ذكية لكل أطراف العملية التعليمية
            </h2>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              سواء كنت معلماً يبحث عن السهولة والتحضير، أو طالباً يطمح للتفوق والدراسة بطريقة ممتعة، فقد صممنا لك مساحتك الخاصة بالكامل.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Student CTA */}
            <div className="flex flex-col items-center rounded-3xl border border-indigo-500/10 bg-[#0b1426] p-8 text-center transition-all duration-300 hover:border-amber-500/25 hover:shadow-xl hover:shadow-amber-500/5">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-[#070e1c] shadow-inner">
                <Trophy className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="mb-3 text-2xl font-black text-white">بوابة الطالب المتفوق</h3>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-400 font-medium">
                تحدى أقرانك في منافسات ١ ضد ١ حية، حل تدريبات تفاعلية مكيّفة بمستواك، اجمع نقاط الخبرة (XP)، وتصدر لوحة الشرف الأسبوعية على مستوى جمهورية مصر العربية!
              </p>
              <Link
                href="/auth/register"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-600/10 transition-all"
              >
                إنشاء حساب طالب مجاناً
              </Link>
            </div>

            {/* Teacher CTA */}
            <div className="flex flex-col items-center rounded-3xl border border-indigo-500/10 bg-[#0b1426] p-8 text-center transition-all duration-300 hover:border-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-[#070e1c] shadow-inner">
                <Brain className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="mb-3 text-2xl font-black text-white">بوابة المعلم المبدع</h3>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-400 font-medium">
                أدر مجموعات فصولك ودروسك بذكاء، صمم امتحانات شاملة من الكتب ومقاطع يوتيوب في ثوانٍ، وتتبع تقارير أداء ومستوى استيعاب كل طالب تلقائياً دون تصحيح يدوي.
              </p>
              <Link
                href="/auth/register?role=teacher"
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 py-4 font-black text-slate-900 shadow-lg shadow-amber-500/10 transition-all"
              >
                إنشاء بوابة معلم مجاناً
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marketing Campaigns & Social Proof (إعلانات وقصص المعلمين) ──── */}
      <section id="ads" className="relative bg-[#0b1426] px-4 py-24 sm:px-6 z-10 border-t border-indigo-500/10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 mb-3">
              <Star className="h-3.5 w-3.5" />
              قصص نجاح من قلب المدارس المصرية
            </div>
            <h2 className="mb-4 font-display text-2xl sm:text-4xl font-black text-white">
              لماذا يتحدث الجميع عن منصة استبق مصر (فاهم)؟
            </h2>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              شاهد كيف تحول الأستاذ أحمد ومعلمون آخرون من الإرهاق اليومي إلى التحضير الذكي، ورأي طلابهم في التقييمات.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Story 1 */}
            <div className="rounded-3xl border border-indigo-500/10 bg-[#070e1c] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-sm">
                  أ.أ
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">أحمد عبد العال</h4>
                  <p className="text-[10px] text-slate-400">مدرس علوم - القاهرة</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-semibold italic">
                "كنت بضيع ٤ ساعات كل أسبوع في عمل امتحانات الصفوف الإعدادية. دلوقتي برفع كتاب الامتحان لاستبق مصر (فاهم)، وفـ ٤٥ ثانية بخرج امتحان متناسق والطلاب بيحلوه على موبايلاتهم فوراً!"
              </p>
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
            </div>

            {/* Story 2 */}
            <div className="rounded-3xl border border-indigo-500/10 bg-[#070e1c] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-sm">
                  م.م
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">منى محمود</h4>
                  <p className="text-[10px] text-slate-400">مدرسة لغة عربية - الجيزة</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-semibold italic">
                "بصراحة طلاب مدرستي بدأوا يذاكروا أكتر ويسألوني عن التحديات اليومية بعد ما ربطت فصولي بمنصة استبق مصر (فاهم). فكرة التحديات 1v1 غيرت شغفهم بالكامل بدون أي ضغط مني!"
              </p>
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
            </div>

            {/* Story 3 */}
            <div className="rounded-3xl border border-indigo-500/10 bg-[#070e1c] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 text-sm">
                  د.ع
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">د. عماد عثمان</h4>
                  <p className="text-[10px] text-slate-400">مدير مجمع تعليمي - الإسكندرية</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-semibold italic">
                "سجلنا كإدارة مدرسة للحصول على بوابة استبق مصر للمدارس القادمة، ودلوقتي بنقيس ونحلل مستويات تفوق طلابنا ونسبة تحصيلهم لكل المواد دراسياً بذكاء متناهي وتقارير دورية."
              </p>
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Features List ────────────────────────────────── */}
      <section className="relative bg-[#070e1c] px-4 py-24 sm:px-6 z-10 border-t border-indigo-500/10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-2xl sm:text-4xl font-black text-white">
              خصائص ممتازة وحلول متكاملة
            </h2>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-amber-400" />
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400">
              لماذا تعتبر منصة استبق مصر (فاهم) منظومة التعليم الذكية الأقوى؟
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Swords,
                title: 'تحديات تنافسية مباشرة',
                description: 'تحدَّ زملاءك في مسابقات حية. ١٠ أسئلة، ١٥ ثانية لكل سؤال، مع تصدّر لوحات الشرف القومية.',
                color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
              },
              {
                icon: Trophy,
                title: 'لوحة الشرف القومية',
                description: 'ترتيب وتكريم أسبوعي محدّث على مستوى الجمهورية لتشجيع الطلاب على زيادة الاستيعاب.',
                color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              },
              {
                icon: Brain,
                title: 'توليد امتحانات بالذكاء الاصطناعي',
                description: 'محرك Gemini AI متكامل يقرأ ملفات PDF، مقاطع يوتيوب، وتسجيلات الحصص لتوليد أسئلة فورية.',
                color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              },
              {
                icon: TrendingUp,
                title: 'تتبع تفصيلي للمستويات',
                description: 'تقارير أداء ورسوم بيانية توضح نقاط القوة والضعف في كل مادة وفرع من المنهج المصري.',
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              },
              {
                icon: Star,
                title: 'نظام XP ومستويات الأبطال',
                description: 'اجمع نقاط الخبرة مع كل سؤال صحيح، وارتقِ بلقبك من مبتدئ إلى ملك اللغة والمفهوم العلمي.',
                color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
              },
              {
                icon: BookOpen,
                title: '١٢ صفاً و١٩ مادة دراسية',
                description: 'محتوى دراسي محدث بالكامل ومطابق لوزارة التربية والتعليم من الابتدائي للثانوية العامة.',
                color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border border-indigo-500/10 bg-[#0b1426] p-8 card-hover group flex flex-col transition-all duration-300 hover:border-indigo-500/20"
              >
                <div
                  className={`h-14 w-14 rounded-2xl ${f.color} border mb-6 flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110`}
                >
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-lg sm:text-xl font-bold text-white">
                  {f.title}
                </h3>
                <p className="flex-1 text-xs sm:text-sm font-medium leading-relaxed text-slate-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Elegant Final CTA ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0b1426] px-4 py-24 sm:px-6 border-t border-indigo-500/10 z-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-5xl text-center space-y-6">
          <h2 className="mb-4 font-display text-3xl sm:text-5xl font-black text-white">
            انضم الآن للمنصة التعليمية الأذكى في مصر
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-sm sm:text-base text-slate-400 font-semibold">
            سواء كنت قائداً لمدرسة تطمح لبوابتها الخاصة، معلماً يسعى لاختصار الساعات، أو طالباً يسعى لاعتلاء منصات التفوق، فإن استبق مصر (فاهم) هو منظومتك المثالية.
          </p>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {/* Student CTA */}
            <div className="flex flex-col items-center rounded-2xl border border-indigo-500/10 bg-[#070e1c] p-6 text-center transition-all hover:border-amber-500/20">
              <Trophy className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="mb-2 text-lg font-bold text-white">بوابة الطالب</h3>
              <p className="mb-6 flex-1 text-xs text-slate-400 leading-relaxed">
                تحدى زملاءك، اجمع نقاط XP، وتصدر لوحة الشرف القومية في منافسات ممتعة.
              </p>
              <Link
                href="/auth/register"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs sm:text-sm font-bold text-white transition-all"
              >
                حساب طالب مجاني
              </Link>
            </div>

            {/* Teacher CTA */}
            <div className="flex flex-col items-center rounded-2xl border border-indigo-500/10 bg-[#070e1c] p-6 text-center transition-all hover:border-indigo-500/20">
              <Brain className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="mb-2 text-lg font-bold text-white">بوابة المعلم</h3>
              <p className="mb-6 flex-1 text-xs text-slate-400 leading-relaxed">
                أدر مجموعات طلابك، ولد امتحانات من الكتب والفيديوهات في ٤٥ ثانية.
              </p>
              <Link
                href="/auth/register?role=teacher"
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 py-3 text-xs sm:text-sm font-black text-slate-900 transition-all"
              >
                بوابة معلم مجاناً
              </Link>
            </div>

            {/* School CTA */}
            <div className="flex flex-col items-center rounded-2xl border border-indigo-500/10 bg-[#070e1c] p-6 text-center transition-all hover:border-indigo-500/20">
              <School className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="mb-2 text-lg font-bold text-white">بوابة المدارس</h3>
              <p className="mb-6 flex-1 text-xs text-slate-400 leading-relaxed">
                لوحة تحكم إدارية شاملة للمجمع المدرسي مع شعار خاص وربط أولياء الأمور.
              </p>
              <a
                href="#schools"
                className="w-full rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-950/60 py-3 text-xs sm:text-sm font-bold text-slate-300 transition-all"
              >
                تسجيل اهتمام المدرسة
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-indigo-500/10 bg-[#070e1c] px-4 py-16 text-center text-slate-400 sm:px-6 relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
          <Link href="/" className="transition-opacity hover:opacity-95">
            <Logo variant="vertical" size="lg" light />
          </Link>
          <p className="max-w-md text-xs sm:text-sm font-medium leading-relaxed text-slate-400">
            المنصة والمنظومة التعليمية والتحديات الذكية للطلاب والمعلمين والمدارس بجمهورية مصر العربية.
          </p>

          <div className="my-4 flex w-full max-w-xl items-center justify-center gap-6 border-y border-indigo-500/10 py-4 text-xs sm:text-sm font-semibold">
            <Link href="/auth/login" className="transition-colors hover:text-white">تسجيل الدخول</Link>
            <span className="text-slate-800">|</span>
            <Link href="/auth/register" className="transition-colors hover:text-white">حساب جديد</Link>
            <span className="text-slate-800">|</span>
            <Link href="/auth/admin-login" className="transition-colors hover:text-white">بوابة الإدارة</Link>
            <span className="text-slate-800">|</span>
            <a
              href="#schools"
              className="transition-colors text-amber-400 hover:text-amber-300 font-bold"
            >
              استبق مصر للمدارس
            </a>
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} استبق - مصر ( فاهم )
          </p>
        </div>
      </footer>
    </div>
  )
}
