import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import {
  Users,
  ArrowRight,
  TrendingUp,
  Calendar,
  CheckCircle,
  BookOpen,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { AddStudentForm } from './AddStudentForm'
import { SessionsTab } from './SessionsTab'

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // Fetch group + verify ownership
  const { data: group } = await supabase
    .from('student_groups')
    .select('*, grades(name_ar)')
    .eq('id', params.id)
    .eq('teacher_id', profile.id)
    .maybeSingle()

  if (!group) notFound()

  // Fetch students in this group
  const { data: groupStudents } = await supabase
    .from('group_students')
    .select(
      `
      id, joined_at, status,
      student_id,
      students:student_id (
        id,
        student_code,
        profiles(full_name, email, avatar_url)
      )
    `
    )
    .eq('group_id', params.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  // Fetch exams for this group
  const { data: exams } = await supabase
    .from('exams')
    .select(
      'id, title, is_published, created_at, questions_count, attempts_count, avg_score'
    )
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
  const publishedExams = exams?.filter((e) => e.is_published).length || 0
  const avgGroupScore =
    exams && exams.length > 0
      ? Math.round(
          exams.reduce((s, e) => s + (e.avg_score || 0), 0) / exams.length
        )
      : 0
  const totalSessions = sessions?.length || 0

  return (
    <div className="animate-fade-in space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/teacher/groups"
          className="font-medium transition-colors hover:text-indigo-600"
        >
          المجموعات
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="font-bold text-slate-800">{group.name_ar}</span>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-600 to-purple-700 p-7 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-sm font-medium text-indigo-200">
              {group.grades?.name_ar || 'كل المراحل'}
            </p>
            <h1 className="text-3xl font-black">{group.name_ar}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">
                كود الدعوة: {group.invite_code}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${group.is_active ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}
              >
                {group.is_active ? '● نشطة' : '● موقوفة'}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href={`/teacher/exams/new?group_id=${group.id}`}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-bold text-indigo-700 transition-colors hover:bg-indigo-50"
            >
              <BookOpen className="h-4 w-4" />
              اختبار جديد
            </Link>
            <Link
              href={`/teacher/groups/${group.id}/edit`}
              className="rounded-xl bg-white/20 px-5 py-2.5 font-bold transition-colors hover:bg-white/30"
            >
              تعديل
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          {
            icon: Users,
            label: 'الطلاب',
            value: totalStudents,
            bg: 'bg-blue-50',
            text: 'text-blue-600',
          },
          {
            icon: BookOpen,
            label: 'الاختبارات',
            value: totalExams,
            bg: 'bg-indigo-50',
            text: 'text-indigo-600',
          },
          {
            icon: CheckCircle,
            label: 'منشور',
            value: publishedExams,
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
          },
          {
            icon: Calendar,
            label: 'الحصص',
            value: totalSessions,
            bg: 'bg-violet-50',
            text: 'text-violet-600',
          },
          {
            icon: TrendingUp,
            label: 'متوسط الأداء',
            value: `${avgGroupScore}%`,
            bg: 'bg-amber-50',
            text: 'text-amber-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
          >
            <div
              className={`h-10 w-10 ${stat.bg} flex shrink-0 items-center justify-center rounded-xl`}
            >
              <stat.icon className={`h-5 w-5 ${stat.text}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">{stat.label}</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Users className="h-5 w-5 text-indigo-500" />
              طلاب المجموعة ({totalStudents})
            </h2>
            <AddStudentForm groupId={group.id} />
          </div>

          {/* Login info banner */}
          <div className="mx-4 mb-2 mt-4 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p className="text-xs leading-relaxed text-blue-700">
              الطلاب المضافون يدخلون عبر{' '}
              <a
                href="/auth/student-login"
                target="_blank"
                className="font-bold underline hover:text-blue-900"
              >
                رابط دخول الطالب بالكود
              </a>{' '}
              — أرسل لكل طالب الكود الخاص به (STU-…) من القائمة أدناه.
            </p>
          </div>

          {groupStudents && groupStudents.length > 0 ? (
            <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {groupStudents.map((gs: any, i) => {
                const student = gs.students
                const studentProfile = student?.profiles
                const isTempEmail =
                  studentProfile?.email?.includes('@istabaq-temp.com')
                return (
                  <div
                    key={gs.id}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50"
                  >
                    <span className="w-6 shrink-0 text-xs font-bold text-slate-400">
                      {i + 1}
                    </span>
                    <img
                      src={
                        studentProfile?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${studentProfile?.full_name || 'U'}`
                      }
                      alt={studentProfile?.full_name}
                      className="h-9 w-9 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {studentProfile?.full_name || 'طالب'}
                      </p>
                      {isTempEmail ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          يدخل بالكود فقط
                        </span>
                      ) : (
                        <p className="truncate text-xs text-slate-400">
                          {studentProfile?.email}
                        </p>
                      )}
                    </div>
                    {/* Student Code Badge */}
                    {student?.student_code && (
                      <span className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-mono text-xs font-black tracking-widest text-indigo-700">
                        {student.student_code}
                      </span>
                    )}
                    <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(gs.joined_at).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="mb-1 font-bold">لا يوجد طلاب بعد</p>
              <p className="text-sm">
                شارك كود الدعوة{' '}
                <strong className="text-indigo-600">{group.invite_code}</strong>{' '}
                مع طلابك
              </p>
            </div>
          )}
        </div>

        {/* Exams List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <BookOpen className="h-5 w-5 text-emerald-500" />
              اختبارات المجموعة ({totalExams})
            </h2>
            <Link
              href={`/teacher/exams/new?group_id=${group.id}`}
              className="text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-800"
            >
              + اختبار جديد
            </Link>
          </div>
          {exams && exams.length > 0 ? (
            <div className="max-h-[400px] divide-y divide-border overflow-y-auto">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {exam.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>{exam.questions_count || 0} سؤال</span>
                        <span>{exam.attempts_count || 0} محاولة</span>
                        {(exam.attempts_count || 0) > 0 && (
                          <span className="font-bold text-indigo-500">
                            متوسط {Math.round(exam.avg_score || 0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${exam.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {exam.is_published ? 'منشور' : 'مسودة'}
                      </span>
                      <Link
                        href={`/teacher/reports?exam_id=${exam.id}&group_id=${params.id}`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        النتائج
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="mb-1 font-bold">لا يوجد اختبارات بعد</p>
              <Link
                href={`/teacher/exams/new?group_id=${group.id}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                أنشئ أول اختبار لهذه المجموعة
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
