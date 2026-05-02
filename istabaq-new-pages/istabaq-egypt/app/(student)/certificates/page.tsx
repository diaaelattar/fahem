import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { Award, Download, Eye, Share2, Star, BookOpen, Clock } from 'lucide-react'
import CertificateCard from './CertificateCard'

export default async function CertificatesPage() {
  const profile = await requireStudent()
  const supabase = createClient()

  // جلب الاختبارات التي نجح فيها الطالب (أفضل محاولة لكل اختبار)
  const { data: passedAttempts } = await supabase
    .from('exam_attempts')
    .select(`
      id, score, percentage, completed_at, time_spent_seconds, attempt_number,
      exams(
        id, title, total_points, passing_score,
        subjects(name_ar, name_en, icon, color),
        grades(name_ar)
      )
    `)
    .eq('student_id', profile.id)
    .eq('is_passed', true)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  // جلب بيانات الطالب
  const { data: student } = await supabase
    .from('students')
    .select('*, grades(name_ar)')
    .eq('id', profile.id)
    .single()

  // إزالة التكرارات (أبقِ أفضل نتيجة لكل اختبار)
  const uniqueCertificates = passedAttempts?.reduce((acc: any[], attempt: any) => {
    const examId = attempt.exams?.id
    const existing = acc.find((a: any) => a.exams?.id === examId)
    if (!existing || attempt.percentage > existing.percentage) {
      return [...acc.filter((a: any) => a.exams?.id !== examId), attempt]
    }
    return acc
  }, []) || []

  // إحصائيات
  const totalCertificates = uniqueCertificates.length
  const avgScore = totalCertificates > 0
    ? Math.round(uniqueCertificates.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) / totalCertificates)
    : 0
  const excellentCount = uniqueCertificates.filter((a: any) => a.percentage >= 90).length

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Award className="w-8 h-8 text-egypt-gold" style={{ color: 'var(--egypt-gold)' }} />
            شهاداتي
          </h1>
          <p className="text-muted-foreground mt-1">شهادات الإنجاز لكل الاختبارات التي اجتزتها</p>
        </div>
      </div>

      {/* إحصائيات */}
      {totalCertificates > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <div className="text-3xl font-bold text-primary mb-1">{totalCertificates}</div>
            <div className="text-sm text-muted-foreground">إجمالي الشهادات</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--egypt-gold)' }}>{avgScore}٪</div>
            <div className="text-sm text-muted-foreground">متوسط الدرجات</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-1">{excellentCount}</div>
            <div className="text-sm text-muted-foreground">شهادات تميّز (90٪+)</div>
          </div>
        </div>
      )}

      {/* الشهادات */}
      {uniqueCertificates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {uniqueCertificates.map((attempt: any) => (
            <CertificateCard
              key={attempt.id}
              attempt={attempt}
              studentName={profile.full_name}
              grade={student?.grades?.name_ar}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-5">
            <Award className="w-10 h-10 text-yellow-400" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">لا توجد شهادات بعد</h3>
          <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
            أجتز اختباراتك بنجاح لتحصل على شهادات الإنجاز التي يمكنك تنزيلها ومشاركتها
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
            {[
              { icon: BookOpen, text: 'ادرس المادة' },
              { icon: Clock, text: 'خذ الاختبار' },
              { icon: Award, text: 'احصل على شهادتك' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <span>{step.text}</span>
              </div>
            ))}
          </div>
          <a
            href="/student/exams"
            className="bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            ابدأ اختباراً الآن
          </a>
        </div>
      )}
    </div>
  )
}
