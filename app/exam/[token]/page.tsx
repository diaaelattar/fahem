// app/exam/[token]/page.tsx
// صفحة استقبال الضيف — عامة بدون auth
// تعرض: بيانات الاختبار + إدخال الاسم + زر البدء

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  Clock,
  ClipboardList,
  BookOpen,
  GraduationCap,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react'
import { GuestExamStartForm } from './GuestExamStartForm'

interface Props {
  params: { token: string }
}

export const dynamic = 'force-dynamic'

export default async function GuestExamLandingPage({ params }: Props) {
  const supabase = await createClient()

  // جلب بيانات التوكن والاختبار
  const { data: tokenData, error } = await supabase
    .from('exam_share_tokens')
    .select(
      `
      id, token, is_active, expires_at,
      exams(
        id, title, duration_minutes, total_points, passing_score,
        instructions, questions_count,
        subjects(name_ar),
        grades(name_ar)
      )
    `
    )
    .eq('token', params.token)
    .single()

  // توكن غير موجود
  if (error || !tokenData) {
    return <InvalidTokenPage reason="لم يتم العثور على هذا الرابط" />
  }

  // توكن معطل
  if (!tokenData.is_active) {
    return <InvalidTokenPage reason="هذا الرابط غير نشط حالياً. تواصل مع معلمك." />
  }

  // توكن منتهي الصلاحية
  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return <InvalidTokenPage reason="انتهت صلاحية هذا الرابط." />
  }

  const exam = tokenData.exams as any

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        {/* شعار المنصة */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm border border-slate-100">
            <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-slate-800 text-sm">استباق</span>
          </div>
        </div>

        {/* البطاقة الرئيسية */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
          {/* Header ملوّن */}
          <div className="bg-gradient-to-l from-emerald-600 to-teal-600 p-8 text-white">
            <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              اختبار مشارك
            </div>
            <h1 className="text-2xl font-black leading-tight">{exam.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
              {exam.subjects?.name_ar && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {exam.subjects.name_ar}
                </span>
              )}
              {exam.grades?.name_ar && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {exam.grades.name_ar}
                </span>
              )}
            </div>
          </div>

          {/* إحصائيات الاختبار */}
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-100 border-b border-slate-100">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {exam.duration_minutes}
              </div>
              <div className="text-xs font-bold text-slate-500">دقيقة</div>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {exam.questions_count || '—'}
              </div>
              <div className="text-xs font-bold text-slate-500">سؤال</div>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {exam.passing_score || 50}%
              </div>
              <div className="text-xs font-bold text-slate-500">للنجاح</div>
            </div>
          </div>

          {/* التعليمات */}
          {exam.instructions && (
            <div className="border-b border-slate-100 bg-amber-50 p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                تعليمات الاختبار
              </p>
              <p className="text-sm leading-relaxed text-amber-900">
                {exam.instructions}
              </p>
            </div>
          )}

          {/* نموذج البدء */}
          <div className="p-6">
            <GuestExamStartForm token={params.token} examId={exam.id} />
          </div>

          {/* تذكير */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-center text-xs text-slate-500">
              🔒 اختبار للمشاركة — لا تحتاج لحساب. اسمك فقط يكفي.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// مكوّن صفحة الخطأ
function InvalidTokenPage({ reason }: { reason: string }) {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-100">
          <AlertCircle className="h-12 w-12 text-rose-500" />
        </div>
        <h1 className="mb-3 text-2xl font-black text-slate-800">
          رابط غير صالح
        </h1>
        <p className="mb-8 text-slate-500">{reason}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          العودة للرئيسية
        </a>
      </div>
    </div>
  )
}
