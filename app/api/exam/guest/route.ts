// app/api/exam/guest/route.ts
// API موحد لتدفق الاختبار الضيف — بدون auth
// يدعم: start / autosave / submit

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// تحقق من صحة رابط التوكن
async function validateToken(supabase: any, token: string) {
  const { data, error } = await supabase
    .from('exam_share_tokens')
    .select(
      `
      id, exam_id, is_active, expires_at,
      exams(
        id, title, duration_minutes, total_points, passing_score,
        instructions, subjects(name_ar), grades(name_ar), questions_count
      )
    `
    )
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !data) return { valid: false, error: 'رابط الاختبار غير صالح أو منتهي' }
  if (data.expires_at && new Date(data.expires_at) < new Date())
    return { valid: false, error: 'انتهت صلاحية رابط الاختبار' }

  return { valid: true, tokenData: data }
}

// احسب الدرجة من الإجابات
function calculateScore(
  answers: Record<string, string>,
  questionsWithAnswers: any[]
) {
  const normalizeArabic = (text: string) => {
    if (!text) return ''
    return text
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .replace(/[,،\-_/\\.:؛"']/g, ' ')
      .replace(/\s+/g, ' ')
  }

  const checkAnswer = (
    studentAns: string,
    correctAns: string,
    type: string
  ): boolean => {
    if (!studentAns || !correctAns) return false
    if (type === 'true_false') {
      const isStudentTrue =
        studentAns === 'صح' || studentAns.toLowerCase() === 'true'
      const isCorrectTrue =
        correctAns === 'صح' || correctAns.toLowerCase() === 'true'
      const isStudentFalse =
        studentAns === 'خطأ' || studentAns.toLowerCase() === 'false'
      const isCorrectFalse =
        correctAns === 'خطأ' || correctAns.toLowerCase() === 'false'
      return (
        (isStudentTrue && isCorrectTrue) || (isStudentFalse && isCorrectFalse)
      )
    }
    const ns = normalizeArabic(studentAns)
    const nc = normalizeArabic(correctAns)
    if (type === 'mcq') return ns === nc
    if (ns === nc) return true
    if (nc.length >= 3 && ns.includes(nc)) return true
    if (ns.length >= 3 && nc.includes(ns)) return true
    const sw = ns.split(/\s+/).filter((w) => w.length >= 2)
    const cw = nc.split(/\s+/).filter((w) => w.length >= 2)
    if (sw.length > 0 && cw.length > 0) {
      const common = cw.filter((w) => sw.includes(w))
      if (sw.length <= 2 && common.length === sw.length) return true
      if (common.length / cw.length >= 0.4 || common.length / sw.length >= 0.5)
        return true
    }
    return false
  }

  let totalScore = 0
  let totalPoints = 0
  const feedback: Record<string, any> = {}

  for (const q of questionsWithAnswers) {
    const points = q.points_override || q.questions?.points || 1
    totalPoints += points
    const studentAnswer = answers[q.questions?.id] || ''
    const isCorrect = checkAnswer(
      studentAnswer,
      q.questions?.correct_answer || '',
      q.questions?.question_type || 'mcq'
    )
    if (isCorrect) totalScore += points
    feedback[q.questions?.id] = {
      is_correct: isCorrect,
      student_answer: studentAnswer,
      correct_answer: q.questions?.correct_answer,
      explanation: q.questions?.explanation,
      points_awarded: isCorrect ? points : 0,
      points_possible: points,
    }
  }

  const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0
  return { totalScore, totalPoints, percentage, feedback }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // استخدام service role client للوصول بدون auth
    const supabase = await createClient()

    // ── START: بدء اختبار جديد ──────────────────────────────────────────
    if (action === 'start') {
      const { token, guestName } = body

      if (!token || !guestName?.trim()) {
        return NextResponse.json(
          { error: 'يرجى إدخال اسمك قبل البدء' },
          { status: 400 }
        )
      }

      const { valid, error: tokenError, tokenData } = await validateToken(supabase, token)
      if (!valid) {
        return NextResponse.json({ error: tokenError }, { status: 400 })
      }

      const exam = tokenData!.exams as any

      // جلب الأسئلة بدون الإجابات الصحيحة
      const { data: examQuestions } = await supabase
        .from('exam_questions')
        .select(
          'question_order, points_override, questions(id, question_type, context_passage, question_text, options, points, question_image_url)'
        )
        .eq('exam_id', exam.id)
        .order('question_order')

      const questions = (examQuestions || [])
        .filter((eq: any) => eq.questions !== null)
        .sort((a: any, b: any) => a.question_order - b.question_order)
        .map((eq: any) => ({
          id: eq.questions.id,
          question_type: eq.questions.question_type,
          context_passage: eq.questions.context_passage,
          question_text: eq.questions.question_text,
          options: eq.questions.options,
          points: eq.points_override || Math.max(1, eq.questions.points || 1),
          question_image_url: eq.questions.question_image_url,
          question_order: eq.question_order,
        }))

      // إنشاء محاولة ضيف جديدة
      const { data: attempt, error: insertError } = await supabase
        .from('guest_exam_attempts')
        .insert({
          token_id: tokenData!.id,
          exam_id: exam.id,
          guest_name: guestName.trim(),
          answers: {},
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError || !attempt) {
        return NextResponse.json(
          { error: 'حدث خطأ أثناء بدء الاختبار' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        attemptId: attempt.id,
        exam: {
          id: exam.id,
          title: exam.title,
          duration_minutes: exam.duration_minutes,
          total_points: exam.total_points,
          passing_score: exam.passing_score,
          instructions: exam.instructions,
          subject: (exam.subjects as any)?.name_ar,
          grade: (exam.grades as any)?.name_ar,
        },
        questions,
      })
    }

    // ── AUTOSAVE: حفظ تلقائي ────────────────────────────────────────────
    if (action === 'autosave') {
      const { attemptId, answers } = body

      if (!attemptId) {
        return NextResponse.json({ error: 'معرّف المحاولة مفقود' }, { status: 400 })
      }

      // تحقق أن المحاولة غير مكتملة
      const { data: attempt } = await supabase
        .from('guest_exam_attempts')
        .select('id, completed_at')
        .eq('id', attemptId)
        .single()

      if (!attempt || attempt.completed_at) {
        return NextResponse.json(
          { error: 'المحاولة غير موجودة أو مكتملة بالفعل' },
          { status: 400 }
        )
      }

      await supabase
        .from('guest_exam_attempts')
        .update({ answers: answers || {} })
        .eq('id', attemptId)

      return NextResponse.json({ success: true })
    }

    // ── SUBMIT: تسليم الاختبار ───────────────────────────────────────────
    if (action === 'submit') {
      const { attemptId, answers } = body

      if (!attemptId) {
        return NextResponse.json({ error: 'معرّف المحاولة مفقود' }, { status: 400 })
      }

      // جلب بيانات المحاولة
      const { data: attempt } = await supabase
        .from('guest_exam_attempts')
        .select('id, exam_id, completed_at, started_at')
        .eq('id', attemptId)
        .single()

      if (!attempt) {
        return NextResponse.json({ error: 'المحاولة غير موجودة' }, { status: 404 })
      }

      if (attempt.completed_at) {
        // المحاولة مكتملة بالفعل — أعد النتيجة المحفوظة
        const { data: completedAttempt } = await supabase
          .from('guest_exam_attempts')
          .select('score, percentage, is_passed, feedback, answers')
          .eq('id', attemptId)
          .single()

        return NextResponse.json({ result: completedAttempt, alreadyCompleted: true })
      }

      // جلب الأسئلة مع الإجابات الصحيحة للتصحيح
      const { data: examQuestions } = await supabase
        .from('exam_questions')
        .select(
          'question_order, points_override, questions(id, question_type, correct_answer, explanation, points, question_text, options, context_passage, question_image_url)'
        )
        .eq('exam_id', attempt.exam_id)
        .order('question_order')

      if (!examQuestions || examQuestions.length === 0) {
        return NextResponse.json({ error: 'لا توجد أسئلة في هذا الاختبار' }, { status: 400 })
      }

      // جلب بيانات الاختبار للحصول على درجة النجاح
      const { data: exam } = await supabase
        .from('exams')
        .select('passing_score, total_points, title, subjects(name_ar), grades(name_ar)')
        .eq('id', attempt.exam_id)
        .single()

      // حساب الدرجة
      const { totalScore, totalPoints, percentage, feedback } = calculateScore(
        answers || {},
        examQuestions as any[]
      )

      const passingScore = exam?.passing_score || 50
      const isPassed = percentage >= passingScore

      const timeSpent = Math.floor(
        (Date.now() - new Date(attempt.started_at).getTime()) / 1000
      )

      // تحديث المحاولة بالنتيجة النهائية
      await supabase
        .from('guest_exam_attempts')
        .update({
          answers: answers || {},
          score: totalScore,
          percentage: Math.round(percentage * 100) / 100,
          is_passed: isPassed,
          feedback,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)

      // بناء قائمة الأسئلة مع المراجعة الكاملة
      const questionsReview = (examQuestions as any[])
        .filter((eq) => eq.questions !== null)
        .sort((a, b) => a.question_order - b.question_order)
        .map((eq) => {
          const q = eq.questions
          const fb = feedback[q.id]
          return {
            id: q.id,
            question_type: q.question_type,
            context_passage: q.context_passage,
            question_text: q.question_text,
            options: q.options,
            points: eq.points_override || Math.max(1, q.points || 1),
            question_image_url: q.question_image_url,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            student_answer: fb?.student_answer || '',
            is_correct: fb?.is_correct || false,
            points_awarded: fb?.points_awarded || 0,
          }
        })

      return NextResponse.json({
        result: {
          score: totalScore,
          total_points: totalPoints,
          percentage: Math.round(percentage * 100) / 100,
          is_passed: isPassed,
          time_spent_seconds: timeSpent,
          exam_title: exam?.title,
          subject: (exam?.subjects as any)?.name_ar,
          grade: (exam?.grades as any)?.name_ar,
        },
        questionsReview,
      })
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
  } catch (err) {
    console.error('[Guest Exam API]', err)
    return NextResponse.json(
      { error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    )
  }
}
