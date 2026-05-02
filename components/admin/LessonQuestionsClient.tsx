'use client'
// components/admin/LessonQuestionsClient.tsx
// ربط أسئلة موجودة بالدرس

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link2, X, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Q { id: string; question_text: string; question_type: string; difficulty_level: string; points: number }

export function LessonQuestionsClient({
  lessonId, unitId, availableQuestions
}: {
  lessonId: number; unitId: number; availableQuestions: Q[]
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const supabase = createClient() as any
  const router = useRouter()

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleLink = async () => {
    if (selected.size === 0) return
    setLoading(true)
    const ids = Array.from(selected)
    await supabase.from('questions')
      .update({ lesson_id: lessonId, unit_id: unitId })
      .in('id', ids)
    setLoading(false)
    setOpen(false)
    setSelected(new Set())
    router.refresh()
  }

  const TYPE_LABEL: Record<string, string> = { mcq: 'MCQ', true_false: 'ص/خ', fill_blank: 'فراغ' }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-indigo-300 text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors">
        <Link2 className="w-4 h-4" /> ربط أسئلة موجودة ({availableQuestions.length})
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 animate-fade-in">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">ربط أسئلة بهذا الدرس</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  هذه الأسئلة من نفس المادة والصف ولم تُعيَّن لدرس بعد
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {availableQuestions.map(q => (
                <button key={q.id} onClick={() => toggle(q.id)}
                  className={`w-full text-right p-4 rounded-2xl border-2 transition-all ${
                    selected.has(q.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      selected.has(q.id) ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {selected.has(q.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-right line-clamp-2">{q.question_text}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-muted text-muted-foreground font-bold px-1.5 py-0.5 rounded-md">
                          {TYPE_LABEL[q.question_type]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{q.points} درجة</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selected.size > 0 ? `محدد: ${selected.size} سؤال` : 'اختر الأسئلة للربط'}
              </span>
              <div className="flex gap-3">
                <button onClick={() => setOpen(false)} className="px-5 py-2 border border-border rounded-xl font-medium text-sm hover:bg-muted">
                  إلغاء
                </button>
                <button onClick={handleLink} disabled={selected.size === 0 || loading}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
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
