'use client'

import { useState, useEffect, useRef } from 'react'
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
  headerType: 'official' | 'personal' | 'both'
  directorate: string
  administration: string
  schoolName: string
  academicYear: string
  displayName: string
  title: string
  phone: string
  social: string
  customTitle: string
  examModel: string
  durationMinutes: string
  totalPoints: string
  subjectName: string
  gradeName: string
  examDate: string
  logoUrl: string
  showStudentBar: boolean
  showStudentName: boolean
  showSeatNumber: boolean
  showClassSection: boolean
  classSection: string
  showExamDate: boolean
  showInstructions: boolean
  instructionsText: string
  showSignatures: boolean
  signRole1: string
  signRole2: string
  signRole3: string
  signRole4: string
  showSchoolStamp: boolean
  showFooterCheer: boolean
  footerCheer: string
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

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'official' | 'exam' | 'personal' | 'footer'>('official')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [localSettings, setLocalSettings] = useState<PrintCustomSettings>({
    headerType: 'official',
    directorate: '',
    administration: '',
    schoolName: '',
    academicYear: '2024 / 2025',
    displayName: '',
    title: '',
    phone: '',
    social: '',
    customTitle: exam?.title || '',
    examModel: '',
    durationMinutes: exam?.duration_minutes ? String(exam.duration_minutes) : '40',
    totalPoints: exam?.total_points ? String(exam.total_points) : '25',
    subjectName: exam?.subjects?.name_ar || '',
    gradeName: exam?.grades?.name_ar || '',
    examDate: '',
    logoUrl: '',
    showStudentBar: true,
    showStudentName: true,
    showSeatNumber: true,
    showClassSection: false,
    classSection: '',
    showExamDate: false,
    showInstructions: false,
    instructionsText: 'تنبيه: أجب عن جميع الأسئلة الآتية - الإجابة في نفس الورقة',
    showSignatures: true,
    signRole1: 'واضع الامتحان',
    signRole2: 'المراجع المختص',
    signRole3: 'وكيل شؤون الطلاب',
    signRole4: 'مدير المدرسة',
    showSchoolStamp: true,
    showFooterCheer: true,
    footerCheer: 'انتهت الأسئلة مع أطيب التمنيات بالنجاح والتفوق',
    showWatermark: false,
    watermarkText: '',
  })

  useEffect(() => {
    const savedDefaults = localStorage.getItem('istabaq_default_print_settings')
    let baseSettings: Partial<PrintCustomSettings> = {}
    if (savedDefaults) {
      try {
        baseSettings = JSON.parse(savedDefaults)
      } catch {}
    }

    const examSpecific = localStorage.getItem(\`print_settings_exam_\${exam?.id}\`)
    let examSettings: Partial<PrintCustomSettings> = {}
    if (examSpecific) {
      try {
        examSettings = JSON.parse(examSpecific)
      } catch {}
    }

    setLocalSettings((prev) => ({
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
        setLocalSettings((prev) => ({ ...prev, ...customEvent.detail }))
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
        \`print_settings_exam_\${exam.id}\`,
        JSON.stringify(localSettings)
      )
    } catch {}
  }, [localSettings, exam?.id])

  const handleSaveAsDefaults = () => {
    try {
      const defaultsToSave = {
        headerType: localSettings.headerType,
        directorate: localSettings.directorate,
        administration: localSettings.administration,
        schoolName: localSettings.schoolName,
        academicYear: localSettings.academicYear,
        displayName: localSettings.displayName,
        title: localSettings.title,
        phone: localSettings.phone,
        social: localSettings.social,
        logoUrl: localSettings.logoUrl,
        showSignatures: localSettings.showSignatures,
        signRole1: localSettings.signRole1,
        signRole2: localSettings.signRole2,
        signRole3: localSettings.signRole3,
        signRole4: localSettings.signRole4,
        showSchoolStamp: localSettings.showSchoolStamp,
        footerCheer: localSettings.footerCheer,
        watermarkText: localSettings.watermarkText,
      }
      localStorage.setItem(
        'istabaq_default_print_settings',
        JSON.stringify(defaultsToSave)
      )
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalSettings((prev) => ({ ...prev, logoUrl: reader.result as string }))
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

  const subjectName = localSettings.subjectName || exam?.subjects?.name_ar || ''
  const dir = getSubjectDirection(subjectName)
  const isRTL = dir === 'rtl'
  const textAlign = getSubjectTextAlignClass(subjectName)

  const handlePrint = () => window.print()

  const questionTypeTitlesAR: Record<string, string> = {
    mcq: 'اختر الإجابة الصحيحة',
    true_false: 'ضع علامة (✓) أو (✗)',
    fill_blank: 'أكمل الفراغات الآتية',
    correction: 'صوّب ما تحته خط',
    essay: 'أجب عن الأسئلة الآتية',
  }

  const questionTypeTitlesEN: Record<string, string> = {
    mcq: 'Choose the Correct Answer',
    true_false: 'Put True (✓) or False (✗)',
    fill_blank: 'Fill in the Blanks',
    correction: 'Correct the Underlined',
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

  return (
    <div
      className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0"
      dir={dir}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: \`
        @media print {
          @page { margin: 12mm 15mm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .page-break-before { page-break-before: always; break-before: page; }
          .print-hidden { display: none !important; }
        }
      \`,
        }}
      />

      {/* ─── Control Bar (hidden when printing) ─── */}
      <div
        className="mx-auto mb-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden"
        dir="rtl"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-800">
              <Printer className="h-5 w-5 text-primary" />
              معاينة وطباعة ورقة الاختبار
            </h2>
            <button
              onClick={() => setIsCustomizeOpen((v) => !v)}
              className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all \${
                isCustomizeOpen
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
              }\`}
            >
              <Sliders className="h-4 w-4" />
              تخصيص الترويسة والبيانات الكاملة
              {isCustomizeOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              طباعة الاختبار (PDF)
            </button>
          </div>
        </div>

        {/* Second row of quick controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">نمط الإجابة:</span>
            <div className="flex rounded-lg bg-slate-100 p-1">
              {(['none', 'short', 'full'] as AnswerMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAnswerMode(mode)}
                  className={\`rounded-md px-3 py-1 text-xs font-bold transition-all \${
                    answerMode === mode
                      ? mode === 'none'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : mode === 'short'
                          ? 'bg-indigo-100 text-indigo-800 shadow-sm'
                          : 'bg-green-100 text-green-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }\`}
                >
                  {mode === 'none'
                    ? 'بدون حل (ورقة الطالب)'
                    : mode === 'short'
                      ? 'الحل المختصر'
                      : 'نموذج الإجابة الكامل'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSectionHeaders((v) => !v)}
              className={\`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all \${
                showSectionHeaders
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-slate-300 bg-slate-50 text-slate-500'
              }\`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              {showSectionHeaders ? 'عناوين الأقسام: ظاهرة' : 'عناوين الأقسام: مخفية'}
            </button>

            {hiddenCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                  🙈 {hiddenCount} سؤال مخفي
                </span>
                <button
                  onClick={() => setHiddenQuestions(new Set())}
                  className="text-xs text-slate-500 underline hover:text-red-600"
                >
                  إظهار الكل
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Expandable Full Customization Drawer ─── */}
        {isCustomizeOpen && (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-slate-50/80 p-5">
            {/* Tabs header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('official')}
                  className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all \${
                    activeTab === 'official'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }\`}
                >
                  <School className="h-4 w-4" />
                  الترويسة المدرسية والرسمية
                </button>

                <button
                  onClick={() => setActiveTab('exam')}
                  className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all \${
                    activeTab === 'exam'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }\`}
                >
                  <FileText className="h-4 w-4" />
                  بيانات الاختبار والنموذج
                </button>

                <button
                  onClick={() => setActiveTab('personal')}
                  className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all \${
                    activeTab === 'personal'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }\`}
                >
                  <UserCheck className="h-4 w-4" />
                  الترويسة الشخصية والمعلم
                </button>

                <button
                  onClick={() => setActiveTab('footer')}
                  className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all \${
                    activeTab === 'footer'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }\`}
                >
                  <Sparkles className="h-4 w-4" />
                  شريط الطالب والتذييل
                </button>
              </div>

              {/* Action buttons: Save Default */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAsDefaults}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-900"
                  title="حفظ بيانات المدرسة والمعلم كإعدادات دائمة لجميع الاختبارات القادمة"
                >
                  <Save className="h-3.5 w-3.5 text-emerald-400" />
                  {savedSuccess ? '✓ تم الحفظ كافتراضي!' : 'حفظ كإعدادات افتراضية'}
                </button>
              </div>
            </div>

            {/* TAB 1: OFFICIAL SCHOOL HEADER */}
            {activeTab === 'official' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    نوع الترويسة
                  </label>
                  <select
                    value={localSettings.headerType}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        headerType: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="official">ترويسة رسمية (محافظة / مدرسة)</option>
                    <option value="personal">ترويسة شخصية (المعلم / السنتر)</option>
                    <option value="both">كلاهما معاً (رسمي + شخصي)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    المحافظة (المديرية)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الجيزة أو القاهرة"
                    value={localSettings.directorate}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, directorate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    الإدارة التعليمية
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الدقي التعليمية"
                    value={localSettings.administration}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, administration: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    اسم المدرسة / المعهد
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مدرسة الأورمان الثانوية"
                    value={localSettings.schoolName}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, schoolName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: EXAM DETAILS & MODEL */}
            {activeTab === 'exam' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    عنوان ورقة الاختبار (يظهر في وسط الترويسة)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: اختبار الوحدة الأولى: الأعداد والعمليات عليها"
                    value={localSettings.customTitle}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, customTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    نموذج الاختبار (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: نموذج (أ) أو نموذج 1"
                    value={localSettings.examModel}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, examModel: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    العام الدراسي
                  </label>
                  <input
                    type="text"
                    placeholder="2024 / 2025"
                    value={localSettings.academicYear}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, academicYear: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    زمن الإجابة
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="مثال: 40 دقيقة أو ساعة ونصف"
                      value={localSettings.durationMinutes}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          durationMinutes: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-1">
                      {['30', '40', '60'].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              durationMinutes: mins,
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          {mins}د
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    الدرجة الكلية للاختبار
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 25 أو 50"
                    value={localSettings.totalPoints}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, totalPoints: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    المادة الدراسية
                  </label>
                  <input
                    type="text"
                    value={localSettings.subjectName}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, subjectName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    الصف الدراسي
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الصف الأول الإعدادي"
                    value={localSettings.gradeName}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, gradeName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PERSONAL TEACHER & LOGO */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      اسم المعلم / المعلمة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: أ. ضياء العطار"
                      value={localSettings.displayName}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, displayName: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      الصفة / التخصص
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: خبير تدريس الرياضيات"
                      value={localSettings.title}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, title: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      الهاتف / واتساب
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 010xxxxxxxx"
                      value={localSettings.phone}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, phone: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      قناة / صفحة المعلم
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: @istabaq"
                      value={localSettings.social}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, social: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Logo section */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        شعار المدرسة أو المعلم (لوجو أعلى الترويسة)
                      </h4>
                      <p className="text-xs text-slate-500">
                        يمكنك رفع صورة شعار مباشرة من حاسوبك، أو وضع رابط لصورة خارجية.
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
                        className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20"
                      >
                        <Upload className="h-4 w-4" />
                        رفع شعار من جهازك
                      </button>

                      {localSettings.logoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings({ ...localSettings, logoUrl: '' })
                          }
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          حذف الشعار
                        </button>
                      )}
                    </div>
                  </div>

                  {localSettings.logoUrl && (
                    <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                      <img
                        src={localSettings.logoUrl}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-lg border border-slate-200 object-contain p-1"
                      />
                      <span className="text-xs font-bold text-emerald-600">
                        ✓ الشعار مفعل وسيظهر في منتصف ترويسة ورقة الامتحان.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: STUDENT BAR & FOOTER */}
            {activeTab === 'footer' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">
                      شريط بيانات الطالب
                    </h4>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showStudentBar}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            showStudentBar: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      إظهار شريط الطالب
                    </label>
                  </div>

                  {localSettings.showStudentBar && (
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.showStudentName}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              showStudentName: e.target.checked,
                            })
                          }
                        />
                        اسم الطالب
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.showSeatNumber}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              showSeatNumber: e.target.checked,
                            })
                          }
                        />
                        رقم الجلوس
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.showClassSection}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              showClassSection: e.target.checked,
                            })
                          }
                        />
                        الفصل / الشعبة
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.showExamDate}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              showExamDate: e.target.checked,
                            })
                          }
                        />
                        تاريخ الامتحان
                      </label>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">
                      شريط تعليمات وتنبيهات الاختبار
                    </h4>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showInstructions}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            showInstructions: e.target.checked,
                          })
                        }
                      />
                      إظهار شريط التعليمات
                    </label>
                  </div>
                  {localSettings.showInstructions && (
                    <input
                      type="text"
                      placeholder="مثال: تنبيه: أجب عن جميع الأسئلة الآتية - الإجابة في نفس الورقة"
                      value={localSettings.instructionsText}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          instructionsText: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">
                      تذييل الورقة والتوقيعات الرسمية
                    </h4>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showSignatures}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            showSignatures: e.target.checked,
                          })
                        }
                      />
                      إظهار سطر التوقيعات الوزاري بالأسفل
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500 font-bold">التوقيع 1</label>
                      <input
                        type="text"
                        value={localSettings.signRole1}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, signRole1: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500 font-bold">التوقيع 2</label>
                      <input
                        type="text"
                        value={localSettings.signRole2}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, signRole2: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500 font-bold">التوقيع 3</label>
                      <input
                        type="text"
                        value={localSettings.signRole3}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, signRole3: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500 font-bold">التوقيع 4 (الإدارة)</label>
                      <input
                        type="text"
                        value={localSettings.signRole4}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, signRole4: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        عبارة الختام والتشجيع
                      </label>
                      <input
                        type="text"
                        value={localSettings.footerCheer}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            footerCheer: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.showSchoolStamp}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              showSchoolStamp: e.target.checked,
                            })
                          }
                        />
                        خانة خاتم المدرسة
                      </label>

                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.showWatermark}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              showWatermark: e.target.checked,
                            })
                          }
                        />
                        علامة مائية
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden questions list reminder */}
      {hiddenCount > 0 && (
        <div className="mx-auto mb-4 max-w-4xl print:hidden" dir="rtl">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="mb-2 text-sm font-bold text-orange-800">
              الأسئلة المستبعدة من الطباعة حالياً ({hiddenCount} سؤال):
            </p>
            <div className="flex flex-wrap gap-2">
              {questions
                .filter((q) => hiddenQuestions.has(q.id))
                .map((q) => (
                  <button
                    key={q.id}
                    onClick={() => toggleQuestionVisibility(q.id)}
                    className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-800 transition-colors hover:bg-orange-100"
                  >
                    <Eye className="h-3 w-3" />
                    <span className="line-clamp-1 max-w-[200px]">
                      {q.question_text?.slice(0, 40)}...
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── A4 Print Container ─── */}
      <div className="relative mx-auto max-w-[210mm] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl print:m-0 print:w-full print:max-w-none print:rounded-none print:border-none print:shadow-none">
        {/* Full-page Watermark Overlay */}
        {localSettings.showWatermark && (
          <div
            className="pointer-events-none absolute inset-0 z-0 flex flex-wrap content-start justify-center gap-x-24 gap-y-48 pt-48 opacity-[0.04]"
            aria-hidden="true"
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="rotate-[-35deg] whitespace-nowrap text-5xl font-black sm:text-7xl text-slate-900"
              >
                {localSettings.watermarkText || localSettings.displayName || localSettings.schoolName || 'استباق مصر'}
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10 p-6 md:p-10 print:p-0">
          {/* ─── Premium 3-Column Exam Header ─── */}
          <div className="relative mb-5 border-b-4 border-double border-slate-800 pb-4">
            <div className="relative z-10 flex items-center justify-between text-sm font-bold">
              {/* Right Side (اليمين: الترويسة الرسمية) */}
              <div
                className="flex-1 text-right leading-relaxed text-slate-800"
                dir="rtl"
              >
                {(localSettings.headerType === 'official' ||
                  localSettings.headerType === 'both') && (
                  <>
                    <div>
                      محافظة: {localSettings.directorate || '..............'}
                    </div>
                    <div>
                      إدارة: {localSettings.administration ? \`\${localSettings.administration}\` : '..............'}
                    </div>
                    <div>
                      مدرسة: {localSettings.schoolName || '..............'}
                    </div>
                  </>
                )}
                {localSettings.headerType === 'personal' && (
                  <>
                    <div className="text-xl font-black text-indigo-900">
                      {localSettings.displayName || 'اسم المعلم'}
                    </div>
                    <div className="text-slate-600">{localSettings.title}</div>
                    <div className="text-slate-500">{localSettings.phone}</div>
                  </>
                )}
              </div>

              {/* Center (الوسط: الشعار + عنوان الاختبار + المادة والصف) */}
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                {localSettings.logoUrl && (
                  <img
                    src={localSettings.logoUrl}
                    alt="Logo"
                    className="mb-2 max-h-16 max-w-[120px] object-contain print:max-h-14"
                  />
                )}
                <h1 className="text-2xl font-black leading-tight text-slate-900">
                  {localSettings.customTitle || exam.title}
                  {localSettings.examModel && (
                    <span className="mr-2 text-primary font-bold">
                      ({localSettings.examModel})
                    </span>
                  )}
                </h1>
                <div className="mt-1 text-sm font-bold text-slate-700">
                  المادة: {localSettings.subjectName || exam.subjects?.name_ar}
                  {localSettings.gradeName ? \` | \${localSettings.gradeName}\` : (exam.grades?.name_ar ? \` | \${exam.grades.name_ar}\` : '')}
                </div>
              </div>

              {/* Left Side (اليسار: العام الدراسي + الزمن + الدرجة أو بيانات المعلم) */}
              <div
                className="flex-1 text-left leading-relaxed text-slate-800"
                dir="ltr"
              >
                {localSettings.headerType === 'both' && (
                  <>
                    <div
                      className="text-right text-xl font-black text-indigo-900"
                      dir="rtl"
                    >
                      {localSettings.displayName || 'اسم المعلم'}
                    </div>
                    <div className="text-right text-slate-600" dir="rtl">
                      {localSettings.title}
                    </div>
                    <div className="text-right text-slate-500" dir="rtl">
                      {localSettings.phone}
                    </div>
                  </>
                )}
                {localSettings.headerType !== 'both' && (
                  <>
                    <div className="text-right" dir="rtl">
                      العام الدراسي: {localSettings.academicYear || '2024 / 2025'}
                    </div>
                    <div className="text-right" dir="rtl">
                      زمن الإجابة:{' '}
                      {localSettings.durationMinutes
                        ? \`\${localSettings.durationMinutes} دقيقة\`
                        : exam.duration_minutes
                          ? \`\${exam.duration_minutes} دقيقة\`
                          : '..............'}
                    </div>
                    <div className="text-right" dir="rtl">
                      الدرجة الكلية:{' '}
                      {localSettings.totalPoints || exam.total_points || '..............'}
                    </div>
                    {localSettings.showExamDate && localSettings.examDate && (
                      <div className="text-right" dir="rtl">
                        التاريخ:{' '}
                        {new Date(localSettings.examDate).toLocaleDateString('ar-EG')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sub-bar if both official & personal are enabled */}
            {localSettings.headerType === 'both' && (
              <div className="relative z-10 mt-3 flex justify-center gap-6 border-t border-slate-300 pt-2 text-sm font-bold text-slate-700">
                <span>العام الدراسي: {localSettings.academicYear || '2024 / 2025'}</span>
                <span>
                  الزمن:{' '}
                  {localSettings.durationMinutes
                    ? \`\${localSettings.durationMinutes} دقيقة\`
                    : \`\${exam.duration_minutes} دقيقة\`}
                </span>
                <span>
                  الدرجة:{' '}
                  {localSettings.totalPoints || exam.total_points || '..............'}
                </span>
                {localSettings.showExamDate && localSettings.examDate && (
                  <span>
                    التاريخ: {new Date(localSettings.examDate).toLocaleDateString('ar-EG')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ─── Student Information Bar ─── */}
          {localSettings.showStudentBar && answerMode === 'none' && (
            <div className="flex flex-wrap items-center gap-4 md:gap-6 border-b-2 border-slate-800 bg-slate-50 px-6 py-3 text-sm md:text-base font-bold print:bg-white mb-4">
              {localSettings.showStudentName && (
                <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                  <span className="shrink-0">اسم الطالب:</span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-400" />
                </div>
              )}

              {localSettings.showSeatNumber && (
                <div className="flex w-36 md:w-44 items-center gap-2">
                  <span className="shrink-0">رقم الجلوس:</span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-400" />
                </div>
              )}

              {localSettings.showClassSection && (
                <div className="flex w-32 md:w-40 items-center gap-2">
                  <span className="shrink-0">الفصل:</span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-400" />
                </div>
              )}

              {localSettings.showExamDate && (
                <div className="flex w-32 md:w-40 items-center gap-2">
                  <span className="shrink-0">التاريخ:</span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-400" />
                </div>
              )}
            </div>
          )}

          {/* ─── Instructions Banner ─── */}
          {localSettings.showInstructions && localSettings.instructionsText && (
            <div className="mb-6 rounded-lg border border-slate-400 bg-slate-50 px-4 py-2 text-center text-xs md:text-sm font-bold text-slate-800 print:bg-white">
              {localSettings.instructionsText}
            </div>
          )}

          {/* ─── Questions List ─── */}
          <div className="space-y-10 p-2 md:p-6 print:p-0">
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
                ? \`السؤال \${groupIdx + 1}\`
                : \`Question \${groupIdx + 1}\`
              const groupTitle = \`\${labels[groupIdx] || fallback}: \${questionTypeTitles[type]}\`
              let qCounter = 0

              return (
                <div key={type} className="space-y-6">
                  {showSectionHeaders && (
                    <h3
                      className={\`mb-6 border-b-2 border-slate-800 pb-2 text-xl font-bold text-slate-800 \${textAlign}\`}
                      dir={dir}
                    >
                      {groupTitle}
                    </h3>
                  )}

                  <div className="space-y-8">
                    {blocks.map((block, blockIdx) => (
                      <div key={blockIdx} className="space-y-4">
                        {/* Passage */}
                        {block.passage && (
                          <div
                            className="mb-4 break-inside-avoid rounded-xl border-2 border-amber-300 bg-amber-50 p-5"
                            dir={dir}
                          >
                            <p className="mb-3 border-b border-amber-300 pb-2 text-sm font-bold text-amber-900">
                              {isRTL
                                ? 'اقرأ النص التالي ثم أجب عن الأسئلة:'
                                : 'Read the following passage then answer the questions:'}
                            </p>
                            <MathRenderer text={block.passage} dir={dir} />
                          </div>
                        )}

                        {/* Questions */}
                        {block.questions.map((q: any) => {
                          qCounter++
                          const num = qCounter
                          const isHidden = hiddenQuestions.has(q.id)
                          return (
                            <div
                              key={q.id}
                              className={\`break-inside-avoid space-y-3 \${block.passage ? 'border-r-2 border-amber-200 pr-4' : ''}\`}
                            >
                              <div className="flex items-start gap-2" dir={dir}>
                                <span className="shrink-0 text-lg font-bold">
                                  {num}.
                                </span>
                                <div className={\`flex-1 \${textAlign}\`}>
                                  <div
                                    className={\`flex \${
                                      q.image_position === 'top'
                                        ? 'flex-col-reverse'
                                        : q.image_position === 'right'
                                          ? 'flex-row-reverse items-start gap-6'
                                          : q.image_position === 'left'
                                            ? 'flex-row items-start gap-6'
                                            : 'flex-col'
                                    }\`}
                                  >
                                    <div className="flex-1 text-lg font-medium leading-relaxed">
                                      <MathRenderer
                                        text={q.question_text
                                          .replace(
                                            /^(\\(?\\d+[[\\)\\.\\-\\s]\\s*)/,
                                            ''
                                          )
                                          .trim()}
                                        dir={dir}
                                      />
                                    </div>
                                    {q.question_image_url && (
                                      <div
                                        className={\`shrink-0 text-center \${q.image_position === 'right' || q.image_position === 'left' ? 'w-1/3' : 'mt-4 w-full'}\`}
                                      >
                                        <img
                                          src={q.question_image_url}
                                          alt="صورة السؤال"
                                          className="inline-block max-h-48 rounded-lg border border-slate-200 object-contain shadow-sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 rounded bg-slate-50 px-2 py-1 text-sm font-bold text-slate-500">
                                  ({q.points_override ?? q.points} درجات)
                                </div>

                                {/* Hide/Show toggle — screen only */}
                                <button
                                  onClick={() => toggleQuestionVisibility(q.id)}
                                  title={
                                    isHidden
                                      ? 'إظهار السؤال'
                                      : 'إخفاء السؤال من الطباعة'
                                  }
                                  className={\`shrink-0 rounded-lg border p-1.5 transition-all print:hidden \${
                                    isHidden
                                      ? 'border-orange-300 bg-orange-100 text-orange-600 hover:bg-orange-200'
                                      : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500'
                                  }\`}
                                >
                                  {isHidden ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              {/* MCQ options */}
                              {q.question_type === 'mcq' &&
                                q.options &&
                                (() => {
                                  const maxLen = Math.max(
                                    ...q.options.map((o: string) => o.length)
                                  )
                                  const cols =
                                    maxLen > 40
                                      ? 'grid-cols-1'
                                      : maxLen > 15
                                        ? 'grid-cols-2'
                                        : 'grid-cols-4'
                                  return (
                                    <div
                                      className={\`grid \${cols} gap-x-6 gap-y-3 \${isRTL ? 'pr-6' : 'pl-6'}\`}
                                    >
                                      {q.options.map(
                                        (opt: string, oIdx: number) => {
                                          const correct =
                                            answerMode !== 'none' &&
                                            opt === q.correct_answer
                                          return (
                                            <div
                                              key={oIdx}
                                              className={\`flex items-start gap-2 text-base \${correct ? 'font-bold text-green-700' : ''}\`}
                                            >
                                              <div
                                                className={\`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border \${correct ? 'border-green-600 bg-green-100' : 'border-slate-400'}\`}
                                              >
                                                {correct && (
                                                  <div className="h-2 w-2 rounded-full bg-green-600" />
                                                )}
                                              </div>
                                              <div className="flex-1">
                                                <MathRenderer
                                                  text={opt}
                                                  dir={dir}
                                                />
                                              </div>
                                            </div>
                                          )
                                        }
                                      )}
                                    </div>
                                  )
                                })()}

                              {/* Answer lines for essay/open questions */}
                              {answerMode === 'none' &&
                                q.question_type !== 'mcq' && (
                                  <div
                                    className={\`mt-6 space-y-8 \${isRTL ? 'pr-6' : 'pl-6'} mb-4\`}
                                  >
                                    {Array.from({
                                      length:
                                        q.question_type === 'essay' ? 6 : 2,
                                    }).map((_, i) => (
                                      <div
                                        key={i}
                                        className="w-full border-b-2 border-dashed border-slate-300"
                                      />
                                    ))}
                                  </div>
                                )}

                              {/* Model answer display */}
                              {answerMode !== 'none' && (
                                <div
                                  className={\`mt-3 space-y-2 \${isRTL ? 'pr-6' : 'pl-6'}\`}
                                >
                                  {q.question_type !== 'mcq' && (
                                    <div className="rounded border border-green-200 bg-green-50 p-3">
                                      <span className="mb-1 block text-sm font-bold text-green-800">
                                        الإجابة الصحيحة:
                                      </span>
                                      <div className="font-medium text-green-700">
                                        <MathRenderer
                                          text={q.correct_answer}
                                          dir={dir}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {answerMode === 'full' && q.explanation && (
                                    <div className="rounded border border-blue-200 bg-blue-50 p-3">
                                      <span className="mb-1 block text-sm font-bold text-blue-800">
                                        التفسير:
                                      </span>
                                      <div className="text-sm text-blue-700">
                                        <MathRenderer
                                          text={q.explanation}
                                          dir={dir}
                                        />
                                      </div>
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

          {/* ─── Footer Cheer Message ─── */}
          {localSettings.showFooterCheer && localSettings.footerCheer && (
            <div className="my-10 text-center text-sm md:text-base font-bold text-slate-800 break-inside-avoid">
              <span className="inline-block border-b-2 border-t-2 border-slate-800 px-6 py-1">
                {localSettings.footerCheer}
              </span>
            </div>
          )}

          {/* ─── Official Signatures Footer ─── */}
          {localSettings.showSignatures && (
            <div className="mt-8 break-inside-avoid border-t-2 border-slate-800 pt-6">
              <div className="grid grid-cols-4 gap-2 text-center text-xs md:text-sm font-bold text-slate-800">
                <div>
                  <div className="mb-8">{localSettings.signRole1}</div>
                  <div className="border-t border-dotted border-slate-500 pt-1 text-xs text-slate-500">
                    التوقيع: ....................
                  </div>
                </div>
                <div>
                  <div className="mb-8">{localSettings.signRole2}</div>
                  <div className="border-t border-dotted border-slate-500 pt-1 text-xs text-slate-500">
                    التوقيع: ....................
                  </div>
                </div>
                <div>
                  <div className="mb-8">{localSettings.signRole3}</div>
                  <div className="border-t border-dotted border-slate-500 pt-1 text-xs text-slate-500">
                    التوقيع: ....................
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-2">{localSettings.signRole4}</div>
                  {localSettings.showSchoolStamp && (
                    <div className="flex h-14 w-28 items-center justify-center rounded-lg border-2 border-dashed border-slate-400 text-[11px] text-slate-400">
                      (خاتم المدرسة)
                    </div>
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
