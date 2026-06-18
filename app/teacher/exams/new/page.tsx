// app/teacher/exams/new/page.tsx
import { createClient } from '@/lib/supabase/server'
import { TeacherExamBuilder } from '@/components/teacher/TeacherExamBuilder'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewTeacherExamPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const [
    { data: teacherData },
    { data: subjects },
    { data: grades },
    { data: semesters },
    { data: units },
    { data: lessons },
    { data: groups },
    { data: teacherGradeSubjects },
  ] = await Promise.all([
    supabase
      .from('teachers')
      .select('subject_id')
      .eq('id', profile?.id)
      .maybeSingle(),
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase
      .from('grades')
      .select('id, name_ar, grade_number')
      .order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
    supabase
      .from('units')
      .select('id, name_ar, subject_id, grade_id, semester_id')
      .order('sort_order'),
    supabase.from('lessons').select('id, name_ar, unit_id').order('sort_order'),
    supabase
      .from('student_groups')
      .select('id, name_ar')
      .eq('teacher_id', profile?.id)
      .order('created_at'),
    // جلب المواد المرتبطة بالمعلم كاحتياطي إذا كانت subject_id فارغة
    supabase
      .from('teacher_grade_subjects')
      .select('subject_id')
      .eq('teacher_id', profile?.id)
      .limit(1)
      .maybeSingle(),
  ])

  // استخدام subject_id من teachers أولاً، ثم من teacher_grade_subjects كاحتياطي
  const resolvedSubjectId =
    teacherData?.subject_id?.toString() ||
    teacherGradeSubjects?.subject_id?.toString() ||
    ''

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/teacher/exams"
          className="rounded-xl bg-white p-2 shadow-sm transition-colors hover:bg-slate-200"
        >
          <ArrowRight className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            إنشاء اختبار جديد لمجموعة
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            اختر المجموعة الدراسية، وحدد الأسئلة من بنك المنصة بكل سهولة
          </p>
        </div>
      </div>

      {/* Builder */}
      <TeacherExamBuilder
        teacherSubjectId={resolvedSubjectId}
        subjects={subjects || []}
        grades={grades || []}
        semesters={semesters || []}
        units={units || []}
        lessons={lessons || []}
        groups={groups || []}
      />
    </div>
  )
}
