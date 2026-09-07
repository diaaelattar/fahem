'use client'

import { useState } from 'react'
import {
  Printer,
  Sparkles,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building,
  Award
} from 'lucide-react'

interface Grade {
  id: string | number
  name_ar: string
}

interface PrintablesStudioProps {
  profile: any
  initialSubjectName: string
  schoolName: string
  allGrades: Grade[]
}

export function PrintablesStudioClient({
  profile,
  initialSubjectName,
  schoolName,
  allGrades,
}: PrintablesStudioProps) {
  const [docType, setDocType] = useState<'worksheet' | 'lesson_plan'>('worksheet')

  const [governorate, setGovernorate] = useState('الجيزة')
  const [administration, setAdministration] = useState('الهرم')
  const [school, setSchool] = useState(schoolName || 'مدرسة الشهيد الرسمية')
  const [academicYear, setAcademicYear] = useState('2025 / 2026 م')
  const [term, setTerm] = useState('الفصل الدراسي الثاني')

  const [subjectName, setSubjectName] = useState(initialSubjectName || 'العلوم')
  const [selectedGrade, setSelectedGrade] = useState(allGrades[0]?.name_ar || 'الصف الثاني الإعدادي')
  const [unitName, setUnitName] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [instructions, setInstructions] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedDoc, setGeneratedDoc] = useState<any>(null)

  const handleGenerate = async () => {
    if (!lessonTitle.trim()) {
      setError('يرجى إدخال عنوان الدرس للبدء بالتوليد')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/teacher/generate-printable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: docType,
          subjectName,
          gradeName: selectedGrade,
          lessonTitle,
          unitName,
          instructions,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'حدث خطأ أثناء التوليد')

      setGeneratedDoc(json.data)
    } catch (err: any) {
      setError(err.message || 'فشل توليد المستند')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Printer className="h-7 w-7 text-indigo-400" />
              استوديو الطباعة والتحضير الفاخر
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              توليد أوراق عمل واختبارات ودفاتر تحضير مطابقة للمواصفات الوزارية المصرية A4 (بدون استهلاك لقاعدة البيانات)
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setDocType('worksheet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                docType === 'worksheet'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              ورقة عمل / اختبار أسبوعي
            </button>
            <button
              onClick={() => setDocType('lesson_plan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                docType === 'lesson_plan'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              خطة درس / تحضير نموذجي
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-black text-indigo-300 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-400" />
              بيانات الترويسة الوزارية الثلاثية
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">المحافظة</label>
                <input
                  type="text"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">الإدارة التعليمية</label>
                <input
                  type="text"
                  value={administration}
                  onChange={(e) => setAdministration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">المدرسة</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">العام الدراسي</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">الفصل الدراسي</label>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-black text-emerald-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              بيانات الدرس وتوجيهات الذكاء الاصطناعي
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">المادة الدراسية</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">الصف الدراسي</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-emerald-500 outline-none"
                >
                  {allGrades.map((g) => (
                    <option key={g.id} value={g.name_ar}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">الوحدة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: الوحدة الأولى"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">عنوان الدرس (مطلوب) *</label>
                <input
                  type="text"
                  placeholder="مثال: الحركة والسرعة النسبية"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold focus:border-emerald-500 outline-none text-emerald-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-xs font-bold">
                ملاحظات وتوجيهات للمعلم (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="مثال: التركيز على أسئلة علل وبما تفسر دقيقة..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-medium focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                توليد لحظي وطباعة فورية بدون حفظ ملفات على السيرفر
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/30 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    جارٍ التحضير...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    توليد المستند النموذجي الآن
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {generatedDoc && (
        <div className="no-print flex items-center justify-between bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">المستند جاهز للمعاينة والطباعة</h3>
              <p className="text-xs text-slate-400">
                راجع المحتوى ثم انقر على زر الطباعة للحصول على ورقة A4 فاخرة
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/40 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            طباعة / حفظ كـ PDF (A4)
          </button>
        </div>
      )}

      {generatedDoc && (
        <div className="a4-print-container flex justify-center pb-12">
          <div
            className="a4-page bg-white text-black p-8 shadow-2xl rounded-sm border border-slate-200"
            style={{
              width: '210mm',
              minHeight: '297mm',
              fontFamily: '"Cairo", "Arial", sans-serif',
              color: '#000000',
            }}
          >
            {/* 1. Official 3-Column Ministerial Header */}
            <div className="grid grid-cols-3 items-start border-b-2 border-black pb-3 mb-4 text-xs font-bold leading-relaxed">
              <div className="text-right space-y-0.5">
                <div>وزارة التربية والتعليم والتعليم الفني</div>
                <div>محافظة: {governorate.replace(/^محافظة\s*/, '')}</div>
                <div>إدارة: {administration.replace(/^إدارة\s*/, '').replace(/\s*التعليمية$/, '')} التعليمية</div>
                <div>مدرسة: {school.replace(/^مدرسة\s*/, '')}</div>
              </div>

              <div className="text-center space-y-1">
                <div className="text-base font-black border-b border-black pb-0.5 inline-block">
                  {docType === 'worksheet' ? 'ورقة عمل وتقييم أسبوعي' : 'خطة درس نموذجية (دفتر التحضير)'}
                </div>
                <div className="text-xs font-bold text-slate-800">
                  مادة: {subjectName} | {selectedGrade}
                </div>
                <div className="text-[11px] font-semibold underline">
                  العام الدراسي: {academicYear}
                </div>
              </div>

              <div className="text-left space-y-0.5 text-[11px]">
                <div>الفصل الدراسي: {term}</div>
                <div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>
                {docType === 'worksheet' ? (
                  <>
                    <div>الزمن: {generatedDoc.estimatedTimeMinutes || 25} دقيقة</div>
                    <div>الدرجة الكلية: ({generatedDoc.totalMarks || 20}) درجة</div>
                  </>
                ) : (
                  <>
                    <div>زمن الحصة: 45 دقيقة</div>
                    <div>نوع التحضير: نظام 2.0 المطور</div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Student Info Bar */}
            {docType === 'worksheet' && (
              <div className="border border-black rounded p-2 mb-4 text-xs font-bold flex justify-between items-center bg-slate-50">
                <div>اسم الطالب: ..............................................................</div>
                <div>الفصل: ................</div>
                <div>رقم الجلوس: ..........</div>
                <div className="border border-black px-3 py-1 bg-white">
                  الدرجة: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / {generatedDoc.totalMarks || 20}
                </div>
              </div>
            )}

            {/* 3. Document Content Body */}
            {docType === 'worksheet' ? (
              <div className="space-y-4 text-sm leading-relaxed">
                {generatedDoc.sections?.map((sec: any, sIdx: number) => (
                  <div key={sIdx} className="break-inside-avoid border-b border-slate-300 pb-3">
                    <div className="flex justify-between items-center bg-slate-100 px-3 py-1.5 font-black border-r-4 border-black text-xs mb-2">
                      <span>{sec.sectionTitle}</span>
                      <span>({sec.marks} درجات)</span>
                    </div>

                    <div className="space-y-2 pr-2">
                      {sec.items?.map((item: any, iIdx: number) => (
                        <div key={iIdx} className="space-y-1">
                          <div className="flex items-start justify-between gap-2 font-bold text-xs">
                            <span className="flex-1">
                              {item.questionNumber || iIdx + 1}) {item.questionText}
                            </span>
                            <span className="text-[11px] font-normal text-slate-600">
                              [{item.marks || 2} درجة]
                            </span>
                          </div>

                          {item.options && item.options.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-4 text-xs font-medium pt-1">
                              {item.options.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className="border border-slate-300 rounded px-2 py-1 bg-white">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          {!item.options && (
                            <div className="pr-4 pt-1 space-y-1.5 text-slate-400 text-xs">
                              <div className="border-b border-dashed border-slate-400 h-4"></div>
                              <div className="border-b border-dashed border-slate-400 h-4"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {generatedDoc.motivationalQuote && (
                  <div className="text-center text-xs font-bold italic pt-2 text-slate-700">
                    ✨ {generatedDoc.motivationalQuote} ✨
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs leading-relaxed">
                <div className="grid grid-cols-2 gap-2 border border-black p-2 bg-slate-50 font-bold">
                  <div>عنوان الدرس: {lessonTitle}</div>
                  <div>الوحدة: {unitName || 'العامة'}</div>
                  <div>المادة: {subjectName}</div>
                  <div>الصف: {selectedGrade}</div>
                </div>

                <div className="border border-black">
                  <div className="bg-slate-200 font-black p-1.5 text-center border-b border-black">
                    الأهداف السلوكية والإجرائية المتوقعة
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black text-[11px] p-2">
                    <div>
                      <div className="font-bold underline mb-1">أهداف معرفية:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {generatedDoc.objectives?.cognitive?.map((obj: string, idx: number) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="px-2">
                      <div className="font-bold underline mb-1">أهداف مهارية:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {generatedDoc.objectives?.skillful?.map((obj: string, idx: number) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="px-2">
                      <div className="font-bold underline mb-1">أهداف وجدانية:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {generatedDoc.objectives?.emotional?.map((obj: string, idx: number) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border border-black p-2">
                  <div>
                    <span className="font-bold underline">استراتيجيات التدريس:</span>{' '}
                    <span>{generatedDoc.teachingStrategies?.join(' - ')}</span>
                  </div>
                  <div>
                    <span className="font-bold underline">الوسائل ومصادر التعلم:</span>{' '}
                    <span>{generatedDoc.teachingAids?.join(' - ')}</span>
                  </div>
                </div>

                <div className="border border-black">
                  <div className="bg-slate-200 font-black p-1.5 text-center border-b border-black">
                    سير الحصة وإجراءات التدريس
                  </div>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black font-bold text-center">
                        <th className="p-1.5 border-l border-black w-1/4">المرحلة والزمن</th>
                        <th className="p-1.5 border-l border-black w-3/8">دور المعلم والأنشطة</th>
                        <th className="p-1.5 w-3/8">دور المتعلم والمشاركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {generatedDoc.lessonStages?.map((stage: any, idx: number) => (
                        <tr key={idx} className="align-top">
                          <td className="p-1.5 border-l border-black font-bold bg-slate-50">{stage.stageName}</td>
                          <td className="p-1.5 border-l border-black">{stage.teacherRole}</td>
                          <td className="p-1.5">{stage.studentRole}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-2 border border-black p-2 bg-slate-50 font-bold text-[11px]">
                  <div>الواجب المنزلي: {generatedDoc.homework}</div>
                  <div>التقويم والملاحظات: {generatedDoc.selfEvaluation}</div>
                </div>
              </div>
            )}

            {/* 4. Official Signatures Footer */}
            <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-4 text-center text-xs font-bold gap-2">
              <div>
                <div>معلم المادة</div>
                <div className="mt-6 text-slate-400">....................</div>
              </div>
              <div>
                <div>المشرف / الموجه الفني</div>
                <div className="mt-6 text-slate-400">....................</div>
              </div>
              <div>
                <div>وكيل شؤون الطلاب</div>
                <div className="mt-6 text-slate-400">....................</div>
              </div>
              <div>
                <div>مدير المدرسة (الخاتم)</div>
                <div className="mt-6 text-slate-400">....................</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print,
          aside,
          header,
          nav,
          #teacher-topbar,
          #main-content > header {
            display: none !important;
          }

          main,
          #main-content {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .a4-print-container {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          .a4-page {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 5mm 8mm !important;
            margin: 0 !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
