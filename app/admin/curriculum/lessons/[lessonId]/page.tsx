// app/admin/curriculum/lessons/[lessonId]/page.tsx
// صفحة إدارة الدرس — أسئلته، أهدافه، وإجراءاته

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Zap,
  Plus,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Edit2,
} from 'lucide-react'
import { LessonQuestionsClient } from '@/components/admin/LessonQuestionsClient'
import { GenerateSummaryClient } from '@/components/admin/GenerateSummaryClient'

interface Props {
  params: { lessonId: string }
}

export default async function LessonDetailPage({ params }: Props) {
  await requireAdmin()
  const supabase = await createClient()
  const lessonId = parseInt(params.lessonId, 10)
  if (isNaN(lessonId)) notFound()

  // جلب الدرس
  const { data: lesson } = await supabase
    .from('lessons')
    .select(
      `
      id, name_ar, sort_order, duration_minutes, is_active, objectives, summary,
      units(
        id, name_ar,
        subjects(id, name_ar, icon, grade_id:grade_id),
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
      `
      id, question_type, question_text, difficulty_level, points, is_approved, created_at,
      options, correct_answer, explanation
    `
    )
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })

  // الأسئلة المتاحة في نفس المادة والصف للإضافة
  const gradeId = unit?.grades?.id
  const subjectId = unit?.subjects?.id

  const { data: availableQuestions } = await supabase
    .from('questions')
    .select('id, question_type, question_text, difficulty_level, points')
    .eq('subject_id', subjectId || 0)
    .eq('grade_id', gradeId || 0)
    .is('lesson_id', null)
    .limit(50)

  // إحصائيات حسب النوع
  const mcqCount =
    questions?.filter((q: any) => q.question_type === 'mcq').length || 0
  const tfCount =
    questions?.filter((q: any) => q.question_type === 'true_false').length || 0
  const fillCount =
    questions?.filter((q: any) => q.question_type === 'fill_blank').length || 0
  const approvedCount = questions?.filter((q: any) => q.is_approved).length || 0

  const DIFF_COLOR: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }
  const DIFF_LABEL: Record<string, string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
  }
  const TYPE_LABEL: Record<string, string> = {
    mcq: 'اختيار من متعدد',
    true_false: 'صح/خطأ',
    fill_blank: 'ملء فراغ',
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20">
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
        <span className="font-bold text-foreground">
          {(lesson as any).name_ar}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
            {unit?.subjects?.icon || '📖'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{(lesson as any).name_ar}</h1>
            <p className="text-sm text-muted-foreground">
              {unit?.subjects?.name_ar} • {unit?.grades?.name_ar} •{' '}
              {unit?.name_ar}
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />{' '}
                {(lesson as any).duration_minutes} دقيقة
              </span>
              {(lesson as any).objectives && (
                <span className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> أهداف محددة
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/curriculum/lessons/${lessonId}/create-exam`}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <Zap className="h-4 w-4" /> إنشاء اختبار سريع
          </Link>
          <Link
            href={`/admin/questions/new?lesson=${lessonId}&unit=${unit?.id}&subject=${subjectId}&grade=${gradeId}`}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> سؤال جديد
          </Link>
        </div>
      </div>

      {/* Objectives */}
      {(lesson as any).objectives && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-amber-800">
            <Target className="h-4 w-4" /> أهداف الدرس
          </h3>
          <p className="text-sm leading-relaxed text-amber-900">
            {(lesson as any).objectives}
          </p>
        </div>
      )}

      {/* AI Summary Generator */}
      <GenerateSummaryClient
        lessonId={lessonId}
        initialSummary={(lesson as any).summary}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: 'اختيار متعدد',
            value: mcqCount,
            icon: '🔘',
            color: 'bg-blue-50 text-blue-700',
          },
          {
            label: 'صح / خطأ',
            value: tfCount,
            icon: '✅',
            color: 'bg-green-50 text-green-700',
          },
          {
            label: 'ملء فراغ',
            value: fillCount,
            icon: '✏️',
            color: 'bg-purple-50 text-purple-700',
          },
          {
            label: 'معتمدة',
            value: approvedCount,
            icon: '⭐',
            color: 'bg-amber-50 text-amber-700',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-white p-4 text-center"
          >
            <div
              className={`h-10 w-10 rounded-xl ${s.color} mx-auto mb-2 flex items-center justify-center text-xl`}
            >
              {s.icon}
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Questions List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <HelpCircle className="h-5 w-5 text-primary" />
            أسئلة هذا الدرس ({questions?.length || 0})
          </h2>
          {availableQuestions && availableQuestions.length > 0 && (
            <LessonQuestionsClient
              lessonId={lessonId}
              unitId={unit?.id}
              availableQuestions={availableQuestions as any[]}
            />
          )}
        </div>

        {questions && questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q: any, idx: number) => (
              <div
                key={q.id}
                className="rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/20 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {/* Index */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-black text-muted-foreground">
                    {idx + 1}
                  </span>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-relaxed">
                      {q.question_text}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {TYPE_LABEL[q.question_type] || q.question_type}
                      </span>
                      {q.difficulty_level && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFF_COLOR[q.difficulty_level]}`}
                        >
                          {DIFF_LABEL[q.difficulty_level]}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {q.points} درجة
                      </span>
                      {q.is_approved && (
                        <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <CheckCircle className="h-2.5 w-2.5" /> معتمد
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/questions/${q.id}`}
                      className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-bold">لا توجد أسئلة بعد</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              أضف أسئلة لهذا الدرس يدوياً أو اربط أسئلة موجودة به
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href={`/admin/questions/new?lesson=${lessonId}&unit=${unit?.id}&subject=${subjectId}&grade=${gradeId}`}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                + إضافة سؤال جديد
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
