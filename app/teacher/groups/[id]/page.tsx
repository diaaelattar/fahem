import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Users, ArrowRight, TrendingUp, Calendar, CheckCircle, BookOpen, Info } from 'lucide-react'
import Link from 'next/link'
import { AddStudentForm } from './AddStudentForm'
import { SessionsTab } from './SessionsTab'

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  // Fetch group + verify ownership
  const { data: group } = await supabase
    .from('student_groups')
    .select('*, grades(name_ar)')
    .eq('id', params.id)
    .eq('teacher_id', profile.id)
    .single()

  if (!group) notFound()

  // Fetch students in this group
  const { data: groupStudents } = await supabase
    .from('group_students')
    .select(`
      id, joined_at, status,
      student_id,
      students:student_id (
        id,
        student_code,
        profiles(full_name, email, avatar_url)
      )
    `)
    .eq('group_id', params.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  // Fetch exams for this group
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, is_published, created_at, questions_count, attempts_count, avg_score')
    .eq('group_id', params.id)
    .order('created_at', { ascending: false })

  // Fetch sessions for this group
  const { data: sessions } = await supabase
    .from('group_sessions')
    .select('*')
    .eq('group_id', params.id)
    .order('scheduled_at', { ascending: false })

  // Stats
  const totalStudents = groupStudents?.length || 0
  const totalExams = exams?.length || 0
  const publishedExams = exams?.filter(e => e.is_published).length || 0
  const avgGroupScore = exams && exams.length > 0
    ? Math.round(exams.reduce((s, e) => s + (e.avg_score || 0), 0) / exams.length)
    : 0
  const totalSessions = sessions?.length || 0

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/teacher/groups" className="hover:text-indigo-600 transition-colors font-medium">
          المجموعات
        </Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="font-bold text-slate-800">{group.name_ar}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-purple-700 rounded-3xl p-7 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">{group.grades?.name_ar || 'كل المراحل'}</p>
            <h1 className="text-3xl font-black">{group.name_ar}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-bold">
                كود الدعوة: {group.invite_code}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${group.is_active ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}>
                {group.is_active ? '● نشطة' : '● موقوفة'}
              </span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href={`/teacher/exams/new?group_id=${group.id}`}
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
              <BookOpen className="w-4 h-4" />
              اختبار جديد
            </Link>
            <Link href={`/teacher/groups/${group.id}/edit`}
              className="bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl font-bold transition-colors">
              تعديل
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Users, label: 'الطلاب', value: totalStudents, bg: 'bg-blue-50', text: 'text-blue-600' },
          { icon: BookOpen, label: 'الاختبارات', value: totalExams, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { icon: CheckCircle, label: 'منشور', value: publishedExams, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { icon: Calendar, label: 'الحصص', value: totalSessions, bg: 'bg-violet-50', text: 'text-violet-600' },
          { icon: TrendingUp, label: 'متوسط الأداء', value: `${avgGroupScore}%`, bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.text}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">{stat.label}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sessions Tab - Full Width */}
      <SessionsTab
        groupId={group.id}
        sessions={(sessions || []) as any}
        groupStudents={(groupStudents || []) as any}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Students List */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              طلاب المجموعة ({totalStudents})
            </h2>
            <AddStudentForm groupId={group.id} />
          </div>

          {/* Login info banner */}
          <div className="mx-4 mt-4 mb-2 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              الطلاب المضافون يدخلون عبر{' '}
              <a href="/auth/student-login" target="_blank" className="font-bold underline hover:text-blue-900">
                رابط دخول الطالب بالكود
              </a>
              {' '}— أرسل لكل طالب الكود الخاص به (STU-…) من القائمة أدناه.
            </p>
          </div>

          {groupStudents && groupStudents.length > 0 ? (
            <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
              {groupStudents.map((gs: any, i) => {
                const student = gs.students
                const studentProfile = student?.profiles
                const isTempEmail = studentProfile?.email?.includes('@istabaq-temp.com')
                return (
                  <div key={gs.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-xs text-slate-400 font-bold w-6 shrink-0">{i + 1}</span>
                    <img
                      src={studentProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${studentProfile?.full_name || 'U'}`}
                      alt={studentProfile?.full_name}
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{studentProfile?.full_name || 'طالب'}</p>
                      {isTempEmail ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full mt-0.5">
                          يدخل بالكود فقط
                        </span>
                      ) : (
                        <p className="text-xs text-slate-400 truncate">{studentProfile?.email}</p>
                      )}
                    </div>
                    {/* Student Code Badge */}
                    {student?.student_code && (
                      <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg tracking-widest shrink-0">
                        {student.student_code}
                      </span>
                    )}
                    <div className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(gs.joined_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-bold mb-1">لا يوجد طلاب بعد</p>
              <p className="text-sm">شارك كود الدعوة <strong className="text-indigo-600">{group.invite_code}</strong> مع طلابك</p>
            </div>
          )}
        </div>

        {/* Exams List */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              اختبارات المجموعة ({totalExams})
            </h2>
            <Link href={`/teacher/exams/new?group_id=${group.id}`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              + اختبار جديد
            </Link>
          </div>
          {exams && exams.length > 0 ? (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {exams.map((exam) => (
                <div key={exam.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{exam.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>{exam.questions_count || 0} سؤال</span>
                        <span>{exam.attempts_count || 0} محاولة</span>
                        {(exam.attempts_count || 0) > 0 && (
                          <span className="text-indigo-500 font-bold">متوسط {Math.round(exam.avg_score || 0)}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${exam.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {exam.is_published ? 'منشور' : 'مسودة'}
                      </span>
                      <Link href={`/teacher/reports?exam_id=${exam.id}&group_id=${params.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">
                        النتائج
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500">
              <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-bold mb-1">لا يوجد اختبارات بعد</p>
              <Link href={`/teacher/exams/new?group_id=${group.id}`}
                className="text-sm text-indigo-600 hover:underline">
                أنشئ أول اختبار لهذه المجموعة
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
