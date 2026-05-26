'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  questions: any[]
  TYPE_LABELS: any
  DIFF_COLORS: any
  BLOOM_LABELS: any
  STATUS_STYLES: any
  basePath?: string
  showApprovalActions?: boolean
  showPrintButton?: boolean
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const router = useRouter()

  const handleCreateExam = () => {
    const selectedQs = questions.filter((q) => selectedIds.includes(q.id))
    sessionStorage.setItem(
      'pre_selected_exam_questions',
      JSON.stringify(selectedQs)
    )
    router.push('/teacher/exams/new')
  }

  // Handle individual checkbox toggle
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Handle "Select All" toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]) // Deselect all
    } else {
      setSelectedIds(questions.map((q) => q.id)) // Select all
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
      {/* ── الشريط العلوي للحذف الجماعي أو إنشاء اختبار (يظهر فقط إذا كان هناك تحديد) ── */}
      {selectedIds.length > 0 &&
        (basePath.includes('/teacher') ? (
          <div className="sticky top-[72px] z-20 mb-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-md animate-in slide-in-from-top-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-sm font-bold text-purple-900">سؤال محدد</p>
                <p className="text-xs text-purple-700">
                  هل تريد تكوين اختبار جديد باستخدام هذه الأسئلة؟
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto">
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-purple-600 transition-colors hover:bg-purple-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateExam}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-purple-700 md:w-auto"
              >
                📝 تكوين اختبار من الأسئلة المحددة ({selectedIds.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="sticky top-[72px] z-20 mb-4 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 shadow-md animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">سؤال محدد</p>
                <p className="text-xs text-red-700">
                  هل أنت متأكد من رغبتك في حذفهم نهائياً؟
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
              >
                إلغاء التحديد
              </button>
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                حذف المحددة
              </button>
            </div>
          </div>
        ))}

      {/* ── زر تحديد الكل ── */}
      <div className="mb-3 flex items-center gap-2 px-2">
        <input
          type="checkbox"
          id="select-all"
          checked={
            questions.length > 0 && selectedIds.length === questions.length
          }
          onChange={toggleSelectAll}
          className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-600"
        />
        <label
          htmlFor="select-all"
          className="cursor-pointer select-none text-sm font-bold text-slate-700"
        >
          تحديد جميع أسئلة الصفحة ({questions.length})
        </label>
      </div>

      <div className="relative space-y-6">
        {groups.map((group, groupIdx) => (
          <div
            key={`group-${groupIdx}`}
            className={
              group.passage
                ? 'rounded-3xl border border-slate-200 bg-slate-50/50 p-3 shadow-sm'
                : ''
            }
          >
            {group.passage && (
              <div className="relative mb-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm italic leading-relaxed text-indigo-950">
                <span className="absolute -top-3 right-4 rounded-full border border-indigo-200 bg-indigo-100 px-3 py-0.5 text-[10px] font-bold text-indigo-800">
                  القطعة المرجعية (مرتبط بها {group.questions.length} أسئلة)
                </span>
                <MathRenderer text={group.passage} />
              </div>
            )}
            <div className="space-y-2">
              {group.questions.map((q: any) => {
                const typeInfo = TYPE_LABELS[q.question_type] || {
                  label: q.question_type,
                  color: 'bg-slate-100 text-slate-700',
                }
                const bloom = q.bloom_level ? BLOOM_LABELS[q.bloom_level] : null
                const isSelected = selectedIds.includes(q.id)

                return (
                  <div
                    key={q.id}
                    className={`group flex items-stretch overflow-hidden rounded-2xl border bg-white transition-all ${isSelected ? 'border-blue-400 bg-blue-50/30 shadow-md ring-1 ring-blue-400' : 'border-border hover:border-primary/30'} `}
                  >
                    {/* Checkbox Column */}
                    <div
                      className={`flex w-14 shrink-0 cursor-pointer items-start justify-center border-l border-transparent pt-5 ${isSelected ? 'border-blue-100 bg-blue-50' : 'hover:bg-slate-50'} `}
                      onClick={() => toggleSelection(q.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(q.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 border-r border-slate-100 p-4 pl-4">
                      <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
                        <div className="min-w-0 flex-1">
                          {/* Badges row */}
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </span>
                            {q.difficulty_level && (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${DIFF_COLORS[q.difficulty_level]}`}
                              >
                                {q.difficulty_level === 'easy'
                                  ? 'سهل'
                                  : q.difficulty_level === 'medium'
                                    ? 'متوسط'
                                    : 'صعب'}
                              </span>
                            )}
                            {bloom && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${bloom.color}`}
                              >
                                بلوم: {bloom.ar}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[q.status || 'draft']}`}
                            >
                              {q.status === 'approved'
                                ? '✓ معتمد'
                                : q.status === 'review'
                                  ? '⏳ مراجعة'
                                  : q.status === 'rejected'
                                    ? '✗ مرفوض'
                                    : 'مسودة'}
                            </span>
                          </div>

                          {/* نص السؤال */}
                          <MathRenderer
                            text={q.question_text}
                            className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed"
                          />

                          {/* التسلسل التعليمي */}
                          <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                            {q.grades?.name_ar && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {q.grades.name_ar}
                              </span>
                            )}
                            {q.subjects?.name_ar && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {q.subjects.icon} {q.subjects.name_ar}
                              </span>
                            )}
                            {q.units?.name_ar && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                📦 {q.units.name_ar}
                              </span>
                            )}
                            {q.lessons?.name_ar && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                📄 {q.lessons.name_ar}
                              </span>
                            )}
                            <span className="mr-auto">
                              {q.points} {q.points === 1 ? 'درجة' : 'درجات'} •
                              استُخدم {q.usage_count} مرة
                            </span>
                          </div>
                        </div>

                        {/* أزرار التحكم */}
                        <div className="mt-3 flex w-full shrink-0 flex-row items-center gap-2 border-t border-slate-100 pt-3 md:mt-0 md:w-auto md:flex-col md:items-end md:border-r md:border-t-0 md:pr-4 md:pt-0">
                          {showApprovalActions && (
                            <QuestionApprovalButtons
                              questionId={q.id}
                              currentStatus={q.status || 'draft'}
                            />
                          )}
                          <a
                            href={`${basePath}/${q.id}`}
                            className="mr-auto rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 md:mr-0"
                          >
                            تعديل السؤال
                          </a>
                          {showPrintButton && (
                            <a
                              href={`${basePath}/${q.id}/print`}
                              target="_blank"
                              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            dir="rtl"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-center text-xl font-bold">
              تأكيد الحذف النهائي
            </h2>
            <p className="mb-6 text-center leading-relaxed text-slate-600">
              هل أنت متأكد من أنك تريد حذف{' '}
              <span className="font-bold text-red-600">
                {selectedIds.length} سؤال
              </span>{' '}
              بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسحهم من قاعدة
              البيانات.
            </p>
            <div className="flex flex-row-reverse gap-3 sm:flex-row">
              <button
                disabled={isDeleting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                تراجع
              </button>
              <button
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault()
                  handleBulkDelete()
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
