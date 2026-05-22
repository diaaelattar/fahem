// app/admin/exams/new/page.tsx
// Server Component — يجلب البيانات الثابتة من Supabase على الخادم ويمررها للـ ExamBuilder
import { createClient } from '@/lib/supabase/server'
import { ExamBuilder } from '@/components/admin/ExamBuilder'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewExamPage() {
  const supabase = await createClient()

  const [
    { data: subjects },
    { data: grades },
    { data: semesters },
    { data: units },
    { data: lessons },
  ] = await Promise.all([
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
    supabase.from('units').select('id, name_ar, subject_id, grade_id, semester_id').eq('is_active', true).order('sort_order'),
    supabase.from('lessons').select('id, name_ar, unit_id').eq('is_active', true).order('sort_order'),
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/exams" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold">إنشاء اختبار جديد</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            حدد نوع الاختبار والمنهج، ثم اختر الأسئلة من البنك بالفلاتر الذكية
          </p>
        </div>
      </div>

      {/* Builder */}
      <ExamBuilder
        subjects={subjects || []}
        grades={grades || []}
        semesters={semesters || []}
        units={units || []}
        lessons={lessons || []}
      />
    </div>
  )
}
