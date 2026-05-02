// app/admin/students/[id]/page.tsx
// تعديل بيانات طالب موجود

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import StudentEditClient from './_client'

interface Props {
  params: { id: string }
}

export default async function EditStudentPage({ params }: Props) {
  await requireAdmin()
  const supabase = createClient()

  const [
    { data: student },
    { data: grades },
    { data: attempts },
  ] = await Promise.all([
    supabase
      .from('students')
      .select(`
        id, grade_id, class_section, parent_phone, student_code, enrollment_date,
        profiles(full_name, email, is_active, created_at)
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    supabase
      .from('exam_attempts')
      .select('id, score, percentage, is_passed, completed_at, exams(title)')
      .eq('student_id', params.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10),
  ])

  if (!student) notFound()

  return (
    <StudentEditClient
      student={student as any}
      grades={grades || []}
      attempts={attempts || []}
    />
  )
}
