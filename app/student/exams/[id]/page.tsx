'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    // التوجيه الإجباري من جهة العميل لتفادي أي مشاكل في الكاش
    router.replace(`/student/exams/${params.id}/start`)
  }, [params.id, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-3 font-bold text-muted-foreground">جاري تحويلك للاختبار...</span>
    </div>
  )
}
