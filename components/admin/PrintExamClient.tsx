'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Printer,
  Eye,
  EyeOff,
  LayoutList,
  Sliders,
  School,
  UserCheck,
  FileText,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles,
  Type,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  CheckCircle2,
  Stamp,
  Award,
  Layers,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import {
  getSubjectDirection,
  getSubjectTextAlignClass,
} from '@/lib/utils/subject-formatting'

export type AnswerMode = 'none' | 'short' | 'full'

interface PassageBlock {
  passage: string | null
  questions: any[]
}

interface PrintCustomSettings {
  // Mode: official ministerial (Nepras standard) vs personal tutor vs both
  headerType: 'official' | 'personal' | 'both'

  // Standard 3-Column Ministerial Header Data
  directorate: string      // المحافظة
  administration: string   // الإدارة التعليمية
  schoolName: string       // المدرسة
  academicYear: string     // العام الدراسي

  // Personal / Center Data
  displayName: string      // اسم المعلم
  title: string            // الصفة / التخصص
  phone: string            // الهاتف / الواتساب
  social: string           // المعرف / الصفحة

  // Exam Meta
  customTitle: string      // عنوان الامتحان المطبوع
  examModel: string        // رمز النموذج (أ / ب / ج / د)
  termName: string         // الفصل الدراسي
  durationMinutes: string  // زمن الإجابة
  totalPoints: string      // الدرجة الكلية
  subjectName: string      // المادة
  gradeName: string        // الصف
  examDate: string         // تاريخ الاختبار

  // Logo & Styling
  logoUrl: string
  hasBorderFrame: boolean  // إطار مطبعي مزدوج
  fontSize: 'small' | 'medium' | 'large'
  density: 'compact' | 'normal' | 'spacious'

  // Student Bar
  showStudentBar: boolean
  showStudentName: boolean
  showSeatNumber: boolean
  showClassSection: boolean
  classSection: string
  showExamDate: boolean

  // Instructions
  showInstructions: boolean
  instructionsText: string

  // Official NeprasPro Footer & Signatures
  showSignatures: boolean
  signRole1: string
  signRole1Sub: string
  signRole2: string
  signRole2Sub: string
  signRole3: string
  signRole3Sub: string
  signRole4: string
  signRole4Sub: string
  showSchoolStamp: boolean
  showFooterCheer: boolean
  footerCheer: string

  // Watermark
  showWatermark: boolean
  watermarkText: string
}

