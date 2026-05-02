import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { Award, Download, CheckCircle } from 'lucide-react'

export default async function CertificatesPage() {
  const profile = await requireStudent()
  const supabase = createClient()

  // جلب الاختبارات التي نجح فيها الطالب
  const { data: passedAttempts } = await supabase
    .from('exam_attempts')
    .select(`
      id, score, percentage, completed_at, attempt_number,
      exams(id, title, total_points, subjects(name_ar, icon), grades(name_ar))
    `)
    .eq('student_id', profile.id)
    .eq('is_passed', true)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  const { data: student } = await supabase
    .from('students')
    .select('*, grades(name_ar)')
    .eq('id', profile.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">شهاداتي</h1>
        <p className="text-muted-foreground mt-1">
          شهادات الاختبارات التي اجتزتها بنجاح — {passedAttempts?.length || 0} شهادة
        </p>
      </div>

      {passedAttempts && passedAttempts.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {passedAttempts.map((attempt: any) => (
            <div key={attempt.id}
              className="bg-white rounded-2xl border-2 border-yellow-200 overflow-hidden card-hover group">
              {/* Header */}
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-5 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white,transparent)]" />
                <Award className="w-12 h-12 text-white mx-auto mb-2 drop-shadow" />
                <p className="text-white text-xs font-semibold tracking-widest uppercase">شهادة إتمام</p>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="text-center mb-4">
                  <p className="text-xs text-muted-foreground mb-1">مُقدَّمة إلى</p>
                  <h3 className="text-lg font-display font-bold">{profile.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{(student?.grades as any)?.name_ar}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">لاجتيازه اختبار</p>
                  <p className="font-bold text-sm leading-snug">{attempt.exams?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {attempt.exams?.subjects?.icon} {attempt.exams?.subjects?.name_ar}
                  </p>
                </div>

                <div className="flex justify-between text-sm mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{attempt.percentage?.toFixed(0)}٪</div>
                    <div className="text-xs text-muted-foreground">النسبة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{attempt.score}/{attempt.exams?.total_points}</div>
                    <div className="text-xs text-muted-foreground">الدرجة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">التاريخ</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 text-xs text-green-600 mb-4">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>تم الاجتياز بنجاح</span>
                </div>

                <button
                  onClick={() => alert('ميزة تنزيل الشهادة PDF قيد التطوير')}
                  className="w-full flex items-center justify-center gap-2 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" />
                  تنزيل الشهادة PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <Award className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-xl mb-2">لا توجد شهادات بعد</h3>
          <p className="text-muted-foreground text-sm mb-6">
            اجتز اختباراً بنجاح لتحصل على شهادة إتمام
          </p>
          <a href="/student/exams"
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors inline-block">
            ابدأ اختباراً
          </a>
        </div>
      )}
    </div>
  )
}
