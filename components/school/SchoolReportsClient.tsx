'use client'

import { useState } from 'react'
import {
  FileText,
  TrendingUp,
  Percent,
  Award,
  BookOpen,
  Download,
  Users,
  ChevronUp,
  ChevronDown,
  Search,
  GraduationCap,
  BarChart3
} from 'lucide-react'

interface StudentPerf {
  id: string
  name: string
  email: string
  totalAttempts: number
  passedAttempts: number
  avgPercentage: number
}

interface ExamPerf {
  title: string
  totalAttempts: number
  passedAttempts: number
  avgPercentage: number
}

interface TeacherPerf {
  id: string
  name: string
  examCount: number
  totalAttempts: number
  passedAttempts: number
  avgPercentage: number
}

interface ClassPerf {
  id: string
  name: string
  studentCount: number
  avgPercentage: number
  passRate: number
}

interface SchoolReportsClientProps {
  totalAttempts: number
  passRate: number
  averagePercentage: number
  studentPerformance: StudentPerf[]
  examPerformance: ExamPerf[]
  teacherPerformance?: TeacherPerf[]
  classPerformance?: ClassPerf[]
}

export function SchoolReportsClient({
  totalAttempts,
  passRate,
  averagePercentage,
  studentPerformance,
  examPerformance,
  teacherPerformance = [],
  classPerformance = [],
}: SchoolReportsClientProps) {
  const [activeTab, setActiveTab] = useState<'exams' | 'students' | 'teachers' | 'classes'>('exams')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'avgPercentage' | 'totalAttempts'>('avgPercentage')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: 'avgPercentage' | 'totalAttempts') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filteredStudents = studentPerformance
    .filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const diff = a[sortField] - b[sortField]
      return sortDir === 'asc' ? diff : -diff
    })

  const filteredExams = examPerformance
    .filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const diff = a[sortField] - b[sortField]
      return sortDir === 'asc' ? diff : -diff
    })

  // تصدير CSV
  const exportStudentsCSV = () => {
    const header = 'اسم الطالب,البريد الإلكتروني,إجمالي المحاولات,المحاولات الناجحة,متوسط النسبة\n'
    const rows = filteredStudents.map((s) =>
      `"${s.name}","${s.email}",${s.totalAttempts},${s.passedAttempts},${s.avgPercentage}%`
    ).join('\n')
    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `تقرير-الطلاب-${new Date().toLocaleDateString('ar-EG')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExamsCSV = () => {
    const header = 'عنوان الامتحان,إجمالي المحاولات,المحاولات الناجحة,متوسط النسبة\n'
    const rows = filteredExams.map((e) =>
      `"${e.title}",${e.totalAttempts},${e.passedAttempts},${e.avgPercentage}%`
    ).join('\n')
    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `تقرير-الامتحانات-${new Date().toLocaleDateString('ar-EG')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }: { field: 'avgPercentage' | 'totalAttempts' }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-cyan-400" />
      : <ChevronDown className="h-3 w-3 text-cyan-400" />
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* الترويسة */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white">التقارير والإحصائيات التحليلية</h2>
        <p className="text-xs text-slate-400 mt-1">
          تتبع مؤشرات النجاح والأداء وتفاعل الطلاب مع الامتحانات على مستوى الفرد والمدرسة.
        </p>
      </div>

      {/* بطاقات المؤشرات العامة للتقارير */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5" role="region" aria-label="مؤشرات الأداء الرئيسية">
        {[
          {
            label: 'إجمالي المحاولات',
            value: totalAttempts,
            suffix: '',
            desc: 'اختباراً تم تقديمه من قبل الطلاب',
            color: 'text-cyan-400',
            glowColor: 'bg-cyan-500/5',
            Icon: FileText
          },
          {
            label: 'نسبة النجاح العامة',
            value: passRate,
            suffix: '%',
            desc: 'من إجمالي الطلاب الذين تجاوزوا الدرجة المطلوبة',
            color: 'text-emerald-400',
            glowColor: 'bg-emerald-500/5',
            Icon: Percent
          },
          {
            label: 'متوسط درجات المدرسة',
            value: averagePercentage,
            suffix: '%',
            desc: 'معدل التحصيل الدراسي الكلي لجميع الطلاب',
            color: 'text-indigo-400',
            glowColor: 'bg-indigo-500/5',
            Icon: Award
          }
        ].map(({ label, value, suffix, desc, color, glowColor, Icon }) => (
          <div key={label} className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl relative overflow-hidden">
            <div className={`absolute top-[-30%] left-[-20%] w-32 h-32 rounded-full ${glowColor} blur-2xl pointer-events-none`} aria-hidden="true" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={`text-3xl font-extrabold ${color} tracking-tight`}>
                  {value}{suffix}
                </div>
                <span className="text-[10px] text-slate-500 block">{desc}</span>
              </div>
              <div className={`h-10 w-10 bg-slate-950/40 rounded-xl flex items-center justify-center border border-white/5 ${color}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* الجداول التفصيلية */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl overflow-hidden">
        {/* التبويبات */}
        <div className="flex border-b border-slate-900">
          <button
            onClick={() => { setActiveTab('exams'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-bold transition-colors ${
              activeTab === 'exams'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-selected={activeTab === 'exams'}
            role="tab"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            أداء الامتحانات
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">{examPerformance.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab('students'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-bold transition-colors ${
              activeTab === 'students'
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-950/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-selected={activeTab === 'students'}
            role="tab"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            أداء الطلاب الفردي
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">{studentPerformance.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab('teachers'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-bold transition-colors ${
              activeTab === 'teachers'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-selected={activeTab === 'teachers'}
            role="tab"
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            تقرير المعلمين
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">{teacherPerformance.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab('classes'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-bold transition-colors ${
              activeTab === 'classes'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-950/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-selected={activeTab === 'classes'}
            role="tab"
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            مقارنة الفصول
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">{classPerformance.length}</span>
          </button>
        </div>

        {/* شريط البحث والتصدير */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-900/60">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'exams' ? 'بحث باسم الامتحان...' : 'بحث باسم الطالب...'}
              className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 border border-slate-800 rounded-xl pl-4 pr-9 py-2.5 text-sm focus:border-cyan-500 focus:outline-none"
              aria-label={activeTab === 'exams' ? 'بحث في الامتحانات' : 'بحث في الطلاب'}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
          </div>
          <button
            onClick={activeTab === 'exams' ? exportExamsCSV : exportStudentsCSV}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            aria-label={`تصدير تقرير ${activeTab === 'exams' ? 'الامتحانات' : 'الطلاب'} كملف CSV`}
          >
            <Download className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            تصدير CSV
          </button>
        </div>

        {/* جدول أداء الامتحانات */}
        {activeTab === 'exams' && (
          <div className="overflow-x-auto">
            {filteredExams.length > 0 ? (
              <table className="w-full text-right text-xs" role="table" aria-label="جدول أداء الامتحانات">
                <thead className="bg-slate-900/40 text-slate-400 font-bold">
                  <tr className="border-b border-slate-900">
                    <th className="p-4 font-semibold" scope="col">عنوان الامتحان</th>
                    <th
                      className="p-4 text-center font-semibold cursor-pointer hover:text-slate-200 select-none"
                      onClick={() => handleSort('totalAttempts')}
                      scope="col"
                    >
                      <span className="flex items-center justify-center gap-1">
                        المحاولات <SortIcon field="totalAttempts" />
                      </span>
                    </th>
                    <th
                      className="p-4 text-center font-semibold cursor-pointer hover:text-slate-200 select-none"
                      onClick={() => handleSort('avgPercentage')}
                      scope="col"
                    >
                      <span className="flex items-center justify-center gap-1">
                        متوسط النسبة <SortIcon field="avgPercentage" />
                      </span>
                    </th>
                    <th className="p-4 text-right font-semibold" scope="col">مستوى الأداء</th>
                    <th className="p-4 text-left font-semibold" scope="col">التوصية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {filteredExams.map((exam, idx) => {
                    const passRate = exam.totalAttempts > 0
                      ? Math.round((exam.passedAttempts / exam.totalAttempts) * 100)
                      : 0
                    const isGood = exam.avgPercentage >= 70
                    return (
                      <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 font-semibold text-white max-w-[200px]">
                          <span className="truncate block">{exam.title}</span>
                        </td>
                        <td className="p-4 text-center">{exam.totalAttempts} طلاب</td>
                        <td className="p-4 text-center">
                          <span className={`font-bold text-sm ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {exam.avgPercentage}%
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isGood ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${exam.avgPercentage}%` }}
                                aria-label={`نسبة الأداء ${exam.avgPercentage}%`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">{passRate}% نجاح</span>
                          </div>
                        </td>
                        <td className="p-4 text-left text-slate-500 text-[10px]">
                          {isGood ? 'أداء ممتاز، ينصح بالمتابعة.' : 'أداء متوسط، ينصح بإعادة مراجعة المفاهيم الأساسية.'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500" role="status">
                <BookOpen className="h-10 w-10 text-slate-800 mb-2" aria-hidden="true" />
                <span className="text-xs">لم يتم رصد أي امتحانات مطابقة للبحث.</span>
              </div>
            )}
          </div>
        )}

        {/* جدول تقرير المعلمين */}
        {activeTab === 'teachers' && (
          <div className="overflow-x-auto">
            {teacherPerformance.length > 0 ? (
              <table className="w-full text-right text-xs" role="table" aria-label="جدول تقرير المعلمين">
                <thead className="bg-slate-900/40 text-slate-400 font-bold">
                  <tr className="border-b border-slate-900">
                    <th className="p-4" scope="col">اسم المعلم</th>
                    <th className="p-4 text-center" scope="col">عدد الامتحانات</th>
                    <th className="p-4 text-center" scope="col">إجمالي المحاولات</th>
                    <th className="p-4 text-center" scope="col">متوسط النسبة</th>
                    <th className="p-4 text-left" scope="col">مستوى الأداء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {teacherPerformance.map((teacher) => {
                    const isGood = teacher.avgPercentage >= 70
                    const tPassRate = teacher.totalAttempts > 0
                      ? Math.round((teacher.passedAttempts / teacher.totalAttempts) * 100)
                      : 0
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                              {teacher.name.charAt(0)}
                            </div>
                            {teacher.name}
                          </div>
                        </td>
                        <td className="p-4 text-center">{teacher.examCount} امتحان</td>
                        <td className="p-4 text-center">{teacher.totalAttempts} محاولة</td>
                        <td className="p-4 text-center">
                          <span className={`font-bold text-sm ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {teacher.avgPercentage}%
                          </span>
                        </td>
                        <td className="p-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${teacher.avgPercentage}%` }}
                                aria-label={`نسبة أداء ${teacher.avgPercentage}%`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">{tPassRate}% نجاح</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500" role="status">
                <GraduationCap className="h-10 w-10 text-slate-800 mb-2" aria-hidden="true" />
                <span className="text-xs">لا توجد بيانات معلمين بعد.</span>
              </div>
            )}
          </div>
        )}

        {/* مقارنة الفصول — Bar Chart بصري */}
        {activeTab === 'classes' && (
          <div className="p-6">
            {classPerformance.length > 0 ? (
              <div className="space-y-4" role="list" aria-label="مقارنة أداء الفصول">
                {classPerformance
                  .sort((a, b) => b.avgPercentage - a.avgPercentage)
                  .map((cls) => (
                    <div key={cls.id} className="flex items-center gap-4" role="listitem">
                      <div className="w-28 text-xs font-bold text-slate-300 truncate text-right shrink-0">
                        {cls.name}
                      </div>
                      <div className="flex-1 relative">
                        <div className="w-full h-7 bg-slate-900 rounded-xl overflow-hidden">
                          <div
                            className={`h-full rounded-xl flex items-center justify-end pr-2 text-[10px] font-bold text-white transition-all duration-500 ${
                              cls.avgPercentage >= 80 ? 'bg-emerald-600' :
                              cls.avgPercentage >= 60 ? 'bg-cyan-600' :
                              cls.avgPercentage >= 40 ? 'bg-amber-600' : 'bg-rose-600'
                            }`}
                            style={{ width: `${Math.max(cls.avgPercentage, 5)}%` }}
                            aria-label={`فصل ${cls.name}: متوسط ${cls.avgPercentage}%`}
                          >
                            {cls.avgPercentage}%
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 w-20 shrink-0 text-left">
                        {cls.studentCount} طالب | {cls.passRate}% نجاح
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500" role="status">
                <BarChart3 className="h-10 w-10 text-slate-800 mb-2" aria-hidden="true" />
                <span className="text-xs">لا توجد فصول للمقارنة بعد.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