export function PrintExamClient({
  exam,
  questions,
}: {
  exam: any
  questions: any[]
}) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>('none')
  const [showSectionHeaders, setShowSectionHeaders] = useState(true)
  const [hiddenQuestions, setHiddenQuestions] = useState<Set<string>>(new Set())

  // Customization drawer & quick state
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'official' | 'exam' | 'personal' | 'style' | 'footer'>('official')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Clean initial defaults matching NeprasPro Ministerial Protocol
  const [settings, setSettings] = useState<PrintCustomSettings>({
    headerType: 'official',
    directorate: 'الجيزة',
    administration: 'الدقي',
    schoolName: 'الشهيد محمد سليمان سلامة الإعدادية بنين',
    academicYear: '2025 / 2026 م',
    displayName: '',
    title: 'خبير تدريس أول',
    phone: '',
    social: '',
    customTitle: exam?.title || '',
    examModel: '',
    termName: 'الفصل الدراسي الأول',
    durationMinutes: exam?.duration_minutes ? String(exam.duration_minutes) : '40',
    totalPoints: exam?.total_points ? String(exam.total_points) : '25',
    subjectName: exam?.subjects?.name_ar || '',
    gradeName: exam?.grades?.name_ar || '',
    examDate: '',
    logoUrl: '',
    hasBorderFrame: true,
    fontSize: 'medium',
    density: 'normal',
    showStudentBar: true,
    showStudentName: true,
    showSeatNumber: true,
    showClassSection: true,
    classSection: '',
    showExamDate: false,
    showInstructions: true,
    instructionsText: 'تنبيه: أجب عن جميع الأسئلة الآتية في نفس الورقة - ممنوع استخدام الآلة الحاسبة أو مزيل الحبر',
    showSignatures: true,
    signRole1: 'واضع الامتحان',
    signRole1Sub: '(المسؤول المختص)',
    signRole2: 'المراجع والأخصائي',
    signRole2Sub: '(رئيس الحجرة)',
    signRole3: 'وكيل شؤون الطلاب',
    signRole3Sub: '(رئيس الكنترول)',
    signRole4: 'مدير المدرسة',
    signRole4Sub: '(يعتمد)',
    showSchoolStamp: true,
    showFooterCheer: true,
    footerCheer: 'انتهت الأسئلة مع أطيب التمنيات بالنجاح والتفوق',
    showWatermark: false,
    watermarkText: '',
  })

  // Load defaults from localStorage
  useEffect(() => {
    const savedDefaults = localStorage.getItem('nepras_pro_print_defaults')
    let baseSettings: Partial<PrintCustomSettings> = {}
    if (savedDefaults) {
      try {
        baseSettings = JSON.parse(savedDefaults)
      } catch {}
    }

    const examSpecific = localStorage.getItem(`nepras_print_exam_${exam?.id}`)
    let examSettings: Partial<PrintCustomSettings> = {}
    if (examSpecific) {
      try {
        examSettings = JSON.parse(examSpecific)
      } catch {}
    }

    setSettings((prev) => ({
      ...prev,
      ...baseSettings,
      ...examSettings,
      customTitle: examSettings.customTitle || prev.customTitle || exam?.title || '',
      subjectName: examSettings.subjectName || prev.subjectName || exam?.subjects?.name_ar || '',
      durationMinutes: examSettings.durationMinutes || (exam?.duration_minutes ? String(exam.duration_minutes) : prev.durationMinutes),
      totalPoints: examSettings.totalPoints || (exam?.total_points ? String(exam.total_points) : prev.totalPoints),
    }))

    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        setSettings((prev) => ({ ...prev, ...customEvent.detail }))
      }
    }
    window.addEventListener('print-settings-changed', handleSettingsChange)

    return () => {
      window.removeEventListener('print-settings-changed', handleSettingsChange)
    }
  }, [exam?.id])

  // Auto-save per-exam settings to localStorage
  useEffect(() => {
    if (!exam?.id) return
    try {
      localStorage.setItem(
        `nepras_print_exam_${exam.id}`,
        JSON.stringify(settings)
      )
    } catch {}
  }, [settings, exam?.id])

  // Save current school/teacher info as GLOBAL DEFAULTS (Nepras Standard)
  const handleSaveAsDefaults = () => {
    try {
      const defaultsToSave = {
        headerType: settings.headerType,
        directorate: settings.directorate,
        administration: settings.administration,
        schoolName: settings.schoolName,
        academicYear: settings.academicYear,
        displayName: settings.displayName,
        title: settings.title,
        phone: settings.phone,
        social: settings.social,
        logoUrl: settings.logoUrl,
        hasBorderFrame: settings.hasBorderFrame,
        fontSize: settings.fontSize,
        density: settings.density,
        showSignatures: settings.showSignatures,
        signRole1: settings.signRole1,
        signRole1Sub: settings.signRole1Sub,
        signRole2: settings.signRole2,
        signRole2Sub: settings.signRole2Sub,
        signRole3: settings.signRole3,
        signRole3Sub: settings.signRole3Sub,
        signRole4: settings.signRole4,
        signRole4Sub: settings.signRole4Sub,
        showSchoolStamp: settings.showSchoolStamp,
        footerCheer: settings.footerCheer,
        watermarkText: settings.watermarkText,
      }
      localStorage.setItem(
        'nepras_pro_print_defaults',
        JSON.stringify(defaultsToSave)
      )
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle local logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings((prev) => ({ ...prev, logoUrl: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  const toggleQuestionVisibility = (qId: string) => {
    setHiddenQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  // NeprasPro Ministerial Cleaning Protocol
  const cleanGov = (settings.directorate || '').replace(/^محافظة\s*/, '').trim() || 'الجيزة'
  const cleanAdmin = (settings.administration || '')
    .replace(/^إدارة\s*/, '')
    .replace(/التعليمية\s*$/, '')
    .trim() || 'الدقي'
  const cleanSchool = (settings.schoolName || '').replace(/^مدرسة\s*/, '').trim() || 'الأورمان'

  // Direction detection
  const subjectName = settings.subjectName || exam?.subjects?.name_ar || ''
  const dir = getSubjectDirection(subjectName)
  const isRTL = dir === 'rtl'
  const textAlign = getSubjectTextAlignClass(subjectName)

  const handlePrint = () => window.print()

  const questionTypeTitlesAR: Record<string, string> = {
    mcq: 'اختر الإجابة الصحيحة من بين القوسين',
    true_false: 'ضع علامة (✓) أمام العبارة الصحيحة وعلامة (✗) أمام العبارة الخطأ',
    fill_blank: 'أكمل مكان النقط بما يناسبها',
    correction: 'صوّب ما تحته خط في العبارات الآتية',
    essay: 'أجب عن الأسئلة المقالية الآتية موضحاً خطوات الحل',
  }

  const questionTypeTitlesEN: Record<string, string> = {
    mcq: 'Choose the Correct Answer',
    true_false: 'Put True (✓) or False (✗)',
    fill_blank: 'Fill in the Blanks',
    correction: 'Correct the Underlined Words',
    essay: 'Answer the Following Questions with Steps',
  }

  const questionTypeTitles = isRTL ? questionTypeTitlesAR : questionTypeTitlesEN

  const typeOrder = ['mcq', 'true_false', 'fill_blank', 'correction', 'essay']
  const groupedByType: { [key: string]: PassageBlock[] } = {}

  for (const q of questions) {
    if (hiddenQuestions.has(q.id)) continue
    const t = q.question_type
    if (!groupedByType[t]) groupedByType[t] = []
    const blocks = groupedByType[t]
    const lastBlock = blocks[blocks.length - 1]
    const passage = q.context_passage || null
    if (lastBlock && lastBlock.passage === passage) {
      lastBlock.questions.push(q)
    } else {
      const existing = blocks.find((b) => b.passage === passage)
      if (existing) existing.questions.push(q)
      else blocks.push({ passage, questions: [q] })
    }
  }

  const activeGroups = typeOrder.filter(
    (t) => groupedByType[t] && groupedByType[t].length > 0
  )
  const hiddenCount = hiddenQuestions.size

  // Density CSS helpers
  const densitySpacing = {
    compact: 'space-y-4 text-[13px]',
    normal: 'space-y-7 text-[15px]',
    spacious: 'space-y-10 text-[16px]',
  }[settings.density]

  const questionGap = {
    compact: 'space-y-2',
    normal: 'space-y-4',
    spacious: 'space-y-6',
  }[settings.density]

  const essayLinesCount = {
    compact: 2,
    normal: 4,
    spacious: 7,
  }[settings.density]

  return (
    <div
      className="min-h-screen bg-slate-200/70 p-2 sm:p-6 md:p-10 print:bg-white print:p-0 font-sans"
      dir={dir}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .print-hidden, .no-print {
            display: none !important;
          }
        }
      `,
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          NEPRASPRO DESKTOP APP TOPBAR (DARK SLATE #0f172a)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="no-print mx-auto mb-6 max-w-5xl overflow-hidden rounded-2xl bg-[#0f172a] text-white shadow-2xl border border-slate-700"
        dir="rtl"
      >
        {/* Main Desktop Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-primary text-white shadow-md">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wide text-white">
                  استديو الطباعة المتطور (معيار نبراس برو الرسمي)
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                  A4 Print Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ترويسة وزارية ثلاثية • إطار مطبعي مزدوج • توقيعات رباعية معتمدة • أسطر إجابة هندسية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCustomizeOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isCustomizeOpen
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Sliders className="h-4 w-4 text-indigo-400" />
              تخصيص البيانات والترويسة
              {isCustomizeOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              طباعة فورية / تصدير PDF
            </button>
          </div>
        </div>

        {/* Quick Toolbar (Density, Answer Mode, Model, Borders) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 px-6 py-3 text-xs">
          {/* Quick Item 1: Answer Mode */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">نسخة الورقة:</span>
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              {(['none', 'short', 'full'] as AnswerMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAnswerMode(mode)}
                  className={`rounded-md px-3 py-1.5 font-bold transition-all ${
                    answerMode === mode
                      ? mode === 'none'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : mode === 'short'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'none'
                    ? 'ورقة الطالب (بدون حل)'
                    : mode === 'short'
                      ? 'الحل السريع'
                      : 'نموذج الإجابة الكامل'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Item 2: Print Density (Compact / Normal / Spacious) */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">كثافة الورقة:</span>
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              {[
                { id: 'compact', label: 'مضغوط (توفير ورق)' },
                { id: 'normal', label: 'قياسي' },
                { id: 'spacious', label: 'متسع للحل' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSettings({ ...settings, density: d.id as any })}
                  className={`rounded-md px-2.5 py-1.5 font-bold transition-all ${
                    settings.density === d.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Item 3: Model quick switch */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">النموذج:</span>
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              {['', 'أ', 'ب', 'ج', 'د'].map((m) => (
                <button
                  key={m}
                  onClick={() => setSettings({ ...settings, examModel: m ? `نموذج (${m})` : '' })}
                  className={`rounded-md px-2.5 py-1 font-bold transition-all ${
                    (m === '' && !settings.examModel) || settings.examModel.includes(`(${m})`)
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m ? `نموذج ${m}` : 'بدون'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Item 4: Border frame toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-300">
              <input
                type="checkbox"
                checked={settings.hasBorderFrame}
                onChange={(e) => setSettings({ ...settings, hasBorderFrame: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-0"
              />
              إطار مطبعي مزدوج
            </label>

            {hiddenCount > 0 && (
              <button
                onClick={() => setHiddenQuestions(new Set())}
                className="rounded-lg bg-orange-500/20 px-2.5 py-1 text-[11px] font-bold text-orange-300 border border-orange-500/30 hover:bg-orange-500/30"
              >
                إظهار {hiddenCount} سؤال مخفي
              </button>
            )}
          </div>
        </div>

        {/* ─── Expandable Full Customization Drawer (Nepras Style) ─── */}
        {isCustomizeOpen && (
          <div className="border-t border-slate-800 bg-slate-900 p-6">
            {/* Tabs Bar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'official', label: 'الترويسة الوزارية الرسمية', icon: School },
                  { id: 'exam', label: 'بيانات الاختبار والزمن والدرجات', icon: FileText },
                  { id: 'personal', label: 'الترويسة الشخصية والشعار', icon: UserCheck },
                  { id: 'footer', label: 'شريط الطالب والتوقيعات والختام', icon: Sparkles },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Save default button */}
              <button
                onClick={handleSaveAsDefaults}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:brightness-110"
              >
                <Save className="h-4 w-4" />
                {savedSuccess ? '✓ تم الحفظ كافتراضي!' : 'حفظ كإعدادات افتراضية دائمة'}
              </button>
            </div>

            {/* TAB 1: OFFICIAL NEPRAS PROTOCOL */}
            {activeTab === 'official' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    نمط الترويسة المعتمد
                  </label>
                  <select
                    value={settings.headerType}
                    onChange={(e) => setSettings({ ...settings, headerType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:border-primary focus:outline-none"
                  >
                    <option value="official">الترويسة الرسمية الوزارية (نبراس برو القياسي)</option>
                    <option value="personal">ترويسة المعلم الخاص / السنتر</option>
                    <option value="both">كلاهما معاً (الرسمي يميناً والشخصي يساراً)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    المحافظة (المديرية)
                  </label>
                  <input
                    type="text"
                    value={settings.directorate}
                    placeholder="مثال: الجيزة أو القاهرة"
                    onChange={(e) => setSettings({ ...settings, directorate: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">ينظف تلقائياً كلمة "محافظة" المكررة.</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    الإدارة التعليمية
                  </label>
                  <input
                    type="text"
                    value={settings.administration}
                    placeholder="مثال: الدقي أو العمرانية"
                    onChange={(e) => setSettings({ ...settings, administration: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">يضاف لاحقاً "التعليمية" تلقائياً.</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    اسم المدرسة / المعهد
                  </label>
                  <input
                    type="text"
                    value={settings.schoolName}
                    placeholder="مثال: مدرسة الأورمان الثانوية بنين"
                    onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">ينظف كلمة "مدرسة" المكررة.</p>
                </div>
              </div>
            )}

            {/* TAB 2: EXAM META */}
            {activeTab === 'exam' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    عنوان ورقة الاختبار الرئيسي
                  </label>
                  <input
                    type="text"
                    value={settings.customTitle}
                    onChange={(e) => setSettings({ ...settings, customTitle: e.target.value })}
                    placeholder="مثال: اختبار منتصف العام الدراسي أو اختبار الوحدة الأولى"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    العام الدراسي الرسمي
                  </label>
                  <input
                    type="text"
                    value={settings.academicYear}
                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                    placeholder="2025 / 2026 م"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    رمز / اسم النموذج
                  </label>
                  <input
                    type="text"
                    value={settings.examModel}
                    onChange={(e) => setSettings({ ...settings, examModel: e.target.value })}
                    placeholder="نموذج (أ) أو نموذج (1)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    زمن الإجابة
                  </label>
                  <input
                    type="text"
                    value={settings.durationMinutes}
                    onChange={(e) => setSettings({ ...settings, durationMinutes: e.target.value })}
                    placeholder="مثال: 45 دقيقة أو ساعتان"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    الدرجة الكلية للاختبار
                  </label>
                  <input
                    type="text"
                    value={settings.totalPoints}
                    onChange={(e) => setSettings({ ...settings, totalPoints: e.target.value })}
                    placeholder="مثال: 30 أو 50"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    المادة الدراسية
                  </label>
                  <input
                    type="text"
                    value={settings.subjectName}
                    onChange={(e) => setSettings({ ...settings, subjectName: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    الصف والفصل الدراسي
                  </label>
                  <input
                    type="text"
                    value={settings.gradeName}
                    onChange={(e) => setSettings({ ...settings, gradeName: e.target.value })}
                    placeholder="مثال: الصف الأول الإعدادي"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PERSONAL & LOGO */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-300">
                      اسم المعلم / المعلمة
                    </label>
                    <input
                      type="text"
                      value={settings.displayName}
                      onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                      placeholder="مثال: أستاذ ضياء العطار"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-300">
                      الصفة واللقب
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                      placeholder="مثال: خبير تدريس أول للرياضيات"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-300">
                      الهاتف / واتساب
                    </label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="مثال: 010xxxxxxxx"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-300">
                      قناة التلجرام أو الصفحة
                    </label>
                    <input
                      type="text"
                      value={settings.social}
                      onChange={(e) => setSettings({ ...settings, social: e.target.value })}
                      placeholder="@istabaq_egypt"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Logo section */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      شعار المدرسة الرسمي / لوجو المعلم (أعلى وسط الترويسة)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      ارفع الشعار من جهازك ليتم تضمينه فورياً بدقة الطباعة.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
                    >
                      <Upload className="h-4 w-4" />
                      رفع الشعار من جهازك
                    </button>

                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, logoUrl: '' })}
                        className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف الشعار
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STUDENT & SIGNATURES */}
            {activeTab === 'footer' && (
              <div className="space-y-4">
                {/* Student Bar */}
                <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">شريط بيانات الطالب</h4>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showStudentBar}
                        onChange={(e) => setSettings({ ...settings, showStudentBar: e.target.checked })}
                      />
                      إظهار شريط الطالب
                    </label>
                  </div>
                  {settings.showStudentBar && (
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-300">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showStudentName}
                          onChange={(e) => setSettings({ ...settings, showStudentName: e.target.checked })}
                        />
                        اسم الطالب
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showSeatNumber}
                          onChange={(e) => setSettings({ ...settings, showSeatNumber: e.target.checked })}
                        />
                        رقم الجلوس
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showClassSection}
                          onChange={(e) => setSettings({ ...settings, showClassSection: e.target.checked })}
                        />
                        الفصل / الشعبة
                      </label>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">شريط تعليمات وتنبيهات ورقة الأسئلة</h4>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showInstructions}
                        onChange={(e) => setSettings({ ...settings, showInstructions: e.target.checked })}
                      />
                      إظهار شريط التعليمات
                    </label>
                  </div>
                  {settings.showInstructions && (
                    <input
                      type="text"
                      value={settings.instructionsText}
                      onChange={(e) => setSettings({ ...settings, instructionsText: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    />
                  )}
                </div>

                {/* NeprasPro 4-Role Official Signatures */}
                <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        تذييل التوقيعات الوزاري الرباعي (معيار نبراس برو الرسمي)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        يحظر نظام نبراس خانة بصمة الإبهام ومسمى "خاتم الشعار"، ويعتمد التوقيعات الرباعية وخاتم المدرسة الرسمي.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showSignatures}
                        onChange={(e) => setSettings({ ...settings, showSignatures: e.target.checked })}
                      />
                      إظهار جدول التوقيعات
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-400 font-bold">الموقع 1</label>
                      <input
                        type="text"
                        value={settings.signRole1}
                        onChange={(e) => setSettings({ ...settings, signRole1: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-400 font-bold">الموقع 2</label>
                      <input
                        type="text"
                        value={settings.signRole2}
                        onChange={(e) => setSettings({ ...settings, signRole2: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-400 font-bold">الموقع 3</label>
                      <input
                        type="text"
                        value={settings.signRole3}
                        onChange={(e) => setSettings({ ...settings, signRole3: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-400 font-bold">الموقع 4 (الاعتماد)</label>
                      <input
                        type="text"
                        value={settings.signRole4}
                        onChange={(e) => setSettings({ ...settings, signRole4: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-bold text-slate-400">
                        عبارة الختام والتشجيع
                      </label>
                      <input
                        type="text"
                        value={settings.footerCheer}
                        onChange={(e) => setSettings({ ...settings, footerCheer: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showSchoolStamp}
                          onChange={(e) => setSettings({ ...settings, showSchoolStamp: e.target.checked })}
                        />
                        خانة (خاتم المدرسة الرسمي)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NEPRASPRO A4 HIGH-PRECISION PRINT CANVAS
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`relative mx-auto max-w-[210mm] min-h-[297mm] overflow-hidden bg-white text-black shadow-2xl transition-all print:m-0 print:w-full print:max-w-none print:shadow-none ${
          settings.hasBorderFrame ? 'border-[3px] border-double border-black p-6 md:p-8 print:border-[2.5px] print:border-double print:border-black print:p-6' : 'p-6 md:p-8 print:p-4'
        }`}
        style={{
          fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
        }}
      >
        {/* Full-page Watermark Overlay */}
        {settings.showWatermark && (
          <div
            className="pointer-events-none absolute inset-0 z-0 flex flex-wrap content-start justify-center gap-x-24 gap-y-48 pt-48 opacity-[0.035]"
            aria-hidden="true"
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="rotate-[-35deg] whitespace-nowrap text-6xl font-black text-black"
              >
                {settings.watermarkText || settings.displayName || cleanSchool || 'استباق مصر'}
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10">
          {/* ──────────────────────────────────────────────────────────────────
              1. OFFICIAL 3-COLUMN MINISTERIAL HEADER (NEPRAS STANDARD)
          ────────────────────────────────────────────────────────────────── */}
          <div className="relative mb-3 border-b-2 border-black pb-3">
            <div className="flex items-center justify-between text-black">
              {/* Right Column: Exact Ministerial 3 Lines */}
              <div className="flex-1 text-right leading-snug" dir="rtl">
                {(settings.headerType === 'official' || settings.headerType === 'both') && (
                  <div className="text-[12px] md:text-[13px] font-bold space-y-0.5">
                    <div>
                      محافظة: <strong className="font-black">{cleanGov}</strong>
                    </div>
                    <div>
                      إدارة: <strong className="font-black">{cleanAdmin} التعليمية</strong>
                    </div>
                    <div>
                      مدرسة: <strong className="font-black">{cleanSchool}</strong>
                    </div>
                  </div>
                )}

                {settings.headerType === 'personal' && (
                  <div className="leading-tight">
                    <div className="text-xl font-black text-black">
                      {settings.displayName || 'أستاذ المادة'}
                    </div>
                    <div className="text-xs font-bold text-slate-700">{settings.title}</div>
                    <div className="text-xs font-bold text-slate-600">{settings.phone}</div>
                  </div>
                )}
              </div>

              {/* Center Column: School Logo + Document Title Underlined + Academic Year */}
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="شعار المدرسة"
                    className="mb-1 max-h-14 max-w-[90px] object-contain print:max-h-12"
                  />
                )}
                <h1 className="text-lg md:text-xl font-black text-black underline underline-offset-4 decoration-2">
                  {settings.customTitle || exam.title}
                  {settings.examModel && (
                    <span className="mr-2 inline-block font-black text-black">
                      ({settings.examModel})
                    </span>
                  )}
                </h1>
                <div className="mt-1 text-xs md:text-sm font-black text-black">
                  للعام الدراسي: {settings.academicYear || '2025 / 2026 م'}
                </div>
                <div className="mt-0.5 text-[11px] md:text-xs font-bold text-slate-800">
                  المادة: <strong>{settings.subjectName || exam.subjects?.name_ar}</strong>
                  {settings.gradeName ? ` — ${settings.gradeName}` : (exam.grades?.name_ar ? ` — ${exam.grades.name_ar}` : '')}
                </div>
              </div>

              {/* Left Column: Duration + Total Marks + Print Date */}
              <div className="flex-1 text-left leading-snug" dir="ltr">
                {settings.headerType === 'both' && (
                  <div className="text-right leading-tight" dir="rtl">
                    <div className="text-lg font-black text-black">
                      {settings.displayName || 'أستاذ المادة'}
                    </div>
                    <div className="text-xs font-bold text-slate-700">{settings.title}</div>
                    <div className="text-xs font-bold text-slate-600">{settings.phone}</div>
                  </div>
                )}

                {settings.headerType !== 'both' && (
                  <div className="text-right text-[11.5px] md:text-[12px] font-bold space-y-0.5" dir="rtl">
                    <div>
                      زمن الإجابة: <strong className="font-black">{settings.durationMinutes ? `${settings.durationMinutes} دقيقة` : `${exam.duration_minutes || 40} دقيقة`}</strong>
                    </div>
                    <div>
                      الدرجة الكلية: <strong className="font-black">{settings.totalPoints || exam.total_points || 25} درجة</strong>
                    </div>
                    <div>
                      تاريخ الطباعة: <strong className="font-medium text-slate-700">{new Date().toLocaleDateString('ar-EG')}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-bar if both official and personal are enabled */}
            {settings.headerType === 'both' && (
              <div className="mt-2 flex justify-center gap-8 border-t border-black/30 pt-1.5 text-xs font-bold text-black">
                <span>زمن الإجابة: <strong>{settings.durationMinutes} دقيقة</strong></span>
                <span>الدرجة الكلية: <strong>{settings.totalPoints || exam.total_points} درجة</strong></span>
                <span>تاريخ الطباعة: <strong>{new Date().toLocaleDateString('ar-EG')}</strong></span>
              </div>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              2. OFFICIAL STUDENT BAR (NEPRAS PROTOCOL)
          ────────────────────────────────────────────────────────────────── */}
          {settings.showStudentBar && answerMode === 'none' && (
            <div className="mb-3 flex flex-wrap items-center justify-between border-b-2 border-black bg-slate-50/50 px-4 py-2 text-xs md:text-sm font-bold print:bg-white print:px-2 print:py-1">
              {settings.showStudentName && (
                <div className="flex flex-1 items-center gap-2 min-w-[220px]">
                  <span className="shrink-0 font-black">اسم الطالب:</span>
                  <div className="flex-1 border-b border-dotted border-black/70 h-4" />
                </div>
              )}

              {settings.showSeatNumber && (
                <div className="flex w-36 md:w-44 items-center gap-2 mr-4">
                  <span className="shrink-0 font-black">رقم الجلوس:</span>
                  <div className="flex-1 border-b border-dotted border-black/70 h-4" />
                </div>
              )}

              {settings.showClassSection && (
                <div className="flex w-32 md:w-36 items-center gap-2 mr-4">
                  <span className="shrink-0 font-black">الفصل:</span>
                  <div className="flex-1 border-b border-dotted border-black/70 h-4" />
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              3. EXAM INSTRUCTIONS BANNER
          ────────────────────────────────────────────────────────────────── */}
          {settings.showInstructions && settings.instructionsText && (
            <div className="mb-4 rounded border border-black/40 bg-slate-50/80 px-3 py-1 text-center text-[11px] md:text-xs font-bold text-black print:bg-white print:border-black">
              {settings.instructionsText}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              4. QUESTIONS LIST WITH HIGH-PRECISION MINISTERIAL NUMBERING
          ────────────────────────────────────────────────────────────────── */}
          <div className={densitySpacing}>
            {activeGroups.map((type, groupIdx) => {
              const blocks = groupedByType[type]
              const labelsAR = [
                'السؤال الأول',
                'السؤال الثاني',
                'السؤال الثالث',
                'السؤال الرابع',
                'السؤال الخامس',
                'السؤال السادس',
                'السؤال السابع',
                'السؤال الثامن',
              ]
              const labelsEN = [
                'Question One',
                'Question Two',
                'Question Three',
                'Question Four',
                'Question Five',
                'Question Six',
                'Question Seven',
                'Question Eight',
              ]
              const labels = isRTL ? labelsAR : labelsEN
              const fallback = isRTL
                ? `السؤال ${groupIdx + 1}`
                : `Question ${groupIdx + 1}`
              const groupTitle = `${labels[groupIdx] || fallback}: ${questionTypeTitles[type]}`
              let qCounter = 0

              return (
                <div key={type} className="break-inside-avoid">
                  {showSectionHeaders && (
                    <div className="mb-3 flex items-center justify-between border-b-[1.5px] border-black pb-1">
                      <h2
                        className={`text-sm md:text-base font-black text-black ${textAlign}`}
                        dir={dir}
                      >
                        {groupTitle}
                      </h2>
                    </div>
                  )}

                  <div className={questionGap}>
                    {blocks.map((block, blockIdx) => (
                      <div key={blockIdx} className="space-y-3">
                        {/* Context Passage if present */}
                        {block.passage && (
                          <div
                            className="mb-3 break-inside-avoid rounded border border-black/40 bg-slate-50 p-4 print:bg-white"
                            dir={dir}
                          >
                            <p className="mb-2 border-b border-black/20 pb-1 text-xs font-black text-black">
                              {isRTL
                                ? 'اقرأ النص أو المسألة التالية بعناية ثم أجب عن الأسئلة:'
                                : 'Read the following passage carefully then answer the questions:'}
                            </p>
                            <MathRenderer text={block.passage} dir={dir} />
                          </div>
                        )}

                        {/* Questions Rendering */}
                        {block.questions.map((q: any) => {
                          qCounter++
                          const num = qCounter
                          const isHidden = hiddenQuestions.has(q.id)
                          return (
                            <div
                              key={q.id}
                              className={`break-inside-avoid ${block.passage ? 'border-r-2 border-black/30 pr-3' : ''}`}
                            >
                              <div className="flex items-start gap-2" dir={dir}>
                                <span className="shrink-0 font-black text-base text-black">
                                  ({num})
                                </span>
                                <div className={`flex-1 ${textAlign}`}>
                                  <div
                                    className={`flex ${
                                      q.image_position === 'top'
                                        ? 'flex-col-reverse'
                                        : q.image_position === 'right'
                                          ? 'flex-row-reverse items-start gap-4'
                                          : q.image_position === 'left'
                                            ? 'flex-row items-start gap-4'
                                            : 'flex-col'
                                    }`}
                                  >
                                    <div className="flex-1 font-bold leading-relaxed text-black">
                                      <MathRenderer
                                        text={q.question_text
                                          .replace(/^(\(?\d+[[\)\.\-\s]\s*)/, '')
                                          .trim()}
                                        dir={dir}
                                      />
                                    </div>
                                    {q.question_image_url && (
                                      <div
                                        className={`shrink-0 text-center ${
                                          q.image_position === 'right' || q.image_position === 'left'
                                            ? 'w-1/3'
                                            : 'mt-2 w-full'
                                        }`}
                                      >
                                        <img
                                          src={q.question_image_url}
                                          alt="صورة السؤال"
                                          className="inline-block max-h-40 rounded border border-black/30 object-contain p-1"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 rounded border border-black/30 px-2 py-0.5 text-xs font-bold text-black print:border-black/50">
                                  ({q.points_override ?? q.points} درجات)
                                </div>

                                {/* Eye toggle (screen only) */}
                                <button
                                  onClick={() => toggleQuestionVisibility(q.id)}
                                  title={isHidden ? 'إظهار السؤال' : 'إخفاء السؤال من الطباعة'}
                                  className="no-print shrink-0 text-slate-400 hover:text-red-600 p-1"
                                >
                                  {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                              </div>

                              {/* MCQ Options (Egyptian Ministerial Letters أ - ب - ج - د) */}
                              {q.question_type === 'mcq' &&
                                q.options &&
                                (() => {
                                  const maxLen = Math.max(...q.options.map((o: string) => o.length))
                                  const cols =
                                    maxLen > 35
                                      ? 'grid-cols-1'
                                      : maxLen > 15
                                        ? 'grid-cols-2'
                                        : 'grid-cols-4'
                                  const optionLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']
                                  return (
                                    <div
                                      className={`mt-2 grid ${cols} gap-x-6 gap-y-2 ${isRTL ? 'pr-6' : 'pl-6'}`}
                                    >
                                      {q.options.map((opt: string, oIdx: number) => {
                                        const correct = answerMode !== 'none' && opt === q.correct_answer
                                        return (
                                          <div
                                            key={oIdx}
                                            className={`flex items-start gap-2 text-sm font-bold ${
                                              correct ? 'text-emerald-700 font-black' : 'text-black'
                                            }`}
                                          >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black text-xs font-black text-black">
                                              {optionLetters[oIdx] || oIdx + 1}
                                            </span>
                                            <div className="flex-1">
                                              <MathRenderer text={opt} dir={dir} />
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}

                              {/* Answer Lines for Essay/Solve in Paper */}
                              {answerMode === 'none' && q.question_type !== 'mcq' && (
                                <div className={`my-3 space-y-4 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                                  {Array.from({ length: q.question_type === 'essay' ? essayLinesCount * 2 : essayLinesCount }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-full border-b border-dotted border-black/60 h-4"
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Model Answer (if teacher or solution mode is active) */}
                              {answerMode !== 'none' && (
                                <div className={`mt-2 space-y-1.5 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                                  {q.question_type !== 'mcq' && (
                                    <div className="rounded border border-emerald-600 bg-emerald-50/70 p-2 text-xs font-bold text-emerald-900">
                                      <span>الإجابة النموذجية: </span>
                                      <MathRenderer text={q.correct_answer} dir={dir} />
                                    </div>
                                  )}
                                  {answerMode === 'full' && q.explanation && (
                                    <div className="rounded border border-blue-400 bg-blue-50/70 p-2 text-xs font-bold text-blue-900">
                                      <span>خطوات الحل والتفسير: </span>
                                      <MathRenderer text={q.explanation} dir={dir} />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              5. OFFICIAL CHEER & CLOSING BANNER
          ────────────────────────────────────────────────────────────────── */}
          {settings.showFooterCheer && settings.footerCheer && (
            <div className="my-6 text-center text-xs md:text-sm font-black text-black break-inside-avoid">
              <span className="inline-block border-y-2 border-black px-8 py-1">
                {settings.footerCheer}
              </span>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              6. OFFICIAL NEPRASPRO 4-ROLE SIGNATURES & STAMP FOOTER
          ────────────────────────────────────────────────────────────────── */}
          {settings.showSignatures && (
            <div className="mt-6 break-inside-avoid border-t-2 border-black pt-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-black text-black">
                {/* Signature 1 */}
                <div>
                  <div>{settings.signRole1}</div>
                  <div className="text-[10px] text-slate-600 font-bold">{settings.signRole1Sub}</div>
                  <div className="mt-8 border-b border-dotted border-black/80 mx-2" />
                </div>

                {/* Signature 2 */}
                <div>
                  <div>{settings.signRole2}</div>
                  <div className="text-[10px] text-slate-600 font-bold">{settings.signRole2Sub}</div>
                  <div className="mt-8 border-b border-dotted border-black/80 mx-2" />
                </div>

                {/* Signature 3 */}
                <div>
                  <div>{settings.signRole3}</div>
                  <div className="text-[10px] text-slate-600 font-bold">{settings.signRole3Sub}</div>
                  <div className="mt-8 border-b border-dotted border-black/80 mx-2" />
                </div>

                {/* Signature 4: School Director & Official Stamp */}
                <div className="flex flex-col items-center">
                  <div>{settings.signRole4}</div>
                  <div className="text-[10px] text-slate-600 font-bold">{settings.signRole4Sub}</div>
                  {settings.showSchoolStamp ? (
                    <div className="mt-2 flex h-14 w-28 items-center justify-center rounded border-2 border-dashed border-black/70 text-[10.5px] font-black text-black/80">
                      (خاتم المدرسة الرسمي)
                    </div>
                  ) : (
                    <div className="mt-8 border-b border-dotted border-black/80 w-24" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
