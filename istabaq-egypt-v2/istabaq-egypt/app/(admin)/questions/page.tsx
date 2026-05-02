import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { HelpCircle, CheckCircle, Clock, Filter } from 'lucide-react'

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { type?: string; difficulty?: string; grade?: string; subject?: string; approved?: string }
}) {
  await requireAdmin()
  const supabase = createClient()

  let query = supabase
    .from('questions')
    .select(`
      id, question_type, question_text, difficulty_level, points, is_approved, usage_count, created_at,
      subjects(name_ar, icon),
      grades(name_ar)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (searchParams.type) query = query.eq('question_type', searchParams.type)
  if (searchParams.difficulty) query = query.eq('difficulty_level', searchParams.difficulty)
  if (searchParams.grade) query = query.eq('grade_id', searchParams.grade)
  if (searchParams.subject) query = query.eq('subject_id', searchParams.subject)
  if (searchParams.approved !== undefined) query = query.eq('is_approved', searchParams.approved === 'true')

  const [{ data: questions }, { data: grades }, { data: subjects }] = await Promise.all([
    query,
    supabase.from('grades').select('id, name_ar').order('grade_number'),
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
  ])

  const TYPE_LABELS: Record<string, string> = { mcq: 'اختيار من متعدد', true_false: 'صح/خطأ', fill_blank: 'ملء فراغ' }
  const DIFF_LABELS: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">بنك الأسئلة</h1>
          <p className="text-muted-foreground mt-1">إدارة جميع الأسئلة المولدة والمضافة يدوياً</p>
        </div>
        <a href="/admin/questions/new" className="bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          + إضافة سؤال يدوياً
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-muted-foreground">فلترة:</span>

        {(['mcq', 'true_false', 'fill_blank'] as const).map(type => (
          <a key={type} href={`?type=${type}`}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${searchParams.type === type ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/40'}`}>
            {TYPE_LABELS[type]}
          </a>
        ))}

        <span className="w-px h-4 bg-border" />

        {(['easy', 'medium', 'hard'] as const).map(diff => (
          <a key={diff} href={`?difficulty=${diff}`}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${searchParams.difficulty === diff ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/40'}`}>
            {DIFF_LABELS[diff]}
          </a>
        ))}

        {(searchParams.type || searchParams.difficulty || searchParams.grade || searchParams.subject) && (
          <a href="/admin/questions" className="text-xs text-red-500 hover:underline mr-auto">مسح الفلاتر</a>
        )}
      </div>

      {/* Questions List */}
      {questions && questions.length > 0 ? (
        <div className="space-y-3">
          {questions.map((q: any) => (
            <div key={q.id} className="bg-white rounded-2xl border border-border p-5 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.question_type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                      q.question_type === 'true_false' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{TYPE_LABELS[q.question_type]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      q.difficulty_level === 'easy' ? 'bg-green-50 text-green-700 border-green-200' :
                      q.difficulty_level === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>{DIFF_LABELS[q.difficulty_level]}</span>
                    {q.subjects && <span className="text-xs text-muted-foreground">{(q.subjects as any).icon} {(q.subjects as any).name_ar}</span>}
                    {q.grades && <span className="text-xs text-muted-foreground">• {(q.grades as any).name_ar}</span>}
                  </div>
                  <p className="text-sm font-medium leading-relaxed line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{q.points} {q.points === 1 ? 'درجة' : 'درجات'}</span>
                    <span className="text-xs text-muted-foreground">استُخدم {q.usage_count} مرة</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.is_approved
                    ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> معتمد</span>
                    : <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> قيد المراجعة</span>
                  }
                  <a href={`/admin/questions/${q.id}`}
                    className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                    تعديل
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">لا توجد أسئلة بعد</h3>
          <p className="text-muted-foreground text-sm mb-6">ارفع محتوى تعليمياً ليقوم الذكاء الاصطناعي بتوليد أسئلة تلقائياً</p>
          <a href="/admin/content" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors inline-block">
            رفع محتوى جديد
          </a>
        </div>
      )}
    </div>
  )
}
