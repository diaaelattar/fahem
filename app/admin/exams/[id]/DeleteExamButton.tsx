'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  examId: string
  examTitle: string
}

export function DeleteExamButton({ examId, examTitle }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        `هل أنت متأكد من حذف "${examTitle}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`
      )
    )
      return
    setDeleting(true)

    try {
      const res = await fetch('/api/exams/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: examId }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert('فشل الحذف: ' + (data.error || 'خطأ غير معروف'))
        setDeleting(false)
        return
      }
      // Hard navigate to bypass client cache
      window.location.href = '/admin/exams'
    } catch (e: any) {
      alert('خطأ في الاتصال: ' + e.message)
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {deleting ? 'جاري الحذف...' : 'حذف الاختبار'}
    </button>
  )
}
