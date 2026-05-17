import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { BarChart, Users, FileText, CheckCircle, Target } from 'lucide-react'
import Link from 'next/link'

export default async function TeacherReportsPage({ searchParams }: { searchParams: { exam_id?: string, group_id?: string } }) {
  const profile = await getCurrentProfile()
  const supabase = createClient()
  
  const selectedExamId = searchParams.exam_id
  const selectedGroupId = searchParams.group_id

  // Fetch groups
  const { data: groups } = await supabase
    .from('student_groups')
    .select('id, name_ar')
    .eq('teacher_id', profile.id)

  // Fetch exams
  let examsQuery = supabase
    .from('exams')
    .select('id, title, group_id')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })
    
  if (selectedGroupId) {
    examsQuery = examsQuery.eq('group_id', selectedGroupId)
  }
  const { data: exams } = await examsQuery

  // If an exam is selected, fetch attempts
  let attempts = []
  if (selectedExamId) {
    const { data: fetchedAttempts } = await supabase
      .from('exam_attempts')
      .select('*, students(profiles(full_name))')
      .eq('exam_id', selectedExamId)
      .not('completed_at', 'is', null)
      .order('percentage', { ascending: false })
    
    if (fetchedAttempts) {
      attempts = fetchedAttempts
    }
  }

  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) / attempts.length)
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <BarChart className="w-6 h-6 text-indigo-600" />
          تقارير الأداء والنتائج
        </h1>
        <p className="text-sm text-slate-500 mt-1">تابع أداء طلابك في اختباراتك الخاصة واكتشف نقاط الضعف.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 mb-1.5 block">تصفية حسب المجموعة</label>
          <div className="flex flex-wrap gap-2">
            <Link 
              href={`/teacher/reports`} 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${!selectedGroupId && !selectedExamId ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              الكل
            </Link>
            {groups?.map((group: any) => (
              <Link 
                key={group.id} 
                href={`/teacher/reports?group_id=${group.id}`} 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedGroupId === group.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                {group.name_ar}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 mb-1.5 block">اختر الاختبار لعرض النتائج</label>
          <div className="flex flex-wrap gap-2">
            {exams?.map((exam: any) => (
              <Link 
                key={exam.id} 
                href={`/teacher/reports?exam_id=${exam.id}${selectedGroupId ? `&group_id=${selectedGroupId}` : ''}`} 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedExamId === exam.id ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
              >
                {exam.title}
              </Link>
            ))}
            {(!exams || exams.length === 0) && (
              <div className="text-sm text-slate-400 italic py-2">لا توجد اختبارات في هذه المجموعة.</div>
            )}
          </div>
        </div>
      </div>

      {/* Results view */}
      {selectedExamId ? (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">عدد المحاولات</p>
                <p className="text-2xl font-black text-slate-800">{attempts.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">متوسط الدرجات</p>
                <p className="text-2xl font-black text-slate-800">{averageScore}%</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">أعلى درجة</p>
                <p className="text-2xl font-black text-slate-800">
                  {attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.percentage || 0)) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-slate-800">نتائج الطلاب بالتفصيل</h3>
            </div>
            {attempts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 text-sm">
                    <tr>
                      <th className="p-4 font-bold">اسم الطالب</th>
                      <th className="p-4 font-bold">تاريخ الاختبار</th>
                      <th className="p-4 font-bold">الدرجة النهائية</th>
                      <th className="p-4 font-bold">النسبة المئوية</th>
                      <th className="p-4 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attempts.map((attempt: any) => (
                      <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">
                          {attempt.students?.profiles?.full_name || 'غير معروف'}
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {new Date(attempt.completed_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="p-4 text-sm font-black text-slate-700">
                          {attempt.score} / {attempt.total_score}
                        </td>
                        <td className="p-4">
                          <span className={`font-black text-sm px-2.5 py-1 rounded-md ${
                            (attempt.percentage || 0) >= 85 ? 'bg-emerald-100 text-emerald-700' :
                            (attempt.percentage || 0) >= 50 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {Math.round(attempt.percentage || 0)}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold ${attempt.is_passed ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {attempt.is_passed ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <BarChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold">لا توجد محاولات لهذا الاختبار حتى الآن.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/50 rounded-3xl border border-dashed border-indigo-200 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <FileText className="w-8 h-8 text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-indigo-900 mb-2">اختر اختباراً لعرض نتائجه</h3>
          <p className="text-indigo-600/70 text-sm max-w-md mx-auto">
            قم باختيار أحد الاختبارات من القائمة بالأعلى لترى تفاصيل أداء طلابك والمحاولات التي تمت.
          </p>
        </div>
      )}
    </div>
  )
}
