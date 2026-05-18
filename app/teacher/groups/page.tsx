import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { Users, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { GroupsClient } from './GroupsClient'

export default async function TeacherGroupsPage() {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  const { data: groups } = await supabase
    .from('student_groups')
    .select('*, group_students(count), grades(name_ar)')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            مجموعات الطلاب
          </h1>
          <p className="text-sm text-slate-500 mt-1">أدر مجموعاتك الخاصة وشارك أكواد الانضمام مع طلابك.</p>
        </div>
        <Link
          href="/teacher/groups/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          مجموعة جديدة
        </Link>
      </div>

      {/* Interactive Groups Grid */}
      <GroupsClient groups={(groups as any) || []} />
    </div>
  )
}
