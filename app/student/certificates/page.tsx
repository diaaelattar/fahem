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
    .select(`
      id, score, percentage, completed_at,
      exams(
        id, title, total_points,
        subjects(name_ar, icon),
        grades(name_ar)
      )
    `)
    .eq('student_id', profile.id)
    .eq('is_passed', true)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  // إحصائيات سريعة
  const totalCerts = passedAttempts?.length || 0
  const avgScore = totalCerts > 0
    ? Math.round(passedAttempts!.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalCerts)
    : 0
  const excellentCount = passedAttempts?.filter(a => (a.percentage || 0) >= 90).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">شهاداتي 🏆</h1>
        <p className="text-muted-foreground mt-1">
          {totalCerts > 0
            ? `حصلت على ${totalCerts} شهادة إنجاز حتى الآن — رائع!`
            : 'ستظهر شهاداتك هنا بعد اجتياز الاختبارات بنجاح'
          }
        </p>
      </div>

      {/* إحصائيات */}
      {totalCerts > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'إجمالي الشهادات', value: totalCerts, color: 'bg-yellow-50 text-yellow-700', icon: '🏆' },
            { label: 'متوسط الدرجات', value: `${avgScore}٪`, color: 'bg-blue-50 text-blue-700', icon: '📊' },
            { label: 'درجة ممتاز', value: excellentCount, color: 'bg-green-50 text-green-700', icon: '⭐' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-border p-5 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* الشهادات */}
      {passedAttempts && passedAttempts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
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
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-xl mb-2">لا توجد شهادات بعد</h3>
          <p className="text-muted-foreground text-sm mb-6">
            اجتز الاختبارات بنجاح لتحصل على شهادات إنجاز رسمية
          </p>
          <a
            href="/student/exams"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            ابدأ اختباراً الآن
          </a>
        </div>
      )}
    </div>
  )
}
