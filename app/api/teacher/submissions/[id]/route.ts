import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'صلاحية غير كافية' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Fetch attempt with student details
    const { data: attempt, error: attemptError } = await admin
      .from('exam_attempts')
      .select(
        `
        id, exam_id, student_id, score, percentage, is_passed, completed_at, started_at,
        time_spent_seconds, answers, feedback,
        students(profiles(full_name, avatar_url, email)),
        exams(id, title, total_points, passing_score, teacher_id, subjects(name_ar))
      `
      )
      .eq('id', params.id)
      .maybeSingle()

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'المحاولة غير موجودة' },
        { status: 404 }
      )
    }

    const exam = attempt.exams as any
    if (profile.role === 'teacher' && exam?.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بعرض نتائج هذا الاختبار' },
        { status: 403 }
      )
    }

    // Fetch exam questions with points
    const { data: examQuestions } = await admin
      .from('exam_questions')
      .select(
        `
        question_order, points_override,
        questions(id, question_type, question_text, context_passage, options, correct_answer, explanation, points, question_image_url)
      `
      )
      .eq('exam_id', attempt.exam_id)
      .order('question_order')

    // Fetch student_answers records
    const { data: studentAnswers } = await admin
      .from('student_answers')
      .select(
        'question_id, student_answer, answer_image_url, is_correct, score_awarded, teacher_feedback, ai_vision_feedback'
      )
      .eq('attempt_id', params.id)

    const answerMap = new Map(
      (studentAnswers || []).map((sa) => [sa.question_id, sa])
    )
    const rawAnswers = (attempt.answers as Record<string, string>) || {}

    const questionsWithDetails = (examQuestions || []).map((eq: any) => {
      const q = eq.questions
      const sa = answerMap.get(q.id)
      const studentAnswer = sa?.student_answer || rawAnswers[q.id] || ''
      const answerImageUrl =
        sa?.answer_image_url ||
        (studentAnswer.startsWith('[image:')
          ? studentAnswer.slice(7, -1)
          : null)

      let aiVisionData: any = null
      if (sa?.ai_vision_feedback) {
        try {
          aiVisionData =
            typeof sa.ai_vision_feedback === 'string'
              ? JSON.parse(sa.ai_vision_feedback)
              : sa.ai_vision_feedback
        } catch {
          aiVisionData = null
        }
      }

      return {
        id: q.id,
        order: eq.question_order,
        points: eq.points_override || q.points || 1,
        question_type: q.question_type,
        question_text: q.question_text,
        context_passage: q.context_passage,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        question_image_url: q.question_image_url,
        student_answer: studentAnswer,
        answer_image_url: answerImageUrl,
        is_correct: sa?.is_correct,
        score_awarded:
          sa?.score_awarded !== undefined && sa?.score_awarded !== null
            ? Number(sa.score_awarded)
            : sa?.is_correct
              ? eq.points_override || q.points || 1
              : 0,
        teacher_feedback: sa?.teacher_feedback || '',
        ai_vision_data: aiVisionData,
      }
    })

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        percentage: attempt.percentage,
        is_passed: attempt.is_passed,
        completed_at: attempt.completed_at,
        time_spent_seconds: attempt.time_spent_seconds,
        student_name: (attempt.students as any)?.profiles?.full_name || 'طالب',
        student_avatar: (attempt.students as any)?.profiles?.avatar_url,
        exam_title: exam?.title,
        exam_total_points: exam?.total_points,
        subject_name: exam?.subjects?.name_ar,
      },
      questions: questionsWithDetails,
    })
  } catch (error) {
    console.error('[Teacher Submission Detail] Error:', error)
    return NextResponse.json(
      { error: 'فشل جلب تفاصيل إجابات الطالب' },
      { status: 500 }
    )
  }
}
