'use client'
// components/admin/LessonQuestionsClient.tsx
// ربط أسئلة موجودة بالدرس

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link2, X, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Q {
  id: string
  question_text: string
  question_type: string
  difficulty_level: string
  points: number
}

export function LessonQuestionsClient({
  lessonId,
  unitId,
  availableQuestions,
}: {
  lessonId: number
  unitId: number
  availableQuestions: Q[]
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const supabase = createClient() as any
  const router = useRouter()

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleLink = async () => {
    if (selected.size === 0) return
    setLoading(true)
    const ids = Array.from(selected)
    await supabase
      .from('questions')
      .update({ lesson_id: lessonId, unit_id: unitId })
      .in('id', ids)
    setLoading(false)
    setOpen(false)
    setSelected(new Set())
    router.refresh()
  }

  const TYPE_LABEL: Record<string, string> = {
    mcq: 'MCQ',
    true_false: 'ص/خ',
    fill_blank: 'فراغ',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
      >
        <Link2 className="h-4 w-4" /> ربط أسئلة موجودة (
        {availableQuestions.length})
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl animate-fade-in rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold">ربط أسئلة بهذا الدرس</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  هذه الأسئلة من نفس المادة والصف ولم تُعيَّن لدرس بعد
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
              {availableQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => toggle(q.id)}
                  className={`w-full rounded-2xl border-2 p-4 text-right transition-all ${
                    selected.has(q.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                        selected.has(q.id)
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}
                    >
                      {selected.has(q.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-right text-sm">
                        {q.question_text}
                      </p>
                      <div className="mt-1 flex gap-2">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {TYPE_LABEL[q.question_type]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {q.points} درجة
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t p-6">
              <span className="text-sm text-muted-foreground">
                {selected.size > 0
                  ? `محدد: ${selected.size} سؤال`
                  : 'اختر الأسئلة للربط'}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleLink}
                  disabled={selected.size === 0 || loading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  ربط {selected.size > 0 ? `(${selected.size})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
