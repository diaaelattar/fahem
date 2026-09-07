'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Printer,
  Sliders,
  Upload,
  ChevronDown,
  ChevronUp,
  Save,
  FileDown,
  Type,
  Minus,
  Plus,
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

export type FontFamilyChoice = 'cairo' | 'amiri' | 'tajawal' | 'almarai' | 'traditional'

export interface PrintCustomSettings {
  headerType: 'official' | 'personal' | 'both'

  directorate: string      // المحافظة
  administration: string   // الإدارة
  schoolName: string       // المدرسة
  academicYear: string     // العام الدراسي

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

  displayName: string
  title: string
  phone: string
  social: string

  customTitle: string
  examModel: string
  termName: string
  durationMinutes: string
  totalPoints: string
  subjectName: string
  gradeName: string

  logoUrl: string
  hasBorderFrame: boolean
  density: 'compact' | 'normal' | 'spacious'

  // Font & Typography Settings
  fontFamily: FontFamilyChoice
  fontSize: number         // Default 14px (11 - 22)
  lineHeight: 'tight' | 'normal' | 'spacious'

  showStudentBar: boolean
  showStudentName: boolean
  showSeatNumber: boolean
  showClassSection: boolean
  classSection: string

  showInstructions: boolean
  instructionsText: string

  showCheerNote: boolean
  cheerNoteText: string

  showWatermark: boolean
  watermarkText: string
}

const fontDefinitions: Record<FontFamilyChoice, { name: string; css: string; sample: string }> = {
  cairo: {
    name: 'خط القاهرة (Cairo)',
    css: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
    sample: 'خط عصري مقروء وواضح'
  },
  amiri: {
    name: 'خط النسخ (Amiri)',
    css: "'Amiri', 'Traditional Arabic', serif",
    sample: 'خط كلاسيكي رسمي ممتاز للغة العربية'
  },
  tajawal: {
    name: 'خط تجوال (Tajawal)',
    css: "'Tajawal', 'Segoe UI', Tahoma, sans-serif",
    sample: 'خط هندسي أنيق ومتناسق'
  },
  almarai: {
    name: 'خط المراعي (Almarai)',
    css: "'Almarai', 'Segoe UI', Tahoma, sans-serif",
    sample: 'خط ناعم وانسيابي حديث'
  },
  traditional: {
    name: 'خط تقليدي (Traditional)',
    css: "'Traditional Arabic', Arial, Tahoma, sans-serif",
    sample: 'الخط الورقي المكتبي التقليدي'
  },
}

