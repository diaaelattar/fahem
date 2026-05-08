'use client'

import { useState, useMemo } from 'react'
import { X, Sparkles, AlertCircle } from 'lucide-react'
import type { QuestionItem } from './ExamBuilderTypes'

interface Props {
  availableQuestions: QuestionItem[]
  onAdd: (questions: QuestionItem[]) => void
  onClose: () => void
}

const TYPES = [
  { id: 'mcq', label: 'اختيار من متعدد' },
  { id: 'true_false', label: 'صح وخطأ' },
  { id: 'fill_blank', label: 'إكمال الفراغ' }
]

const DIFFICULTIES = [
  { id: 'easy', label: 'سهل', color: 'text-green-600 bg-green-50' },
  { id: 'medium', label: 'متوسط', color: 'text-yellow-600 bg-yellow-50' },
  { id: 'hard', label: 'صعب', color: 'text-red-600 bg-red-50' }
]

export function AutoSelectModal({ availableQuestions, onAdd, onClose }: Props) {
  // state: selection[type][difficulty] = number
  const [selection, setSelection] = useState<Record<string, Record<string, number>>>({
    mcq: { easy: 0, medium: 0, hard: 0 },
    true_false: { easy: 0, medium: 0, hard: 0 },
    fill_blank: { easy: 0, medium: 0, hard: 0 }
  })

  // Calculate available counts
  const availableCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {
      mcq: { easy: 0, medium: 0, hard: 0 },
      true_false: { easy: 0, medium: 0, hard: 0 },
      fill_blank: { easy: 0, medium: 0, hard: 0 }
    }
    availableQuestions.forEach(q => {
      const t = q.question_type
      const d = q.difficulty_level || 'medium' // fallback
      if (counts[t] && counts[t][d] !== undefined) {
        counts[t][d]++
      }
    })
    return counts
  }, [availableQuestions])

  const handleSelect = (type: string, diff: string, val: string) => {
    let num = parseInt(val) || 0
    if (num < 0) num = 0
    if (num > availableCounts[type][diff]) num = availableCounts[type][diff]
    
    setSelection(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [diff]: num
      }
    }))
  }

  const totalSelected = Object.values(selection).reduce((acc, diffObj) => {
    return acc + Object.values(diffObj).reduce((sum, n) => sum + n, 0)
  }, 0)

  const handleGenerate = () => {
    if (totalSelected === 0) return

    let selectedResult: QuestionItem[] = []

    TYPES.forEach(typeObj => {
      DIFFICULTIES.forEach(diffObj => {
        const requiredCount = selection[typeObj.id][diffObj.id]
        if (requiredCount > 0) {
          // Filter matching available questions
          const pool = availableQuestions.filter(q => 
            q.question_type === typeObj.id && (q.difficulty_level || 'medium') === diffObj.id
          )
          
          // Shuffle
          const shuffled = [...pool].sort(() => Math.random() - 0.5)
          
          // Pick top N
          selectedResult = [...selectedResult, ...shuffled.slice(0, requiredCount)]
        }
      })
    })

    onAdd(selectedResult)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex items-center justify-between bg-indigo-50/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              توليد الاختبار عشوائياً
            </h2>
            <p className="text-sm text-indigo-700 mt-1">حدد عدد الأسئلة المطلوبة من كل نوع ومستوى صعوبة</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
            <X className="w-5 h-5 text-indigo-900" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {availableQuestions.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
              <p className="font-bold">لا توجد أسئلة متاحة للسحب العشوائي</p>
              <p className="text-sm text-muted-foreground mt-1">يرجى تغيير الفلاتر (الوحدة / الدرس) لعرض المزيد من الأسئلة</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 font-bold text-muted-foreground">نوع السؤال</th>
                      {DIFFICULTIES.map(d => (
                        <th key={d.id} className="pb-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${d.color}`}>
                            {d.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {TYPES.map(type => (
                      <tr key={type.id}>
                        <td className="py-4 font-bold">{type.label}</td>
                        {DIFFICULTIES.map(diff => {
                          const max = availableCounts[type.id][diff.id] || 0
                          const val = selection[type.id][diff.id] || ''
                          return (
                            <td key={diff.id} className="py-4 px-2 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <input 
                                  type="number" 
                                  min="0" 
                                  max={max}
                                  value={val}
                                  onChange={e => handleSelect(type.id, diff.id, e.target.value)}
                                  disabled={max === 0}
                                  className="w-16 text-center border-2 border-border rounded-xl px-2 py-1.5 focus:border-indigo-500 focus:outline-none disabled:bg-muted/50 disabled:opacity-50"
                                  placeholder="0"
                                />
                                <span className="text-[10px] text-muted-foreground font-medium">متاح: {max}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-between mt-auto">
          <div className="text-sm font-bold text-muted-foreground">
            إجمالي الأسئلة المحددة: <span className="text-xl text-indigo-600 mx-1">{totalSelected}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors">
              إلغاء
            </button>
            <button 
              onClick={handleGenerate} 
              disabled={totalSelected === 0}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> إدراج في الاختبار
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
