import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import { StudentEditForm } from '@/components/admin/StudentEditForm'

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: student }, { data: grades }, { data: attempts }] = await Promise.all([
    supabase.from('students').select('*, profiles(full_name, email, is_active), grades(name_ar)').eq('id', params.id).single(),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    supabase.from('exam_attempts')
      .select('id, score, percentage, is_passed, completed_at, exams(title)')
      .eq('student_id', params.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10),
  ])

  if (!student) notFound()

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">{(student.profiles as any)?.full_name}</h1>
          <p className="text-muted-foreground mt-1">{(student.profiles as any)?.email} • {(student.grades as any)?.name_ar}</p>
        </div>
        <StudentEditForm student={student} grades={grades || []} />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden h-fit">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold">آخر النتائج</h2>
          <p className="text-xs text-muted-foreground">{attempts?.length || 0} اختبار</p>
        </div>
        <div className="divide-y divide-border">
          {attempts && attempts.length > 0 ? attempts.map((a: any) => (
            <div key={a.id} className="px-5 py-3 flex items-center justify-between">
              <p className="text-xs truncate flex-1 ml-2">{a.exams?.title}</p>
              <span className={`text-sm font-bold shrink-0 ${a.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                {a.percentage?.toFixed(0)}٪
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">لا توجد نتائج بعد</div>
          )}
        </div>
      </div>
    </div>
  )
}
