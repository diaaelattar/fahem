import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { ContentUploader } from '@/components/admin/ContentUploader'

export default async function ContentPage() {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: subjects }, { data: grades }] = await Promise.all([
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-display font-bold">رفع المحتوى التعليمي</h1>
        <p className="text-muted-foreground mt-1">ارفع محتوى تعليمياً وسيقوم الذكاء الاصطناعي بتحويله إلى أسئلة تفاعلية</p>
      </div>
      <ContentUploader subjects={subjects || []} grades={grades || []} />
    </div>
  )
}
