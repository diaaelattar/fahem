import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { Users, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GroupsClient } from './GroupsClient'

export default async function TeacherGroupsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('student_groups')
    .select('*, group_students(count), grades(name_ar)')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-800">
            <Users className="h-6 w-6 text-indigo-600" />
            مجموعات الطلاب
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            أدر مجموعاتك الخاصة وشارك أكواد الانضمام مع طلابك.
          </p>
        </div>
        <Link
          href="/teacher/groups/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
        >
          <PlusCircle className="h-5 w-5" />
          مجموعة جديدة
        </Link>
      </div>

      {/* Interactive Groups Grid */}
      <GroupsClient groups={(groups as any) || []} />
    </div>
  )
}
