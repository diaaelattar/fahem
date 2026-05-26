import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import {
  ClipboardList,
  Users,
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react'

export default async function ExamsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: exams } = await supabase
    .from('exams')
    .select(
      `
      id, title, is_published, duration_minutes, total_points, questions_count,
      attempts_count, avg_score, created_at, available_from, available_until,
      subjects(name_ar, icon),
      grades(name_ar)
    `
    )
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">الاختبارات</h1>
          <p className="mt-1 text-muted-foreground">إنشاء وإدارة الاختبارات</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/exams/batch"
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            توليد آلي
          </a>
          <a
            href="/admin/exams/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            اختبار جديد
          </a>
        </div>
      </div>

      {exams && exams.length > 0 ? (
        <div className="grid gap-4">
          {exams.map((exam: any) => (
            <div
              key={exam.id}
              className="card-hover rounded-2xl border border-border bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-base font-bold">{exam.title}</h3>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        exam.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {exam.is_published ? (
                        <>
                          <Eye className="h-3 w-3" /> منشور
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> مسودة
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {exam.subjects && (
                      <span>
                        {(exam.subjects as any).icon}{' '}
                        {(exam.subjects as any).name_ar}
                      </span>
                    )}
                    {exam.grades && (
                      <span>• {(exam.grades as any).name_ar}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.duration_minutes} دقيقة
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {exam.questions_count} سؤال
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {exam.attempts_count} محاولة
                    </span>
                    {exam.avg_score > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        متوسط {exam.avg_score?.toFixed(0)}٪
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/admin/exams/${exam.id}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    تعديل
                  </a>
                  <a
                    href={`/admin/exams/${exam.id}/reports`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    التقرير
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-16 text-center">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-bold">لا توجد اختبارات بعد</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            أنشئ اختباراً من الأسئلة الموجودة في بنك الأسئلة
          </p>
          <a
            href="/admin/exams/new"
            className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            إنشاء أول اختبار
          </a>
        </div>
      )}
    </div>
  )
}
