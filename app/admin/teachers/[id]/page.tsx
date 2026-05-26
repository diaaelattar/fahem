import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import {
  GraduationCap,
  ArrowRight,
  Users,
  BookOpen,
  BarChart2,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { TeacherVerifyActions } from './TeacherVerifyActions'

export default async function AdminTeacherDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select(
      '*, profiles(full_name, email, avatar_url, created_at, is_active), subjects!teachers_subject_id_fkey(name_ar, icon)'
    )
    .eq('id', params.id)
    .single()

  if (!teacher) notFound()

  const [{ data: groups }, { data: exams }] = await Promise.all([
    supabase
      .from('student_groups')
      .select('id, name_ar, invite_code, is_active, group_students(count)')
      .eq('teacher_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('exams')
      .select(
        'id, title, is_published, created_at, questions_count, attempts_count, avg_score'
      )
      .eq('teacher_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  const totalStudents = (groups || []).reduce(
    (s: number, g: any) => s + (g.group_students[0]?.count || 0),
    0
  )
  const publishedExams = (exams || []).filter((e: any) => e.is_published).length

  return (
    <div className="max-w-5xl space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/admin/teachers"
          className="font-medium transition-colors hover:text-indigo-600"
        >
          المعلمون
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="font-bold text-slate-800">
          {(teacher.profiles as any)?.full_name}
        </span>
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-600 to-purple-700 p-7 text-white">
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <img
              src={
                (teacher.profiles as any)?.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${(teacher.profiles as any)?.full_name || 'T'}`
              }
              className="h-20 w-20 rounded-2xl border-4 border-white/30 object-cover"
              alt=""
            />
            <div>
              <p className="text-sm font-medium text-indigo-200">
                {(teacher.subjects as any)?.icon}{' '}
                {(teacher.subjects as any)?.name_ar || 'غير محدد'}
              </p>
              <h1 className="text-3xl font-black">
                {(teacher.profiles as any)?.full_name}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-indigo-300" />
                <span className="text-sm text-indigo-200" dir="ltr">
                  {(teacher.profiles as any)?.email}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${teacher.is_verified ? 'bg-emerald-400/30 text-emerald-100' : 'bg-orange-400/30 text-orange-100'}`}
                >
                  {teacher.is_verified ? '✓ موثّق' : '⏳ بانتظار التوثيق'}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${(teacher.profiles as any)?.is_active ? 'bg-blue-400/30 text-blue-100' : 'bg-red-400/30 text-red-100'}`}
                >
                  {(teacher.profiles as any)?.is_active ? '● نشط' : '● موقوف'}
                </span>
              </div>
            </div>
          </div>
          <TeacherVerifyActions
            teacherId={params.id}
            isVerified={teacher.is_verified}
            isActive={!!(teacher.profiles as any)?.is_active}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: 'مجموعات',
            value: groups?.length || 0,
            icon: Users,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'طلاب',
            value: totalStudents,
            icon: Users,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            label: 'اختبارات',
            value: exams?.length || 0,
            icon: BookOpen,
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            label: 'منشور',
            value: publishedExams,
            icon: CheckCircle,
            color: 'text-emerald-600 bg-emerald-50',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <div
              className={`h-12 w-12 ${s.color} flex shrink-0 items-center justify-center rounded-xl`}
            >
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">{s.label}</p>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Groups */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Users className="h-5 w-5 text-blue-500" />
              مجموعاته ({groups?.length || 0})
            </h2>
          </div>
          {groups && groups.length > 0 ? (
            <div className="max-h-72 divide-y divide-border overflow-y-auto">
              {groups.map((g: any) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="text-sm font-bold">{g.name_ar}</p>
                    <p className="text-xs text-muted-foreground">
                      كود:{' '}
                      <span className="font-mono font-bold text-indigo-600">
                        {g.invite_code}
                      </span>{' '}
                      • {g.group_students[0]?.count || 0} طالب
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${g.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {g.is_active ? 'نشطة' : 'موقوفة'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              لا توجد مجموعات بعد
            </div>
          )}
        </div>

        {/* Exams */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              اختباراته ({exams?.length || 0})
            </h2>
          </div>
          {exams && exams.length > 0 ? (
            <div className="max-h-72 divide-y divide-border overflow-y-auto">
              {exams.map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="text-sm font-bold">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.questions_count || 0} سؤال • {e.attempts_count || 0}{' '}
                      محاولة{' '}
                      {(e.attempts_count || 0) > 0 &&
                        `• متوسط ${Math.round(e.avg_score || 0)}%`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${e.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {e.is_published ? 'منشور' : 'مسودة'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              لا توجد اختبارات بعد
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
