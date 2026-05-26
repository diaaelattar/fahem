// app/admin/curriculum/lessons/[lessonId]/create-exam/page.tsx
// إنشاء اختبار سريع من أسئلة درس واحد

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { CreateExamFromLessonClient } from '@/components/admin/CreateExamFromLessonClient'

interface Props {
  params: { lessonId: string }
}

export default async function CreateExamFromLessonPage({ params }: Props) {
  await requireAdmin()
  const supabase = await createClient()
  const lessonId = parseInt(params.lessonId, 10)
  if (isNaN(lessonId)) notFound()

  // جلب بيانات الدرس
  const { data: lesson } = await supabase
    .from('lessons')
    .select(
      `
      id, name_ar, duration_minutes,
      units(
        id, name_ar,
        subjects(id, name_ar, icon),
        grades(id, name_ar)
      )
    `
    )
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  const unit = (lesson as any).units

  // جلب أسئلة الدرس
  const { data: questions } = await supabase
    .from('questions')
    .select(
      'id, question_type, question_text, difficulty_level, points, is_approved'
    )
    .eq('lesson_id', lessonId)
    .order('created_at')

  if (!questions || questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in py-20 text-center">
        <div className="mb-6 text-6xl">📭</div>
        <h1 className="mb-2 text-2xl font-bold">لا توجد أسئلة في هذا الدرس</h1>
        <p className="mb-8 text-muted-foreground">
          أضف أسئلة للدرس أولاً قبل إنشاء اختبار منه
        </p>
        <Link
          href={`/admin/curriculum/lessons/${lessonId}`}
          className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90"
        >
          العودة للدرس
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/curriculum?tab=units"
          className="transition-colors hover:text-primary"
        >
          الوحدات
        </Link>
        <span>/</span>
        <Link
          href={`/admin/curriculum/units/${unit?.id}`}
          className="transition-colors hover:text-primary"
        >
          {unit?.name_ar}
        </Link>
        <span>/</span>
        <Link
          href={`/admin/curriculum/lessons/${lessonId}`}
          className="transition-colors hover:text-primary"
        >
          {(lesson as any).name_ar}
        </Link>
        <span>/</span>
        <span className="font-bold text-foreground">إنشاء اختبار</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
          <Zap className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إنشاء اختبار سريع</h1>
          <p className="text-sm text-muted-foreground">
            {(lesson as any).name_ar} • {unit?.subjects?.name_ar} •{' '}
            {unit?.grades?.name_ar}
          </p>
        </div>
      </div>

      {/* Question Preview */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <h3 className="mb-3 font-bold">الأسئلة المتاحة ({questions.length})</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { type: 'mcq', label: 'اختيار متعدد', icon: '🔘' },
            { type: 'true_false', label: 'صح / خطأ', icon: '✅' },
            { type: 'fill_blank', label: 'ملء فراغ', icon: '✏️' },
          ].map((t) => (
            <div key={t.type} className="rounded-xl bg-muted/30 p-3">
              <div className="mb-1 text-2xl">{t.icon}</div>
              <div className="text-xl font-bold">
                {
                  questions.filter((q: any) => q.question_type === t.type)
                    .length
                }
              </div>
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