const lineHeightValues = {
  tight: 1.35,
  normal: 1.55,
  spacious: 1.85,
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

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<PrintCustomSettings>({
    headerType: 'official',
    directorate: 'الجيزة',
    administration: 'الدقي',
    schoolName: 'الأورمان الثانوية بنين',
    academicYear: '2025 / 2026 م',

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
    hasBorderFrame: false,
    density: 'normal',

    // Fonts default
    fontFamily: 'cairo',
    fontSize: 14,
    lineHeight: 'normal',

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

  // Load defaults safely
  useEffect(() => {
    let baseSettings: Partial<PrintCustomSettings> = {}
    try {
      const savedDefaults = localStorage.getItem('istabaq_custom_print_defaults')
      if (savedDefaults) baseSettings = JSON.parse(savedDefaults)
    } catch {}

    let examSettings: Partial<PrintCustomSettings> = {}
    try {
      const examSpecific = localStorage.getItem(`istabaq_print_exam_${exam?.id}`)
      if (examSpecific) examSettings = JSON.parse(examSpecific)
    } catch {}

    setSettings((prev) => {
      const merged = { ...prev, ...baseSettings, ...examSettings }
      return {
        ...merged,
        // Guarantee all visibility toggles default to TRUE unless explicitly FALSE
        showGov: merged.showGov !== false,
        showAdmin: merged.showAdmin !== false,
        showSchool: merged.showSchool !== false,
        showLogo: merged.showLogo !== false,
        showTitle: merged.showTitle !== false,
        showYear: merged.showYear !== false,
        showMeta: merged.showMeta !== false,
        showDuration: merged.showDuration !== false,
        showPoints: merged.showPoints !== false,
        showPrintDate: merged.showPrintDate !== false,
        showStudentBar: merged.showStudentBar !== false,
        showStudentName: merged.showStudentName !== false,
        showSeatNumber: merged.showSeatNumber !== false,
        showClassSection: merged.showClassSection !== false,
        showInstructions: merged.showInstructions !== false,
        showCheerNote: merged.showCheerNote !== false,
        hasBorderFrame: merged.hasBorderFrame === true,

        fontFamily: merged.fontFamily || 'cairo',
        fontSize: Number(merged.fontSize) || 14,
        lineHeight: merged.lineHeight || 'normal',

        directorate: merged.directorate || 'الجيزة',
        administration: merged.administration || 'الدقي',
        schoolName: merged.schoolName || 'الأورمان الثانوية بنين',
        academicYear: merged.academicYear || '2025 / 2026 م',
        customTitle: examSettings.customTitle || prev.customTitle || exam?.title || '',
        subjectName: examSettings.subjectName || prev.subjectName || exam?.subjects?.name_ar || '',
        durationMinutes: examSettings.durationMinutes || (exam?.duration_minutes ? String(exam.duration_minutes) : prev.durationMinutes),
        totalPoints: examSettings.totalPoints || (exam?.total_points ? String(exam.total_points) : prev.totalPoints),
      }
    })

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

  useEffect(() => {
    if (!exam?.id) return
    try {
      localStorage.setItem(
        `istabaq_print_exam_${exam.id}`,
        JSON.stringify(settings)
      )
    } catch {}
  }, [settings, exam?.id])

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

  // Native High-Precision Vector Print / Save-as-PDF (Instant, Zero Freeze)
  const handlePrint = () => {
    const originalDocTitle = document.title
    const safeTitle = (settings.customTitle || exam?.title || 'ورقة_اختبار')
      .trim()
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')

    try {
      document.title = safeTitle
    } catch {}

    window.print()

    setTimeout(() => {
      try {
        document.title = originalDocTitle
      } catch {}
    }, 1200)
  }

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

  const cleanGov = (settings.directorate || '').replace(/^محافظة\s*/, '').trim() || 'الجيزة'
  const cleanAdmin = (settings.administration || '')
    .replace(/^إدارة\s*/, '')
    .replace(/التعليمية\s*$/, '')
    .trim() || 'الدقي'
  const cleanSchool = (settings.schoolName || '').replace(/^مدرسة\s*/, '').trim() || 'الأورمان'

  const subjectName = settings.subjectName || exam?.subjects?.name_ar || ''
  const dir = getSubjectDirection(subjectName)
  const isRTL = dir === 'rtl'
  const textAlign = getSubjectTextAlignClass(subjectName)

  const activeFont = fontDefinitions[settings.fontFamily] || fontDefinitions.cairo
  const activeLineHeight = lineHeightValues[settings.lineHeight] || 1.55
  const baseFontSize = settings.fontSize || 14

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

  const densitySpacing =
    settings.density === 'compact'
      ? 'space-y-2'
      : settings.density === 'spacious'
        ? 'space-y-6'
        : 'space-y-4'

  const questionGap =
    settings.density === 'compact'
      ? 'space-y-1.5'
      : settings.density === 'spacious'
        ? 'space-y-4'
        : 'space-y-2.5'

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 md:p-8 font-sans print:p-0 print:m-0 print:bg-white print:min-h-0">
      {/* ─── Google Fonts Preloader ─── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* ─── Standard Clean Ministerial Print Stylesheet ─── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm 8mm 10mm !important;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .no-print, [class*="no-print"], aside, nav, header, button {
            display: none !important;
            visibility: hidden !important;
          }
          #nepras-print-sheet {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: #fff !important;
            display: block !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `,
        }}
      />

      {/* ─── Topbar with Controls ─── */}
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
              تخصيص الترويسة والخطوط
              {isCustomizeOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Primary Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 hover:brightness-110 active:scale-95 transition-all"
              title="طباعة فورية أو حفظ بصيغة PDF عالية الدقة"
            >
              <Printer className="h-4 w-4" />
              طباعة الاختبار (أو حفظ PDF)
            </button>
          </div>
        </div>

        {/* ── Quick Controls Bar: Font Family, Font Size & Density ── */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
          {/* Font Family Selector */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <Type className="h-3.5 w-3.5 text-indigo-600" />
              الخط:
            </span>
            <select
              value={settings.fontFamily}
              onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value as FontFamilyChoice })}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="cairo">خط القاهرة (Cairo) — الافتراضي</option>
              <option value="amiri">خط النسخ (Amiri) — كلاسيكي ورسمي</option>
              <option value="tajawal">خط تجوال (Tajawal) — هندسي أنيق</option>
              <option value="almarai">خط المراعي (Almarai) — حديث وناعم</option>
              <option value="traditional">خط تقليدي (Traditional Arial)</option>
            </select>
          </div>

          {/* Font Size Stepper & Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">حجم الخط:</span>
            <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, fontSize: Math.max(11, (p.fontSize || 14) - 1) }))}
                className="px-2 py-1 hover:bg-slate-100 text-slate-600 transition-colors border-l border-slate-200"
                title="تصغير الخط"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-2.5 py-1 text-xs font-black text-indigo-700 min-w-[42px] text-center">
                {baseFontSize}px
              </span>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, fontSize: Math.min(22, (p.fontSize || 14) + 1) }))}
                className="px-2 py-1 hover:bg-slate-100 text-slate-600 transition-colors border-r border-slate-200"
                title="تكبير الخط"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Quick Size Presets */}
            <div className="hidden sm:flex rounded-lg bg-slate-100 p-0.5 text-[11px]">
              {[
                { size: 12, label: 'صغير' },
                { size: 14, label: 'متوسط' },
                { size: 16, label: 'كبير' },
                { size: 18, label: 'عريض' },
              ].map((p) => (
                <button
                  key={p.size}
                  type="button"
                  onClick={() => setSettings({ ...settings, fontSize: p.size })}
                  className={`rounded px-2 py-0.5 font-bold transition-all ${
                    baseFontSize === p.size
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Density Control */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">الكثافة:</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {[
                { id: 'compact', label: 'مضغوط' },
                { id: 'normal', label: 'عادي' },
                { id: 'spacious', label: 'متباعد' },
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

          {/* Exam Model */}
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
        </div>

        {/* ─── Expandable Customization Panel ─── */}
        {isCustomizeOpen && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  🔘 تحكم تفصيلي في الخطوط وعناصر الترويسة
                </h3>
                <p className="text-xs text-slate-500">
                  يمكنك تفعيل أو إلغاء أي سطر في الترويسة بمربعات الاختيار، وتغيير الخط وحجمه وتباعد الأسطر فورياً.
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

            {/* Font & Line Height Settings Banner */}
            <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
              <h4 className="mb-3 text-xs font-black text-indigo-900 flex items-center gap-2">
                <Type className="h-4 w-4 text-indigo-600" />
                تخصيص نمط الخط وتباعد الأسطر للورقة كاملة
              </h4>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Font Selector */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-indigo-950">نوع الخط العربي:</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value as FontFamilyChoice })}
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                  >
                    <option value="cairo">خط القاهرة (Cairo) — خط مطبعي واضح</option>
                    <option value="amiri">خط النسخ (Amiri) — خط عربي كلاسيكي</option>
                    <option value="tajawal">خط تجوال (Tajawal) — خط هندسي متزن</option>
                    <option value="almarai">خط المراعي (Almarai) — خط حديث ناعم</option>
                    <option value="traditional">خط تقليدي (Traditional Arial)</option>
                  </select>
                  <span className="mt-1 block text-[10px] text-indigo-700 font-medium">
                    {activeFont.sample}
                  </span>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-indigo-950">حجم الخط العام:</label>
                    <span className="text-xs font-black text-indigo-600">{baseFontSize} بكسل</span>
                  </div>
                  <input
                    type="range"
                    min="11"
                    max="22"
                    step="0.5"
                    value={baseFontSize}
                    onChange={(e) => setSettings({ ...settings, fontSize: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-indigo-700 font-bold">
                    <span>11px (مكثف)</span>
                    <span>14px (قياسي)</span>
                    <span>22px (كبير جداً)</span>
                  </div>
                </div>

                {/* Line Spacing */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-indigo-950">تباعد الأسطر:</label>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-white p-1 border border-indigo-200">
                    {[
                      { id: 'tight', label: 'متقارب' },
                      { id: 'normal', label: 'عادي' },
                      { id: 'spacious', label: 'مريح' },
                    ].map((lh) => (
                      <button
                        key={lh.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, lineHeight: lh.id as any })}
                        className={`rounded py-1 text-xs font-bold transition-all ${
                          settings.lineHeight === lh.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lh.label}
                      </button>
                    ))}
                  </div>
                  <span className="mt-1 block text-[10px] text-indigo-700 font-medium">
                    يساعد في تقليل عدد الصفحات وتوفير الورق
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Columns Header Control */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Right Column */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5">
                  اليمين (المحافظة والإدارة والمدرسة)
                </h4>

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

              {/* Center Column */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5">
                  الوسط (الشعار والعنوان والعام)
                </h4>

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
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      {settings.logoUrl ? 'تغيير الشعار' : 'رفع شعار'}
                    </button>
                  </div>
                </div>

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
                      placeholder="امتحان الفصل الدراسي الأول"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

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

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showMeta}
                      onChange={(e) => setSettings({ ...settings, showMeta: e.target.checked })}
                      className="rounded"
                    />
                    إظهار المادة والصف
                  </label>
                  {settings.showMeta && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={settings.subjectName}
                        onChange={(e) => setSettings({ ...settings, subjectName: e.target.value })}
                        placeholder="المادة"
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800"
                      />
                      <input
                        type="text"
                        value={settings.gradeName}
                        onChange={(e) => setSettings({ ...settings, gradeName: e.target.value })}
                        placeholder="الصف الدراسي"
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Left Column */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5">
                  اليسار (الزمن والدرجة وتاريخ الطباعة)
                </h4>

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
                      placeholder="40 دقيقة"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

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
                      placeholder="25 درجة"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

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

            {/* Additional Toggles */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showStudentBar}
                    onChange={(e) => setSettings({ ...settings, showStudentBar: e.target.checked })}
                  />
                  شريط بيانات الطالب (الاسم ورقم الجلوس والفصل)
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showInstructions}
                    onChange={(e) => setSettings({ ...settings, showInstructions: e.target.checked })}
                  />
                  شريط التعليمات والتنبيهات
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

      {/* ─── A4 Print Canvas (Matches Preview & Print 100%) ─── */}
      <div
        id="nepras-print-sheet"
        className="relative mx-auto max-w-[210mm] bg-white text-black transition-all p-6 md:p-8 shadow-xl rounded-xl border border-slate-200 print:m-0 print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:rounded-none"
        style={{
          fontFamily: activeFont.css,
          fontSize: `${baseFontSize}px`,
          lineHeight: activeLineHeight,
        }}
      >
        <div className="relative z-10">
          {/* ──────────────────────────────────────────────────────────────────
              1. OFFICIAL 3-COLUMN MINISTERIAL HEADER
          ────────────────────────────────────────────────────────────────── */}
          {(settings.showGov !== false || settings.showAdmin !== false || settings.showSchool !== false || settings.showLogo !== false || settings.showTitle !== false || settings.showYear !== false || settings.showMeta !== false || settings.showDuration !== false || settings.showPoints !== false || settings.showPrintDate !== false) && (
            <div className="relative mb-3 border-b-2 border-black pb-2.5 break-inside-avoid">
              <div className="flex items-center justify-between text-black">
                {/* Right Column */}
                <div className="flex-1 text-right leading-snug" dir="rtl">
                  <div style={{ fontSize: `${baseFontSize * 0.9}px` }} className="font-bold space-y-0.5">
                    {settings.showGov !== false && (
                      <div>
                        محافظة: <strong className="font-black">{cleanGov}</strong>
                      </div>
                    )}
                    {settings.showAdmin !== false && (
                      <div>
                        إدارة: <strong className="font-black">{cleanAdmin} التعليمية</strong>
                      </div>
                    )}
                    {settings.showSchool !== false && (
                      <div>
                        مدرسة: <strong className="font-black">{cleanSchool}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Column */}
                <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                  {settings.showLogo !== false && settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt="شعار المدرسة"
                      className="mb-1 max-h-12 max-w-[80px] object-contain print:max-h-10"
                    />
                  )}
                  {settings.showTitle !== false && (
                    <h1
                      style={{ fontSize: `${baseFontSize * 1.3}px` }}
                      className="font-black text-black underline underline-offset-4 decoration-2 leading-tight"
                    >
                      {settings.customTitle || exam.title}
                      {settings.examModel && (
                        <span className="mr-2 inline-block font-black text-black">
                          ({settings.examModel})
                        </span>
                      )}
                    </h1>
                  )}
                  {settings.showYear !== false && (
                    <div
                      style={{ fontSize: `${baseFontSize * 0.88}px` }}
                      className="mt-0.5 font-black text-black"
                    >
                      للعام الدراسي: {settings.academicYear || '2025 / 2026 م'}
                    </div>
                  )}
                  {settings.showMeta !== false && (
                    <div
                      style={{ fontSize: `${baseFontSize * 0.82}px` }}
                      className="mt-0.5 font-bold text-slate-800"
                    >
                      المادة: <strong>{settings.subjectName || exam.subjects?.name_ar}</strong>
                      {settings.gradeName ? ` — ${settings.gradeName}` : (exam.grades?.name_ar ? ` — ${exam.grades.name_ar}` : '')}
                    </div>
                  )}
                </div>

                {/* Left Column */}
                <div className="flex-1 text-left leading-snug" dir="ltr">
                  <div style={{ fontSize: `${baseFontSize * 0.88}px` }} className="font-bold space-y-0.5 text-black">
                    {settings.showDuration !== false && (
                      <div>
                        الزمن: <strong>{settings.durationMinutes || exam.duration_minutes || '40'} دقيقة</strong>
                      </div>
                    )}
                    {settings.showPoints !== false && (
                      <div>
                        الدرجة الكلية: <strong>{settings.totalPoints || exam.total_points || '25'} درجة</strong>
                      </div>
                    )}
                    {settings.showPrintDate !== false && (
                      <div style={{ fontSize: `${baseFontSize * 0.78}px` }} className="text-slate-700">
                        التاريخ: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              2. STUDENT INFO BAR
          ────────────────────────────────────────────────────────────────── */}
          {settings.showStudentBar !== false && answerMode === 'none' && (
            <div
              style={{ fontSize: `${baseFontSize * 0.88}px` }}
              className="mb-3 flex flex-wrap items-center justify-between border-b border-black/60 bg-slate-50/70 px-4 py-1.5 font-bold text-black print:bg-white print:border-black break-inside-avoid"
              dir="rtl"
            >
              <div className="flex items-center gap-2">
                <span>اسم الطالب:</span>
                <span className="inline-block w-48 border-b border-dotted border-black"></span>
              </div>
              <div className="flex items-center gap-2">
                <span>رقم الجلوس:</span>
                <span className="inline-block w-20 border-b border-dotted border-black"></span>
              </div>
              <div className="flex items-center gap-2">
                <span>الفصل:</span>
                <span className="inline-block w-16 border-b border-dotted border-black"></span>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              3. INSTRUCTIONS
          ────────────────────────────────────────────────────────────────── */}
          {settings.showInstructions !== false && settings.instructionsText && (
            <div
              style={{ fontSize: `${baseFontSize * 0.82}px` }}
              className="mb-3 rounded border border-black/40 bg-slate-50/80 px-3 py-1 text-center font-bold text-black print:bg-white print:border-black break-inside-avoid"
            >
              {settings.instructionsText}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              4. QUESTIONS LIST (Seamless Natural Multi-Page Flow)
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
                    <div className="mb-2.5 flex items-center justify-between border-b-[1.5px] border-black pb-1">
                      <h2
                        style={{ fontSize: `${baseFontSize * 1.12}px` }}
                        className={`font-black text-black ${textAlign}`}
                        dir={dir}
                      >
                        {groupTitle}
                      </h2>
                    </div>
                  )}

                  <div className={questionGap}>
                    {blocks.map((block, blockIdx) => (
                      <div key={blockIdx} className="space-y-2.5">
                        {block.passage && (
                          <div
                            className="mb-2.5 break-inside-avoid rounded border border-black/40 bg-slate-50 p-3 print:bg-white"
                            dir={dir}
                          >
                            <p
                              style={{ fontSize: `${baseFontSize * 0.85}px` }}
                              className="mb-1.5 border-b border-black/20 pb-1 font-black text-black"
                            >
                              {isRTL
                                ? 'اقرأ النص أو المسألة التالية بعناية ثم أجب عن الأسئلة:'
                                : 'Read the following passage carefully then answer the questions:'}
                            </p>
                            <MathRenderer text={block.passage} dir={dir} />
                          </div>
                        )}

                        {block.questions.map((q: any) => {
                          qCounter++
                          const num = qCounter
                          return (
                            <div
                              key={q.id}
                              className={`break-inside-avoid ${block.passage ? 'border-r-2 border-black/30 pr-3' : ''}`}
                            >
                              <div className="flex items-start gap-2" dir={dir}>
                                <span
                                  style={{ fontSize: `${baseFontSize * 1.05}px` }}
                                  className="shrink-0 font-black text-black"
                                >
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
                                    <div
                                      style={{ fontSize: `${baseFontSize * 1.02}px` }}
                                      className="flex-1 font-bold leading-relaxed text-black"
                                    >
                                      <MathRenderer text={q.question_text} dir={dir} />
                                    </div>
                                    {q.image_url && (
                                      <div
                                        className={`my-2 overflow-hidden rounded border border-black/20 bg-white ${
                                          q.image_position === 'right' || q.image_position === 'left'
                                            ? 'w-44 shrink-0'
                                            : 'max-w-md'
                                        }`}
                                      >
                                        <img
                                          src={q.image_url}
                                          alt="توضيح السؤال"
                                          className="h-auto w-full object-contain"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div
                                  style={{ fontSize: `${baseFontSize * 0.78}px` }}
                                  className="shrink-0 font-bold text-black/70"
                                >
                                  ({q.points_override ?? q.points ?? 1} {isRTL ? 'درجات' : 'pts'})
                                </div>
                              </div>

                              {/* MCQ Options */}
                              {q.question_type === 'mcq' && q.options && (
                                <div
                                  style={{ fontSize: `${baseFontSize * 0.95}px` }}
                                  className={`mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2 ${
                                    isRTL ? 'pr-5' : 'pl-5'
                                  }`}
                                  dir={dir}
                                >
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const optLettersAR = ['أ', 'ب', 'ج', 'د', 'هـ']
                                    const optLettersEN = ['A', 'B', 'C', 'D', 'E']
                                    const letters = isRTL ? optLettersAR : optLettersEN
                                    const isCorrect =
                                      answerMode !== 'none' &&
                                      (opt === q.correct_answer ||
                                        letters[optIdx] === q.correct_answer ||
                                        String(optIdx + 1) === q.correct_answer)
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`flex items-center gap-1.5 rounded border border-black/30 p-1.5 ${
                                          isCorrect
                                            ? 'bg-black text-white font-black'
                                            : 'bg-white text-black'
                                        }`}
                                      >
                                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-black">
                                          {letters[optIdx] || optIdx + 1}
                                        </span>
                                        <span className="font-bold">
                                          <MathRenderer text={opt} dir={dir} />
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* True / False */}
                              {q.question_type === 'true_false' && (
                                <div
                                  style={{ fontSize: `${baseFontSize * 0.95}px` }}
                                  className={`mt-1.5 flex items-center gap-6 ${isRTL ? 'pr-5' : 'pl-5'}`}
                                  dir={dir}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block h-4.5 w-4.5 rounded-full border border-black"></span>
                                    <span>صواب (✓)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block h-4.5 w-4.5 rounded-full border border-black"></span>
                                    <span>خطأ (✗)</span>
                                  </div>
                                  {answerMode !== 'none' && (
                                    <span className="font-black text-emerald-800">
                                      [الإجابة: {q.correct_answer}]
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Fill blank / Correction / Essay Line Area */}
                              {(q.question_type === 'fill_blank' ||
                                q.question_type === 'correction' ||
                                q.question_type === 'essay') && (
                                <div className={`mt-1.5 space-y-1.5 ${isRTL ? 'pr-5' : 'pl-5'}`}>
                                  {answerMode === 'none' && (
                                    <div className="space-y-2 pt-0.5">
                                      <div className="border-b border-dotted border-black/60 w-full h-3" />
                                      {q.question_type === 'essay' && (
                                        <>
                                          <div className="border-b border-dotted border-black/60 w-full h-3" />
                                          <div className="border-b border-dotted border-black/60 w-full h-3" />
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {answerMode !== 'none' && (
                                    <div
                                      style={{ fontSize: `${baseFontSize * 0.85}px` }}
                                      className="rounded border border-black bg-slate-50 p-2 font-bold text-black"
                                    >
                                      <span>الإجابة النموذجية: </span>
                                      <MathRenderer text={q.correct_answer} dir={dir} />
                                      {answerMode === 'full' && q.explanation && (
                                        <div className="mt-1 pt-1 border-t border-black/20 text-slate-800">
                                          <span>التفسير: </span>
                                          <MathRenderer text={q.explanation} dir={dir} />
                                        </div>
                                      )}
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
              5. CHEER & CLOSING BANNER
          ────────────────────────────────────────────────────────────────── */}
          {settings.showCheerNote !== false && settings.cheerNoteText && (
            <div className="my-5 text-center break-inside-avoid">
              <span
                style={{ fontSize: `${baseFontSize * 0.92}px` }}
                className="inline-block border-y-2 border-black px-8 py-0.5 font-black text-black"
              >
                {settings.cheerNoteText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
