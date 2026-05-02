import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { ExamBuilder } from '@/components/admin/ExamBuilder'

export default async function NewExamPage() {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: subjects }, { data: grades }, { data: semesters }] = await Promise.all([
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">إنشاء اختبار جديد</h1>
        <p className="text-muted-foreground mt-1">اختر الأسئلة من بنك الأسئلة وحدد إعدادات الاختبار</p>
      </div>
      <ExamBuilder
        subjects={subjects || []}
        grades={grades || []}
        semesters={semesters || []}
      />
    </div>
  )
}
