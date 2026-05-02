// app/admin/curriculum/lessons/[lessonId]/page.tsx
// صفحة إدارة الدرس — أسئلته، أهدافه، وإجراءاته

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Zap, Plus, Clock, Target, BookOpen,
  CheckCircle, HelpCircle, Edit2
} from 'lucide-react'
import { LessonQuestionsClient } from '@/components/admin/LessonQuestionsClient'

interface Props { params: { lessonId: string } }

export default async function LessonDetailPage({ params }: Props) {
  await requireAdmin()
  const supabase = createClient()
  const lessonId = parseInt(params.lessonId, 10)
  if (isNaN(lessonId)) notFound()

  // جلب الدرس
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id, name_ar, sort_order, duration_minutes, is_active, objectives,
      units(
        id, name_ar,
        subjects(id, name_ar, icon, grade_id:grade_id),
        grades(id, name_ar)
      )
    `)
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  const unit = lesson.units as any

  // جلب أسئلة الدرس
  const { data: questions } = await supabase
    .from('questions')
    .select(`
      id, question_type, question_text, difficulty_level, points, is_approved, created_at,
      options, correct_answer, explanation
    `)
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
  const mcqCount    = questions?.filter((q: any) => q.question_type === 'mcq').length || 0
  const tfCount     = questions?.filter((q: any) => q.question_type === 'true_false').length || 0
  const fillCount   = questions?.filter((q: any) => q.question_type === 'fill_blank').length || 0
  const approvedCount = questions?.filter((q: any) => q.is_approved).length || 0

  const DIFF_COLOR: Record<string, string> = {
    easy:   'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard:   'bg-red-100 text-red-700',
  }
  const DIFF_LABEL: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
  const TYPE_LABEL: Record<string, string> = { mcq: 'اختيار من متعدد', true_false: 'صح/خطأ', fill_blank: 'ملء فراغ' }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin/curriculum?tab=units" className="hover:text-primary transition-colors">الوحدات</Link>
        <span>/</span>
        <Link href={`/admin/curriculum/units/${unit?.id}`} className="hover:text-primary transition-colors">
          {unit?.name_ar}
        </Link>
        <span>/</span>
        <span className="text-foreground font-bold">{(lesson as any).name_ar}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl">
            {unit?.subjects?.icon || '📖'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{(lesson as any).name_ar}</h1>
            <p className="text-muted-foreground text-sm">
              {unit?.subjects?.name_ar} • {unit?.grades?.name_ar} • {unit?.name_ar}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {(lesson as any).duration_minutes} دقيقة</span>
              {(lesson as any).objectives && <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> أهداف محددة</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/curriculum/lessons/${lessonId}/create-exam`}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
            <Zap className="w-4 h-4" /> إنشاء اختبار سريع
          </Link>
          <Link href={`/admin/questions/new?lesson=${lessonId}&unit=${unit?.id}&subject=${subjectId}&grade=${gradeId}`}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> سؤال جديد
          </Link>
        </div>
      </div>

      {/* Objectives */}
      {(lesson as any).objectives && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> أهداف الدرس
          </h3>
          <p className="text-sm text-amber-900 leading-relaxed">{(lesson as any).objectives}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'اختيار متعدد', value: mcqCount, icon: '🔘', color: 'bg-blue-50 text-blue-700' },
          { label: 'صح / خطأ', value: tfCount, icon: '✅', color: 'bg-green-50 text-green-700' },
          { label: 'ملء فراغ', value: fillCount, icon: '✏️', color: 'bg-purple-50 text-purple-700' },
          { label: 'معتمدة', value: approvedCount, icon: '⭐', color: 'bg-amber-50 text-amber-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mx-auto mb-2`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Questions List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
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
              <div key={q.id} className="bg-white rounded-2xl border border-border p-5 hover:border-primary/20 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  {/* Index */}
                  <span className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-xs font-black shrink-0 text-muted-foreground">
                    {idx + 1}
                  </span>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-relaxed line-clamp-2">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                        {TYPE_LABEL[q.question_type] || q.question_type}
                      </span>
                      {q.difficulty_level && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[q.difficulty_level]}`}>
                          {DIFF_LABEL[q.difficulty_level]}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{q.points} درجة</span>
                      {q.is_approved && (
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> معتمد
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/questions/${q.id}`}
                      className="p-2 hover:bg-primary/5 rounded-xl transition-colors text-muted-foreground hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center">
            <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">لا توجد أسئلة بعد</h3>
            <p className="text-muted-foreground text-sm mb-6">أضف أسئلة لهذا الدرس يدوياً أو اربط أسئلة موجودة به</p>
            <div className="flex gap-3 justify-center">
              <Link href={`/admin/questions/new?lesson=${lessonId}&unit=${unit?.id}&subject=${subjectId}&grade=${gradeId}`}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90">
                + إضافة سؤال جديد
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
