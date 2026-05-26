import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { ContentUploader } from '@/components/admin/ContentUploader'

export default async function ContentPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: subjects }, { data: grades }] = await Promise.all([
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase
      .from('grades')
      .select('id, name_ar, grade_number')
      .order('grade_number'),
  ])

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          رفع المحتوى التعليمي
        </h1>
        <p className="mt-1 text-muted-foreground">
          ارفع محتوى تعليمياً وسيقوم الذكاء الاصطناعي بتحويله إلى أسئلة تفاعلية
        </p>
      </div>
      <ContentUploader subjects={subjects || []} grades={grades || []} />
    </div>
  )
}
