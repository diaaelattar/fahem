'use client'

import { useState } from 'react'
import { Trash2, Loader2, Info } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { QuestionApprovalButtons } from '@/components/admin/QuestionApprovalButtons'
import { toast } from 'sonner'
import { bulkDeleteQuestionsAction } from '@/app/admin/questions/actions'

export function QuestionsListClient({ 
  questions,
  TYPE_LABELS,
  DIFF_COLORS,
  BLOOM_LABELS,
  STATUS_STYLES,
  basePath = '/admin/questions',
  showApprovalActions = true,
  showPrintButton = false,
}: { 
  questions: any[],
  TYPE_LABELS: any,
  DIFF_COLORS: any,
  BLOOM_LABELS: any,
  STATUS_STYLES: any,
  basePath?: string,
  showApprovalActions?: boolean,
  showPrintButton?: boolean,
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Handle individual checkbox toggle
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Handle "Select All" toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]) // Deselect all
    } else {
      setSelectedIds(questions.map(q => q.id)) // Select all
    }
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    const { success, error } = await bulkDeleteQuestionsAction(selectedIds)
    setIsDeleting(false)
    setShowConfirmModal(false)

    if (success) {
      toast.success(`تم حذف ${selectedIds.length} سؤال بنجاح!`)
      setSelectedIds([]) // Clear selection after successful deletion
    } else {
      toast.error(error || 'حدث خطأ أثناء عملية الحذف.')
    }
  }

  // تجميع الأسئلة المرتبطة بقطعة معاً
  const groups: { passage: string | null; questions: any[] }[] = []
  const passageToGroupIndex = new Map<string, number>()

  questions.forEach((q: any) => {
    if (q.context_passage) {
      if (passageToGroupIndex.has(q.context_passage)) {
        const index = passageToGroupIndex.get(q.context_passage)!
        groups[index].questions.push(q)
      } else {
        passageToGroupIndex.set(q.context_passage, groups.length)
        groups.push({ passage: q.context_passage, questions: [q] })
      }
    } else {
      groups.push({ passage: null, questions: [q] })
    }
  })

  return (
    <>
      {/* ── الشريط العلوي للحذف الجماعي (يظهر فقط إذا كان هناك تحديد) ── */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center justify-between sticky top-[72px] z-20 shadow-md animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-red-900 font-bold text-sm">سؤال محدد</p>
              <p className="text-red-700 text-xs">هل أنت متأكد من رغبتك في حذفهم نهائياً؟</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              إلغاء التحديد
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              حذف المحددة
            </button>
          </div>
        </div>
      )}

      {/* ── زر تحديد الكل ── */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <input 
          type="checkbox"
          id="select-all" 
          checked={questions.length > 0 && selectedIds.length === questions.length}
          onChange={toggleSelectAll}
          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
        />
        <label htmlFor="select-all" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
          تحديد جميع أسئلة الصفحة ({questions.length})
        </label>
      </div>

      <div className="space-y-6 relative">
        {groups.map((group, groupIdx) => (
          <div key={`group-${groupIdx}`} className={group.passage ? "bg-slate-50/50 border border-slate-200 rounded-3xl p-3 shadow-sm" : ""}>
            {group.passage && (
              <div className="mb-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-950 leading-relaxed italic relative">
                <span className="absolute -top-3 right-4 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-3 py-0.5 rounded-full border border-indigo-200">
                  القطعة المرجعية (مرتبط بها {group.questions.length} أسئلة)
                </span>
                <MathRenderer text={group.passage} />
              </div>
            )}
            <div className="space-y-2">
              {group.questions.map((q: any) => {
                const typeInfo = TYPE_LABELS[q.question_type] || { label: q.question_type, color: 'bg-slate-100 text-slate-700' }
                const bloom = q.bloom_level ? BLOOM_LABELS[q.bloom_level] : null
                const isSelected = selectedIds.includes(q.id)

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border transition-all group flex items-stretch overflow-hidden
                      ${isSelected ? 'border-blue-400 bg-blue-50/30 shadow-md ring-1 ring-blue-400' : 'border-border hover:border-primary/30'}
                    `}
                  >
                    {/* Checkbox Column */}
                    <div 
                      className={`w-14 flex items-start justify-center pt-5 shrink-0 border-l border-transparent cursor-pointer
                        ${isSelected ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50'}
                      `}
                      onClick={() => toggleSelection(q.id)}
                    >
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(q.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 p-4 pl-4 border-r border-slate-100">
                      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            {q.difficulty_level && (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${DIFF_COLORS[q.difficulty_level]}`}>
                                {q.difficulty_level === 'easy' ? 'سهل' : q.difficulty_level === 'medium' ? 'متوسط' : 'صعب'}
                              </span>
                            )}
                            {bloom && (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${bloom.color}`}>
                                بلوم: {bloom.ar}
                              </span>
                            )}
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[q.status || 'draft']}`}>
                              {q.status === 'approved' ? '✓ معتمد' : q.status === 'review' ? '⏳ مراجعة' : q.status === 'rejected' ? '✗ مرفوض' : 'مسودة'}
                            </span>
                          </div>
                          
                          {/* نص السؤال */}
                          <MathRenderer text={q.question_text} className="text-sm font-medium leading-relaxed line-clamp-2 mt-2" />

                          {/* التسلسل التعليمي */}
                          <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                            {q.grades?.name_ar && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-full">{q.grades.name_ar}</span>
                            )}
                            {q.subjects?.name_ar && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-full">{q.subjects.icon} {q.subjects.name_ar}</span>
                            )}
                            {q.units?.name_ar && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-full">📦 {q.units.name_ar}</span>
                            )}
                            {q.lessons?.name_ar && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-full">📄 {q.lessons.name_ar}</span>
                            )}
                            <span className="mr-auto">{q.points} {q.points === 1 ? 'درجة' : 'درجات'} • استُخدم {q.usage_count} مرة</span>
                          </div>
                        </div>

                        {/* أزرار التحكم */}
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 md:border-r border-slate-100 pt-3 md:pt-0 md:pr-4 mt-3 md:mt-0 w-full md:w-auto">
                          {showApprovalActions && (
                            <QuestionApprovalButtons questionId={q.id} currentStatus={q.status || 'draft'} />
                          )}
                          <a
                            href={`${basePath}/${q.id}`}
                            className="text-xs text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors font-bold mr-auto md:mr-0"
                          >
                            تعديل السؤال
                          </a>
                          {showPrintButton && (
                            <a
                              href={`${basePath}/${q.id}/print`}
                              target="_blank"
                              className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors font-bold"
                            >
                              🖨️ طباعة
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* مودال التأكيد */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" dir="rtl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-center text-xl font-bold mb-2">تأكيد الحذف النهائي</h2>
            <p className="text-center text-slate-600 mb-6 leading-relaxed">
              هل أنت متأكد من أنك تريد حذف <span className="font-bold text-red-600">{selectedIds.length} سؤال</span> بشكل نهائي؟
              لا يمكن التراجع عن هذا الإجراء وسيتم مسحهم من قاعدة البيانات.
            </p>
            <div className="flex flex-row-reverse sm:flex-row gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                تراجع
              </button>
              <button
                disabled={isDeleting}
                onClick={(e) => { e.preventDefault(); handleBulkDelete(); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
