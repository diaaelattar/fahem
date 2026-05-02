// app/admin/curriculum/lessons/[lessonId]/create-exam/page.tsx
// إنشاء اختبار سريع من أسئلة درس واحد

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { CreateExamFromLessonClient } from '@/components/admin/CreateExamFromLessonClient'

interface Props { params: { lessonId: string } }

export default async function CreateExamFromLessonPage({ params }: Props) {
  await requireAdmin()
  const supabase = createClient()
  const lessonId = parseInt(params.lessonId, 10)
  if (isNaN(lessonId)) notFound()

  // جلب بيانات الدرس
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id, name_ar, duration_minutes,
      units(
        id, name_ar,
        subjects(id, name_ar, icon),
        grades(id, name_ar)
      )
    `)
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  const unit = (lesson as any).units

  // جلب أسئلة الدرس
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_type, question_text, difficulty_level, points, is_approved')
    .eq('lesson_id', lessonId)
    .order('created_at')

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="text-6xl mb-6">📭</div>
        <h1 className="text-2xl font-bold mb-2">لا توجد أسئلة في هذا الدرس</h1>
        <p className="text-muted-foreground mb-8">
          أضف أسئلة للدرس أولاً قبل إنشاء اختبار منه
        </p>
        <Link href={`/admin/curriculum/lessons/${lessonId}`}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90">
          العودة للدرس
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin/curriculum?tab=units" className="hover:text-primary transition-colors">الوحدات</Link>
        <span>/</span>
        <Link href={`/admin/curriculum/units/${unit?.id}`} className="hover:text-primary transition-colors">{unit?.name_ar}</Link>
        <span>/</span>
        <Link href={`/admin/curriculum/lessons/${lessonId}`} className="hover:text-primary transition-colors">{(lesson as any).name_ar}</Link>
        <span>/</span>
        <span className="text-foreground font-bold">إنشاء اختبار</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
          <Zap className="w-7 h-7 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إنشاء اختبار سريع</h1>
          <p className="text-muted-foreground text-sm">
            {(lesson as any).name_ar} • {unit?.subjects?.name_ar} • {unit?.grades?.name_ar}
          </p>
        </div>
      </div>

      {/* Question Preview */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-bold mb-3">الأسئلة المتاحة ({questions.length})</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { type: 'mcq', label: 'اختيار متعدد', icon: '🔘' },
            { type: 'true_false', label: 'صح / خطأ', icon: '✅' },
            { type: 'fill_blank', label: 'ملء فراغ', icon: '✏️' },
          ].map(t => (
            <div key={t.type} className="bg-muted/30 rounded-xl p-3">
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xl font-bold">{questions.filter((q: any) => q.question_type === t.type).length}</div>
              <div className="text-[10px] text-muted-foreground">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Exam Form */}
      <CreateExamFromLessonClient
        lesson={lesson as any}
        unit={unit}
        questions={questions as any[]}
      />
    </div>
  )
}
