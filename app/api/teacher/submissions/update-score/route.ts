import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Verify teacher profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'صلاحية غير كافية، يتطلب حساب معلم' },
        { status: 403 }
      )
    }

    const { attemptId, questionId, scoreAwarded, teacherFeedback } =
      await req.json()

    if (!attemptId || !questionId || scoreAwarded === undefined) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 🔒 التحقق من ملكية المعلم للاختبار
    const { data: attempt } = await admin
      .from('exam_attempts')
      .select('id, exam_id, exams(id, teacher_id, total_points, passing_score)')
      .eq('id', attemptId)
      .maybeSingle()

    if (!attempt) {
      return NextResponse.json(
        { error: 'محاولة الاختبار غير موجودة' },
        { status: 404 }
      )
    }

    const exam = attempt.exams as any
    if (profile.role === 'teacher' && exam?.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بتعديل درجات هذا الاختبار' },
        { status: 403 }
      )
    }

    // جلب درجة السؤال القصوى للتأكد من عدم تجاوزها
    const { data: examQuestion } = await admin
      .from('exam_questions')
      .select('points_override, questions(points)')
      .eq('exam_id', attempt.exam_id)
      .eq('question_id', questionId)
      .maybeSingle()

    const maxQuestionPoints =
      examQuestion?.points_override ||
      (examQuestion?.questions as any)?.points ||
      1
    const finalScore = Math.max(0, Math.min(Number(scoreAwarded), maxQuestionPoints))

    // تحديث إجابة السؤال في student_answers
    const isCorrect = finalScore >= maxQuestionPoints * 0.5

    const { error: updateAnsError } = await admin
      .from('student_answers')
      .update({
        score_awarded: finalScore,
        teacher_feedback: teacherFeedback || null,
        is_correct: isCorrect,
      })
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)

    if (updateAnsError) {
      console.error('[Teacher Update Score] Failed to update answer:', updateAnsError)
      return NextResponse.json(
        { error: 'فشل تحديث إجابة السؤال' },
        { status: 500 }
      )
    }

    // ⚡ إعادة احتساب المجموع الكلي لمحاولة الطالب بدقة
    const { data: allAnswers } = await admin
      .from('student_answers')
      .select('score_awarded')
      .eq('attempt_id', attemptId)

    const newTotalScore = (allAnswers || []).reduce(
      (sum, a) => sum + (Number(a.score_awarded) || 0),
      0
    )

    const totalExamPoints = Number(exam?.total_points) || 1
    const newPercentage = Math.min(
      100,
      Math.round((newTotalScore / totalExamPoints) * 100 * 10) / 10
    )
    const passingScore = exam?.passing_score ?? totalExamPoints * 0.5
    const isPassed = newTotalScore >= passingScore

    // تحديث المحاولة في exam_attempts
    const { error: updateAttemptError } = await admin
      .from('exam_attempts')
      .update({
        score: newTotalScore,
        percentage: newPercentage,
        is_passed: isPassed,
      })
      .eq('id', attemptId)

    if (updateAttemptError) {
      console.error(
        '[Teacher Update Score] Failed to update attempt totals:',
        updateAttemptError
      )
    }

    return NextResponse.json({
      success: true,
      newTotalScore,
      newPercentage,
      isPassed,
      updatedQuestion: {
        questionId,
        scoreAwarded: finalScore,
        teacherFeedback,
        isCorrect,
      },
    })
  } catch (error) {
    console.error('[Teacher Update Score] Error:', error)
    return NextResponse.json(
      {
        error: 'حدث خطأ في الخادم أثناء تحديث الدرجة',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
