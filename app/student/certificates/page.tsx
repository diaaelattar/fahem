// app/student/certificates/page.tsx
// صفحة شهادات الإنجاز — تعرض الاختبارات التي نجح فيها الطالب

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { CertificateCard } from '@/components/student/CertificateCard'
import { Award, BookOpen } from 'lucide-react'

export default async function CertificatesPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // جلب المحاولات الناجحة فقط
  const { data: passedAttempts } = await supabase
    .from('exam_attempts')
    .select(
      `
      id, score, percentage, completed_at,
      exams(
        id, title, total_points,
        subjects(name_ar, icon),
        grades(name_ar)
      )
    `
    )
    .eq('student_id', profile.id)
    .eq('is_passed', true)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  // إحصائيات سريعة
  const totalCerts = passedAttempts?.length || 0
  const avgScore =
    totalCerts > 0
      ? Math.round(
          passedAttempts!.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            totalCerts
        )
      : 0
  const excellentCount =
    passedAttempts?.filter((a) => (a.percentage || 0) >= 90).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">شهاداتي 🏆</h1>
        <p className="mt-1 text-muted-foreground">
          {totalCerts > 0
            ? `حصلت على ${totalCerts} شهادة إنجاز حتى الآن — رائع!`
            : 'ستظهر شهاداتك هنا بعد اجتياز الاختبارات بنجاح'}
        </p>
      </div>

      {/* إحصائيات */}
      {totalCerts > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'إجمالي الشهادات',
              value: totalCerts,
              color: 'bg-yellow-50 text-yellow-700',
              icon: '🏆',
            },
            {
              label: 'متوسط الدرجات',
              value: `${avgScore}٪`,
              color: 'bg-blue-50 text-blue-700',
              icon: '📊',
            },
            {
              label: 'درجة ممتاز',
              value: excellentCount,
              color: 'bg-green-50 text-green-700',
              icon: '⭐',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-white p-5 text-center"
            >
              <div className="mb-2 text-3xl">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* الشهادات */}
      {passedAttempts && passedAttempts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {passedAttempts.map((attempt: any) => (
            <CertificateCard
              key={attempt.id}
              attemptId={attempt.id}
              studentName={profile.full_name}
              examTitle={attempt.exams?.title || 'اختبار'}
              subjectName={attempt.exams?.subjects?.name_ar || ''}
              gradeName={attempt.exams?.grades?.name_ar || ''}
              score={attempt.score}
              percentage={attempt.percentage || 0}
              completedAt={attempt.completed_at}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-16 text-center">
          <Award className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="mb-2 text-xl font-bold">لا توجد شهادات بعد</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            اجتز الاختبارات بنجاح لتحصل على شهادات إنجاز رسمية
          </p>
          <a
            href="/student/exams"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            ابدأ اختباراً الآن
          </a>
        </div>
      )}
    </div>
  )
}
