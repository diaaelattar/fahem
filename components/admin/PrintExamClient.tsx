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
  CheckSquare,
  X,
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
  // Mode: official vs personal vs both
  headerType: 'official' | 'personal' | 'both'

  // Header Texts
  directorate: string      // المحافظة
  administration: string   // الإدارة
  schoolName: string       // المدرسة
  academicYear: string     // العام الدراسي

  // Granular Toggles for EVERY single line/piece of the header (إظهار/إخفاء أي جزء)
  showGov: boolean         // محافظة: ...
  showAdmin: boolean       // إدارة: ...
  showSchool: boolean      // مدرسة: ...

  showLogo: boolean        // شعار المدرسة
  showTitle: boolean       // عنوان الاختبار
  showYear: boolean        // العام الدراسي
  showMeta: boolean        // المادة والصف والفصل

  showDuration: boolean    // زمن الإجابة
  showPoints: boolean      // الدرجة الكلية
  showPrintDate: boolean   // تاريخ الطباعة

  // Personal Teacher / Center
  displayName: string
  title: string
  phone: string
  social: string

  // Exam Meta
  customTitle: string
  examModel: string        // رمز النموذج (أ / ب / ج / د)
  termName: string
  durationMinutes: string
  totalPoints: string
  subjectName: string
  gradeName: string

  // Styling & Options
  logoUrl: string
  hasBorderFrame: boolean  // إطار مزدوج للورقة
  density: 'compact' | 'normal' | 'spacious'

  // Student Bar
  showStudentBar: boolean
  showStudentName: boolean
  showSeatNumber: boolean
  showClassSection: boolean
  classSection: string

  // Instructions Bar
  showInstructions: boolean
  instructionsText: string

  // Simple Closing Note
  showCheerNote: boolean
  cheerNoteText: string

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

  // Customization drawer open state
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Settings state
  const [settings, setSettings] = useState<PrintCustomSettings>({
    headerType: 'official',
    directorate: 'الجيزة',
    administration: 'الدقي',
    schoolName: 'الأورمان الثانوية بنين',
    academicYear: '2025 / 2026 م',

    // Granular visibility toggles (all true by default, user can turn any off)
    showGov: true,
    showAdmin: true,
    showSchool: true,

    showLogo: true,
    showTitle: true,
    showYear: true,
    showMeta: true,

    showDuration: true,
    showPoints: true,
    showPrintDate: true,

    displayName: '',
    title: 'معلم أول',
    phone: '',
    social: '',

    customTitle: exam?.title || '',
    examModel: '',
    termName: 'الفصل الدراسي الأول',
    durationMinutes: exam?.duration_minutes ? String(exam.duration_minutes) : '40',
    totalPoints: exam?.total_points ? String(exam.total_points) : '25',
    subjectName: exam?.subjects?.name_ar || '',
    gradeName: exam?.grades?.name_ar || '',

    logoUrl: '',
    hasBorderFrame: true,
    density: 'normal',

    showStudentBar: true,
    showStudentName: true,
    showSeatNumber: true,
    showClassSection: true,
    classSection: '',

    showInstructions: true,
    instructionsText: 'تنبيه: أجب عن جميع الأسئلة الآتية في نفس الورقة',

    showCheerNote: true,
    cheerNoteText: 'مع أطيب التمنيات بالنجاح والتفوق',

    showWatermark: false,
    watermarkText: '',
  })

  // Load defaults from localStorage
  useEffect(() => {
    const savedDefaults = localStorage.getItem('istabaq_custom_print_defaults')
    let baseSettings: Partial<PrintCustomSettings> = {}
    if (savedDefaults) {
      try {
        baseSettings = JSON.parse(savedDefaults)
      } catch {}
    }

    const examSpecific = localStorage.getItem(`istabaq_print_exam_${exam?.id}`)
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
        `istabaq_print_exam_${exam.id}`,
        JSON.stringify(settings)
      )
    } catch {}
  }, [settings, exam?.id])

  // Save current settings as GLOBAL DEFAULTS
  const handleSaveAsDefaults = () => {
    try {
      localStorage.setItem(
        'istabaq_custom_print_defaults',
        JSON.stringify(settings)
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
        setSettings((prev) => ({ ...prev, logoUrl: reader.result as string, showLogo: true }))
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

  // Ministerial cleaning
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
    mcq: 'اختر الإجابة الصحيحة',
    true_false: 'ضع علامة (✓) أو علامة (✗)',
    fill_blank: 'أكمل ما يأتي',
    correction: 'صوّب ما تحته خط',
    essay: 'أجب عن الأسئلة الآتية',
  }

  const questionTypeTitlesEN: Record<string, string> = {
    mcq: 'Choose the Correct Answer',
    true_false: 'Put True (✓) or False (✗)',
    fill_blank: 'Fill in the Blanks',
    correction: 'Correct the Underlined Words',
    essay: 'Answer the Following Questions',
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
    normal: 'space-y-6 text-[15px]',
    spacious: 'space-y-9 text-[16px]',
  }[settings.density]

  const questionGap = {
    compact: 'space-y-2',
    normal: 'space-y-3.5',
    spacious: 'space-y-5',
  }[settings.density]

  const essayLinesCount = {
    compact: 2,
    normal: 4,
    spacious: 6,
  }[settings.density]

  return (
    <div
      className="min-h-screen bg-slate-100 p-2 sm:p-6 md:p-8 print:bg-white print:p-0 font-sans"
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

      {/* ─── Control Bar (hidden when printing) ─── */}
      <div
        className="no-print mx-auto mb-6 max-w-5xl rounded-2xl bg-white border border-slate-200 p-4 shadow-sm"
        dir="rtl"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-2 text-base font-black text-slate-800">
              <Printer className="h-5 w-5 text-primary" />
              معاينة وطباعة ورقة الاختبار
            </h2>
            <button
              onClick={() => setIsCustomizeOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isCustomizeOpen
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
              }`}
            >
              <Sliders className="h-4 w-4" />
              تخصيص وإظهار/إخفاء أي جزء من الترويسة
              {isCustomizeOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              طباعة فورية (PDF)
            </button>
          </div>
        </div>

        {/* Quick controls row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
          {/* Answer Mode */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">نوع النسخة:</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {(['none', 'short', 'full'] as AnswerMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAnswerMode(mode)}
                  className={`rounded-md px-3 py-1 font-bold transition-all ${
                    answerMode === mode
                      ? mode === 'none'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : mode === 'short'
                          ? 'bg-indigo-100 text-indigo-800 shadow-sm'
                          : 'bg-emerald-100 text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode === 'none'
                    ? 'ورقة الطالب'
                    : mode === 'short'
                      ? 'الحل السريع'
                      : 'نموذج الإجابة الكامل'}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">كثافة الورقة:</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {[
                { id: 'compact', label: 'مضغوط (توفير ورق)' },
                { id: 'normal', label: 'قياسي' },
                { id: 'spacious', label: 'متسع للحل' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSettings({ ...settings, density: d.id as any })}
                  className={`rounded-md px-2.5 py-1 font-bold transition-all ${
                    settings.density === d.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Switcher */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">النموذج:</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {['', 'أ', 'ب', 'ج', 'د'].map((m) => (
                <button
                  key={m}
                  onClick={() => setSettings({ ...settings, examModel: m ? `نموذج (${m})` : '' })}
                  className={`rounded-md px-2.5 py-1 font-bold transition-all ${
                    (m === '' && !settings.examModel) || settings.examModel.includes(`(${m})`)
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {m ? `نموذج ${m}` : 'بدون'}
                </button>
              ))}
            </div>
          </div>

          {/* Border Frame */}
          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
            <input
              type="checkbox"
              checked={settings.hasBorderFrame}
              onChange={(e) => setSettings({ ...settings, hasBorderFrame: e.target.checked })}
              className="rounded"
            />
            إطار مطبعي مزدوج
          </label>
        </div>

        {/* ─── Expandable Customization Panel ─── */}
        {isCustomizeOpen && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            {/* Header of customization box */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  🔘 تحكم دقيق في عناصر الترويسة الثلاثية (إظهار / إخفاء أي سطر)
                </h3>
                <p className="text-xs text-slate-500">
                  يمكنك تفعيل أو إلغاء أي جزء تريده بنقرة واحدة، وتعديل النصوص مباشرة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsDefaults}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-900"
                >
                  <Save className="h-3.5 w-3.5 text-emerald-400" />
                  {savedSuccess ? '✓ تم الحفظ كافتراضي!' : 'حفظ كإعدادات افتراضية'}
                </button>
              </div>
            </div>

            {/* 3-Column Interactive Toggles & Inputs */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Column 1: Right (اليمين) */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>اليمين (بيانات المحافظة والإدارة)</span>
                </h4>

                {/* Gov */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showGov}
                      onChange={(e) => setSettings({ ...settings, showGov: e.target.checked })}
                      className="rounded"
                    />
                    إظهار المحافظة
                  </label>
                  {settings.showGov && (
                    <input
                      type="text"
                      value={settings.directorate}
                      onChange={(e) => setSettings({ ...settings, directorate: e.target.value })}
                      placeholder="الجيزة"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

                {/* Admin */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showAdmin}
                      onChange={(e) => setSettings({ ...settings, showAdmin: e.target.checked })}
                      className="rounded"
                    />
                    إظهار الإدارة التعليمية
                  </label>
                  {settings.showAdmin && (
                    <input
                      type="text"
                      value={settings.administration}
                      onChange={(e) => setSettings({ ...settings, administration: e.target.value })}
                      placeholder="الدقي"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

                {/* School */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showSchool}
                      onChange={(e) => setSettings({ ...settings, showSchool: e.target.checked })}
                      className="rounded"
                    />
                    إظهار اسم المدرسة
                  </label>
                  {settings.showSchool && (
                    <input
                      type="text"
                      value={settings.schoolName}
                      onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                      placeholder="الأورمان الثانوية بنين"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>
              </div>

              {/* Column 2: Center (الوسط) */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>الوسط (العنوان والشعار والعام)</span>
                </h4>

                {/* Logo toggle & upload */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showLogo}
                        onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                        className="rounded"
                      />
                      إظهار الشعار
                    </label>
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
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      {settings.logoUrl ? 'تغيير الشعار' : 'رفع شعار'}
                    </button>
                  </div>
                </div>

                {/* Exam Title */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showTitle}
                      onChange={(e) => setSettings({ ...settings, showTitle: e.target.checked })}
                      className="rounded"
                    />
                    إظهار عنوان الاختبار
                  </label>
                  {settings.showTitle && (
                    <input
                      type="text"
                      value={settings.customTitle}
                      onChange={(e) => setSettings({ ...settings, customTitle: e.target.value })}
                      placeholder="عنوان الاختبار"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

                {/* Academic Year */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showYear}
                      onChange={(e) => setSettings({ ...settings, showYear: e.target.checked })}
                      className="rounded"
                    />
                    إظهار العام الدراسي
                  </label>
                  {settings.showYear && (
                    <input
                      type="text"
                      value={settings.academicYear}
                      onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                      placeholder="2025 / 2026 م"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

                {/* Meta Subject / Grade */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showMeta}
                      onChange={(e) => setSettings({ ...settings, showMeta: e.target.checked })}
                      className="rounded"
                    />
                    إظهار سطر (المادة والصف)
                  </label>
                </div>
              </div>

              {/* Column 3: Left (اليسار) */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>اليسار (الزمن والدرجة والتاريخ)</span>
                </h4>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showDuration}
                      onChange={(e) => setSettings({ ...settings, showDuration: e.target.checked })}
                      className="rounded"
                    />
                    إظهار زمن الإجابة
                  </label>
                  {settings.showDuration && (
                    <input
                      type="text"
                      value={settings.durationMinutes}
                      onChange={(e) => setSettings({ ...settings, durationMinutes: e.target.value })}
                      placeholder="40"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

                {/* Points */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showPoints}
                      onChange={(e) => setSettings({ ...settings, showPoints: e.target.checked })}
                      className="rounded"
                    />
                    إظهار الدرجة الكلية
                  </label>
                  {settings.showPoints && (
                    <input
                      type="text"
                      value={settings.totalPoints}
                      onChange={(e) => setSettings({ ...settings, totalPoints: e.target.value })}
                      placeholder="25"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

                {/* Print Date */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showPrintDate}
                      onChange={(e) => setSettings({ ...settings, showPrintDate: e.target.checked })}
                      className="rounded"
                    />
                    إظهار تاريخ الطباعة
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Toggles Row (Student Bar & Instructions & Cheer) */}
            <div className="mt-4 grid gap-4 md:grid-cols-3 border-t border-slate-200 pt-4 text-xs font-bold text-slate-700">
              {/* Student Bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showStudentBar}
                    onChange={(e) => setSettings({ ...settings, showStudentBar: e.target.checked })}
                  />
                  شريط بيانات الطالب
                </label>
                {settings.showStudentBar && (
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showStudentName}
                        onChange={(e) => setSettings({ ...settings, showStudentName: e.target.checked })}
                      />
                      اسم الطالب
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showSeatNumber}
                        onChange={(e) => setSettings({ ...settings, showSeatNumber: e.target.checked })}
                      />
                      رقم الجلوس
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showClassSection}
                        onChange={(e) => setSettings({ ...settings, showClassSection: e.target.checked })}
                      />
                      الفصل
                    </label>
                  </div>
                )}
              </div>

              {/* Instructions Bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showInstructions}
                    onChange={(e) => setSettings({ ...settings, showInstructions: e.target.checked })}
                  />
                  سطر تنبيهات ورقة الأسئلة
                </label>
                {settings.showInstructions && (
                  <input
                    type="text"
                    value={settings.instructionsText}
                    onChange={(e) => setSettings({ ...settings, instructionsText: e.target.value })}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
                  />
                )}
              </div>

              {/* Cheer Closing Note */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showCheerNote}
                    onChange={(e) => setSettings({ ...settings, showCheerNote: e.target.checked })}
                  />
                  عبارة ختام الورقة (التمنيات بالتوفيق)
                </label>
                {settings.showCheerNote && (
                  <input
                    type="text"
                    value={settings.cheerNoteText}
                    onChange={(e) => setSettings({ ...settings, cheerNoteText: e.target.value })}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── A4 Print Canvas ─── */}
      <div
        className={`relative mx-auto max-w-[210mm] min-h-[297mm] overflow-hidden bg-white text-black shadow-xl transition-all print:m-0 print:w-full print:max-w-none print:shadow-none ${
          settings.hasBorderFrame
            ? 'border-2 border-black p-6 md:p-8 print:border-2 print:border-black print:p-6'
            : 'p-6 md:p-8 print:p-4'
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
                {settings.watermarkText || cleanSchool || 'استباق مصر'}
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10">
          {/* ──────────────────────────────────────────────────────────────────
              1. OFFICIAL 3-COLUMN MINISTERIAL HEADER WITH GRANULAR TOGGLES
          ────────────────────────────────────────────────────────────────── */}
          {(settings.showGov || settings.showAdmin || settings.showSchool || settings.showLogo || settings.showTitle || settings.showYear || settings.showMeta || settings.showDuration || settings.showPoints || settings.showPrintDate) && (
            <div className="relative mb-3 border-b-2 border-black pb-3">
              <div className="flex items-center justify-between text-black">
                {/* Right Column (3 lines with toggles) */}
                <div className="flex-1 text-right leading-snug" dir="rtl">
                  <div className="text-[12px] md:text-[13px] font-bold space-y-0.5">
                    {settings.showGov && (
                      <div>
                        محافظة: <strong className="font-black">{cleanGov}</strong>
                      </div>
                    )}
                    {settings.showAdmin && (
                      <div>
                        إدارة: <strong className="font-black">{cleanAdmin} التعليمية</strong>
                      </div>
                    )}
                    {settings.showSchool && (
                      <div>
                        مدرسة: <strong className="font-black">{cleanSchool}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Column (Logo, Title, Year, Meta) */}
                <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                  {settings.showLogo && settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt="شعار المدرسة"
                      className="mb-1 max-h-14 max-w-[90px] object-contain print:max-h-12"
                    />
                  )}
                  {settings.showTitle && (
                    <h1 className="text-lg md:text-xl font-black text-black underline underline-offset-4 decoration-2">
                      {settings.customTitle || exam.title}
                      {settings.examModel && (
                        <span className="mr-2 inline-block font-black text-black">
                          ({settings.examModel})
                        </span>
                      )}
                    </h1>
                  )}
                  {settings.showYear && (
                    <div className="mt-1 text-xs md:text-sm font-black text-black">
                      للعام الدراسي: {settings.academicYear || '2025 / 2026 م'}
                    </div>
                  )}
                  {settings.showMeta && (
                    <div className="mt-0.5 text-[11px] md:text-xs font-bold text-slate-800">
                      المادة: <strong>{settings.subjectName || exam.subjects?.name_ar}</strong>
                      {settings.gradeName ? ` — ${settings.gradeName}` : (exam.grades?.name_ar ? ` — ${exam.grades.name_ar}` : '')}
                    </div>
                  )}
                </div>

                {/* Left Column (Duration, Points, Print Date) */}
                <div className="flex-1 text-right leading-snug" dir="rtl">
                  <div className="text-[11.5px] md:text-[12px] font-bold space-y-0.5">
                    {settings.showDuration && (
                      <div>
                        زمن الإجابة: <strong className="font-black">{settings.durationMinutes ? `${settings.durationMinutes} دقيقة` : `${exam.duration_minutes || 40} دقيقة`}</strong>
                      </div>
                    )}
                    {settings.showPoints && (
                      <div>
                        الدرجة الكلية: <strong className="font-black">{settings.totalPoints || exam.total_points || 25} درجة</strong>
                      </div>
                    )}
                    {settings.showPrintDate && (
                      <div>
                        تاريخ الطباعة: <strong className="font-medium text-slate-700">{new Date().toLocaleDateString('ar-EG')}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              2. STUDENT BAR
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
              3. INSTRUCTIONS
          ────────────────────────────────────────────────────────────────── */}
          {settings.showInstructions && settings.instructionsText && (
            <div className="mb-4 rounded border border-black/40 bg-slate-50/80 px-3 py-1 text-center text-[11px] md:text-xs font-bold text-black print:bg-white print:border-black">
              {settings.instructionsText}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              4. QUESTIONS LIST
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

                              {/* MCQ Options */}
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
              5. SIMPLE CLEAN CHEER NOTE (OPTIONAL)
          ────────────────────────────────────────────────────────────────── */}
          {settings.showCheerNote && settings.cheerNoteText && (
            <div className="my-8 text-center text-xs md:text-sm font-black text-black break-inside-avoid">
              <span className="inline-block border-y border-black/70 px-8 py-1">
                ═════ {settings.cheerNoteText} ═════
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
