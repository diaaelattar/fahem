import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import { GraduationCap, ArrowRight, Users, BookOpen, BarChart2, Calendar, Mail, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { TeacherVerifyActions } from './TeacherVerifyActions'

export default async function AdminTeacherDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, profiles(full_name, email, avatar_url, created_at, is_active), subjects!teachers_subject_id_fkey(name_ar, icon)')
    .eq('id', params.id)
    .single()

  if (!teacher) notFound()

  const [{ data: groups }, { data: exams }] = await Promise.all([
    supabase.from('student_groups').select('id, name_ar, invite_code, is_active, group_students(count)').eq('teacher_id', params.id).order('created_at', { ascending: false }),
    supabase.from('exams').select('id, title, is_published, created_at, questions_count, attempts_count, avg_score').eq('teacher_id', params.id).order('created_at', { ascending: false }),
  ])

  const totalStudents = (groups || []).reduce((s: number, g: any) => s + (g.group_students[0]?.count || 0), 0)
  const publishedExams = (exams || []).filter((e: any) => e.is_published).length

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/teachers" className="hover:text-indigo-600 font-medium transition-colors">المعلمون</Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="font-bold text-slate-800">{(teacher.profiles as any)?.full_name}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-l from-indigo-600 to-purple-700 rounded-3xl p-7 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <img
              src={(teacher.profiles as any)?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${(teacher.profiles as any)?.full_name || 'T'}`}
              className="w-20 h-20 rounded-2xl border-4 border-white/30 object-cover"
              alt=""
            />
            <div>
              <p className="text-indigo-200 text-sm font-medium">{(teacher.subjects as any)?.icon} {(teacher.subjects as any)?.name_ar || 'غير محدد'}</p>
              <h1 className="text-3xl font-black">{(teacher.profiles as any)?.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-indigo-200 text-sm" dir="ltr">{(teacher.profiles as any)?.email}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${teacher.is_verified ? 'bg-emerald-400/30 text-emerald-100' : 'bg-orange-400/30 text-orange-100'}`}>
                  {teacher.is_verified ? '✓ موثّق' : '⏳ بانتظار التوثيق'}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${(teacher.profiles as any)?.is_active ? 'bg-blue-400/30 text-blue-100' : 'bg-red-400/30 text-red-100'}`}>
                  {(teacher.profiles as any)?.is_active ? '● نشط' : '● موقوف'}
                </span>
              </div>
            </div>
          </div>
          <TeacherVerifyActions teacherId={params.id} isVerified={teacher.is_verified} isActive={!!(teacher.profiles as any)?.is_active} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'مجموعات', value: groups?.length || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'طلاب', value: totalStudents, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'اختبارات', value: exams?.length || 0, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'منشور', value: publishedExams, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">{s.label}</p>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Groups */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border"><h2 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />مجموعاته ({groups?.length || 0})</h2></div>
          {groups && groups.length > 0 ? (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {groups.map((g: any) => (
                <div key={g.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{g.name_ar}</p>
                    <p className="text-xs text-muted-foreground">كود: <span className="font-mono font-bold text-indigo-600">{g.invite_code}</span> • {g.group_students[0]?.count || 0} طالب</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{g.is_active ? 'نشطة' : 'موقوفة'}</span>
                </div>
              ))}
            </div>
          ) : <div className="p-10 text-center text-muted-foreground text-sm">لا توجد مجموعات بعد</div>}
        </div>

        {/* Exams */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border"><h2 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" />اختباراته ({exams?.length || 0})</h2></div>
          {exams && exams.length > 0 ? (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {exams.map((e: any) => (
                <div key={e.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.questions_count || 0} سؤال • {e.attempts_count || 0} محاولة {(e.attempts_count || 0) > 0 && `• متوسط ${Math.round(e.avg_score || 0)}%`}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${e.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{e.is_published ? 'منشور' : 'مسودة'}</span>
                </div>
              ))}
            </div>
          ) : <div className="p-10 text-center text-muted-foreground text-sm">لا توجد اختبارات بعد</div>}
        </div>
      </div>
    </div>
  )
}
