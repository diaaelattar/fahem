'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  AlertCircle,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'

interface StudentImportWizardProps {
  schoolClasses: any[]
  grades: any[]
}

export function StudentImportWizard({ schoolClasses, grades }: StudentImportWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [gradeId, setGradeId] = useState('')
  const [classId, setClassId] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importResults, setImportResults] = useState<any>(null)

  // قراءة وتحليل ملف الـ CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('يرجى اختيار ملف بصيغة CSV فقط.')
      return
    }

    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const parseCSV = (text: string) => {
    try {
      const lines = text.split(/\r?\n/)
      const data: any[] = []

      // تجاهل السطر الأول (العناوين) والبدء من الثاني
      // السطر الأول المتوقع: الاسم، البريد الإلكتروني
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const columns = line.split(',')
        if (columns.length >= 2) {
          const fullName = columns[0]?.trim()
          const email = columns[1]?.trim()
          
          if (fullName && email) {
            data.push({ fullName, email, isValidEmail: /\S+@\S+\.\S+/.test(email) })
          }
        }
      }

      if (data.length === 0) {
        setError('الملف لا يحتوي على بيانات صالحة أو التنسيق غير صحيح (الاسم، البريد).')
        return
      }

      setParsedData(data)
      setStep(2)
    } catch (err) {
      setError('فشل في قراءة محتوى الملف.')
    }
  }

  const handleStartImport = async () => {
    if (parsedData.length === 0) return
    
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/school/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentsList: parsedData,
          classId: classId || null,
          gradeId: gradeId || null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء الاستيراد.')
      }

      setImportResults(data.results)
      setStep(4)
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالخادم لإتمام الاستيراد.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الترويسة وشريط التنقل */}
      <div className="flex items-center gap-3">
        <Link href="/school/students" className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">معالج استيراد الطلاب</h2>
          <p className="text-xs text-slate-400 mt-1">رفع وتهيئة بيانات الطلاب الجدد دفعة واحدة.</p>
        </div>
      </div>

      {/* شريط تقدم خطوات المعالج */}
      <div className="flex items-center justify-center max-w-lg mx-auto py-4">
        {[
          { label: 'رفع الملف', stepNum: 1 },
          { label: 'مراجعة البيانات', stepNum: 2 },
          { label: 'الفصل والصف', stepNum: 3 },
          { label: 'النتيجة', stepNum: 4 }
        ].map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                step >= item.stepNum
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                {item.stepNum}
              </div>
              <span className={`text-[10px] font-semibold mt-1 ${step >= item.stepNum ? 'text-cyan-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </div>
            {index < 3 && (
              <div className={`h-[2px] w-12 sm:w-16 mx-2 ${step > item.stepNum ? 'bg-cyan-600' : 'bg-slate-900'}`} />
            )}
          </div>
        ))}
      </div>

      {/* محتوى خطوات المعالج */}
      <div className="rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">اختر ملف الطلاب (CSV)</h3>
              <p className="text-xs text-slate-400">
                يرجى التأكد من أن الملف بصيغة CSV ويحتوي على عمودين بالترتيب: الاسم، والبريد الإلكتروني.
              </p>
            </div>

            <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center hover:border-cyan-500/50 transition-colors relative cursor-pointer group bg-slate-900/10">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileSpreadsheet className="h-12 w-12 text-slate-600 mx-auto group-hover:text-cyan-400 transition-colors mb-4 animate-pulse" />
              <span className="text-sm font-bold text-slate-200 block">اضغط هنا أو اسحب الملف لرفعه</span>
              <span className="text-[10px] text-slate-500 mt-1 block">الملفات بصيغة .csv فقط (الحد الأقصى 100 سطر)</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                {error}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h3 className="text-base font-bold text-white">مراجعة الطلاب الجاري استيرادهم ({parsedData.length})</h3>
              <span className="text-xs text-slate-400">تأكد من عدم وجود تنبيهات على البريد الإلكتروني.</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-900">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/40 text-slate-400 font-bold sticky top-0">
                  <tr className="border-b border-slate-900">
                    <th className="p-3">اسم الطالب الكامل</th>
                    <th className="p-3">البريد الإلكتروني</th>
                    <th className="p-3 text-left">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {parsedData.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20 text-slate-300">
                      <td className="p-3 font-semibold text-white">{student.fullName}</td>
                      <td className="p-3 font-mono">{student.email}</td>
                      <td className="p-3 text-left">
                        {student.isValidEmail ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded-md">
                            جاهز
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/40 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            غير صالح
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                السابق
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                <span>متابعة لتحديد الصفوف</span>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-1 mb-6">
              <h3 className="text-lg font-bold text-white">تحديد الصف والفصل الدراسي</h3>
              <p className="text-xs text-slate-400">سيتم إدراج جميع الطلاب المستوردين في هذا الصف والفصل تلقائياً.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  الصف الدراسي العام
                </label>
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">غير محدد</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  الفصل المدرسي المخصص
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">غير مرتبط بفصل</option>
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-xs text-red-400" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* موافقة GDPR صريحة قبل الاستيراد */}
            <label
              htmlFor="gdpr-consent-checkbox"
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                gdprConsent
                  ? 'border-cyan-700/40 bg-cyan-950/10'
                  : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
              }`}
            >
              <input
                id="gdpr-consent-checkbox"
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 shrink-0"
                aria-required="true"
              />
              <span className="text-xs text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-200 block mb-1">إقرار موافقة معالجة البيانات — القانون 151/2020</span>
                أقرّ بأنني مفوّض من إدارة المدرسة باستيراد هذه البيانات الشخصية للطلاب،
                وأن معالجتها تتم لأغراض تعليمية صريحة وفقاً لقانون حماية البيانات الشخصية المصري
                رقم <span className="text-white font-bold">151 لسنة 2020</span> وسياسة خصوصية المنصة.
              </span>
            </label>

            <div className="flex justify-between items-center pt-2 border-t border-slate-900">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                السابق
              </button>
              <button
                onClick={handleStartImport}
                disabled={loading || !gdprConsent}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-disabled={!gdprConsent}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-200" aria-hidden="true" />
                    جاري استيراد البيانات...
                  </>
                ) : (
                  `بدء استيراد ${parsedData.length} طالب`
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && importResults && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCheck className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">اكتمل معالج الاستيراد!</h3>
            <p className="text-sm text-slate-300">
              لقد تم استيراد وتأمين حسابات الطلاب بنجاح.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">العمليات الناجحة</span>
                <span className="text-2xl font-extrabold text-emerald-400">{importResults.success}</span>
              </div>
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">العمليات الفاشلة</span>
                <span className="text-2xl font-extrabold text-red-400">{importResults.failed}</span>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 text-right space-y-2 max-h-[150px] overflow-y-auto">
                <span className="text-xs font-bold text-red-400 block">سجل التنبيهات والأخطاء:</span>
                {importResults.errors.map((errStr: string, idx: number) => (
                  <p key={idx} className="text-[10px] text-slate-400 leading-relaxed">• {errStr}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center pt-6 border-t border-slate-900">
              <Link
                href="/school/students"
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                الذهاب للطلاب
              </Link>
              <button
                onClick={() => {
                  setStep(1)
                  setCsvFile(null)
                  setParsedData([])
                  setImportResults(null)
                }}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                استيراد ملف آخر
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
