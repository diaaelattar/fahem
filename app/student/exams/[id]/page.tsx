'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamRedirectPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()

  useEffect(() => {
    // التوجيه الإجباري من جهة العميل لتفادي أي مشاكل في الكاش
    router.replace(`/student/exams/${params.id}/start`)
  }, [params.id, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <span className="ml-3 font-bold text-muted-foreground">
        جاري تحويلك للاختبار...
      </span>
    </div>
  )
}
