import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { ClipboardList, Users, Clock, CheckCircle, Eye, EyeOff, Plus } from 'lucide-react'

export default async function ExamsPage() {
  await requireAdmin()
  const supabase = createClient()

  const { data: exams } = await supabase
    .from('exams')
    .select(`
      id, title, is_published, duration_minutes, total_points, questions_count,
      attempts_count, avg_score, created_at, available_from, available_until,
      subjects(name_ar, icon),
      grades(name_ar)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">الاختبارات</h1>
          <p className="text-muted-foreground mt-1">إنشاء وإدارة الاختبارات</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/exams/batch"
            className="flex items-center gap-2 border border-border bg-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
            توليد آلي
          </a>
          <a href="/admin/exams/new"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            اختبار جديد
          </a>
        </div>
      </div>

      {exams && exams.length > 0 ? (
        <div className="grid gap-4">
          {exams.map((exam: any) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-border p-5 card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold">{exam.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                      exam.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {exam.is_published ? <><Eye className="w-3 h-3" /> منشور</> : <><EyeOff className="w-3 h-3" /> مسودة</>}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                    {exam.subjects && <span>{(exam.subjects as any).icon} {(exam.subjects as any).name_ar}</span>}
                    {exam.grades && <span>• {(exam.grades as any).name_ar}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.duration_minutes} دقيقة</span>
                    <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />{exam.questions_count} سؤال</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{exam.attempts_count} محاولة</span>
                    {exam.avg_score > 0 && <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />متوسط {exam.avg_score?.toFixed(0)}٪</span>}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <a href={`/admin/exams/${exam.id}`}
                    className="text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                    تعديل
                  </a>
                  <a href={`/admin/exams/${exam.id}/reports`}
                    className="text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                    التقرير
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">لا توجد اختبارات بعد</h3>
          <p className="text-muted-foreground text-sm mb-6">أنشئ اختباراً من الأسئلة الموجودة في بنك الأسئلة</p>
          <a href="/admin/exams/new" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors inline-block">
            إنشاء أول اختبار
          </a>
        </div>
      )}
    </div>
  )
}
