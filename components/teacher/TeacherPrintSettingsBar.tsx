'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Printer, Save, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PrintSettings {
  directorate: string
  administration: string
  schoolName: string
  academicYear: string
  teacherName: string
  classSection: string
  examDate: string
  headerType: 'official' | 'personal' | 'both'
  displayName: string
  title: string
  phone: string
  social: string
  logoUrl: string
  watermarkText: string
  showWatermark: boolean
}

interface Props {
  examId: string
  teacherId: string
  initialSettings: {
    print_directorate?: string | null
    print_administration?: string | null
    print_school_name?: string | null
    print_academic_year?: string | null
    print_header_type?: 'official' | 'personal' | 'both' | null
    teacher_display_name?: string | null
    teacher_title?: string | null
    teacher_phone?: string | null
    teacher_social?: string | null
    teacher_logo_url?: string | null
    teacher_watermark_text?: string | null
    show_watermark?: boolean | null
  }
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-400'

const labelClass = 'block text-xs font-bold text-slate-500 mb-1'

export function TeacherPrintSettingsBar({ examId, teacherId, initialSettings }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState<PrintSettings>({
    directorate: initialSettings.print_directorate ?? '',
    administration: initialSettings.print_administration ?? '',
    schoolName: initialSettings.print_school_name ?? '',
    academicYear: initialSettings.print_academic_year ?? '',
    teacherName: '',
    classSection: '',
    examDate: '',
    headerType: initialSettings.print_header_type || 'official',
    displayName: initialSettings.teacher_display_name || '',
    title: initialSettings.teacher_title || '',
    phone: initialSettings.teacher_phone || '',
    social: initialSettings.teacher_social || '',
    logoUrl: initialSettings.teacher_logo_url || '',
    watermarkText: initialSettings.teacher_watermark_text || '',
    showWatermark: initialSettings.show_watermark || false,
  })

  // Load per-exam fields from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`print_settings_exam_${examId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings(prev => ({
          ...prev,
          teacherName: parsed.teacherName ?? '',
          classSection: parsed.classSection ?? '',
          examDate: parsed.examDate ?? '',
        }))
      } catch {
        // ignore malformed data
      }
    }
  }, [examId])

  // Dispatch custom event to notify PrintExamClient about settings changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('print-settings-changed', { detail: settings }))
  }, [settings])

  const update = (key: keyof PrintSettings, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)

    // Save global teacher settings to Supabase — including ALL new fields
    const supabase = createClient()
    await supabase
      .from('teachers')
      .update({
        print_directorate: settings.directorate,
        print_administration: settings.administration,
        print_school_name: settings.schoolName,
        print_academic_year: settings.academicYear,
        print_header_type: settings.headerType,
        teacher_display_name: settings.displayName,
        teacher_title: settings.title,
        teacher_phone: settings.phone,
        teacher_social: settings.social,
        teacher_logo_url: settings.logoUrl,
        teacher_watermark_text: settings.watermarkText,
        show_watermark: settings.showWatermark,
      })
      .eq('id', teacherId)

    // Save per-exam fields to localStorage
    localStorage.setItem(
      `print_settings_exam_${examId}`,
      JSON.stringify({
        teacherName: settings.teacherName,
        classSection: settings.classSection,
        examDate: settings.examDate,
      })
    )

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePrint = () => window.print()

  return (
    <div className="print:hidden bg-white border-b border-slate-200 shadow-sm" dir="rtl">
      {/* Header bar */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 font-bold text-sm transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          إعدادات رأس الاختبار
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold transition-all shadow-sm shadow-indigo-200 active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ…' : saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-sm shadow-emerald-200 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            طباعة PDF
          </button>
        </div>
      </div>

      {/* Collapsible settings panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="settings-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="max-w-5xl mx-auto px-4 pb-5">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
                <p className="text-xs text-slate-400 mb-4 font-medium">
                  💡 هذه المعلومات ستظهر في رأس ورقة الاختبار عند الطباعة. يتم حفظ بيانات المدرسة تلقائيًا لكل اختباراتك.
                </p>

                {/* Grid of fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Row 1 — global teacher settings */}
                  <div>
                    <label className={labelClass}>مديرية التربية والتعليم</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="مثال: القاهرة"
                      value={settings.directorate}
                      onChange={e => update('directorate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>الإدارة التعليمية</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="مثال: مصر الجديدة"
                      value={settings.administration}
                      onChange={e => update('administration', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>اسم المدرسة</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="مثال: مدرسة النور الثانوية"
                      value={settings.schoolName}
                      onChange={e => update('schoolName', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>العام الدراسي</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="مثال: 2024 / 2025"
                      value={settings.academicYear}
                      onChange={e => update('academicYear', e.target.value)}
                    />
                  </div>

                  {/* Row 2 — per-exam settings (localStorage) */}
                  <div>
                    <label className={labelClass}>اسم المعلم / المعلمة</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="مثال: أ. محمد علي"
                      value={settings.teacherName}
                      onChange={e => update('teacherName', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>الشعبة / الفصل</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="مثال: الشعبة أ"
                      value={settings.classSection}
                      onChange={e => update('classSection', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>تاريخ الامتحان</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={settings.examDate}
                      onChange={e => update('examDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Preview row */}
                {(settings.directorate || settings.administration || settings.schoolName || settings.teacherName || settings.classSection || settings.examDate) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 border border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 text-sm text-slate-700 leading-relaxed"
                  >
                    <p className="font-bold text-indigo-700 mb-2 text-xs">معاينة رأس الاختبار:</p>
                    <div className="grid grid-cols-2 gap-1 text-xs font-medium">
                      {settings.directorate && <span>مديرية التربية والتعليم بـ {settings.directorate}</span>}
                      {settings.academicYear && <span className="text-right">العام الدراسي: {settings.academicYear}</span>}
                      {settings.administration && <span>إدارة {settings.administration} التعليمية</span>}
                      {settings.teacherName && <span className="text-right">المعلم/ة: {settings.teacherName}</span>}
                      {settings.schoolName && <span>مدرسة {settings.schoolName}</span>}
                      {settings.classSection && <span className="text-right">الشعبة: {settings.classSection}</span>}
                      {settings.examDate && <span>تاريخ الامتحان: {new Date(settings.examDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
