import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash']

function getModel(name: string) {
  return new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  ).getGenerativeModel({ 
    model: name,
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
  })
}

const normalizeArabic = (text: string) => {
  if (!text) return ''
  return text.trim().toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { attemptId } = await req.json()
    if (!attemptId) return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 })

    // 1. Fetch Attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .select('*, exams(total_points, passing_score)')
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) throw new Error('Attempt not found')
    if (attempt.completed_at) return NextResponse.json({ error: 'Already graded' }, { status: 400 })

    const examData = attempt.exams as any
    const answers = attempt.answers as Record<string, string> || {}

    // 2. Fetch Questions
    const { data: examQuestions } = await supabase
      .from('exam_questions')
      .select('questions(id, question_type, correct_answer, points, question_text, explanation)')
      .eq('exam_id', attempt.exam_id)

    if (!examQuestions) throw new Error('Questions not found')

    let totalScore = 0
    let studentAnswersPayload: any[] = []

    // 3. Evaluate each answer
    for (const eq of examQuestions) {
      const q = eq.questions as any
      if (!q) continue

      const studentAns = answers[q.id]
      let isCorrect = false
      let scoreAwarded = 0
      let aiFeedback = null

      if (!studentAns) {
        // Unanswered
      } else if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        // Exact Match
        if (studentAns.trim() === q.correct_answer?.trim()) {
          isCorrect = true
          scoreAwarded = q.points
        }
      } else if (q.question_type === 'fill_blank') {
        // Normalized Match
        if (normalizeArabic(studentAns) === normalizeArabic(q.correct_answer)) {
          isCorrect = true
          scoreAwarded = q.points
        }
      } else if (q.question_type === 'essay' || q.question_type === 'correction') {
        // AI Semantic Grading
        const prompt = `أنت مصحح امتحانات مصري خبير.
قم بتقييم إجابة الطالب التالية بناءً على الإجابة النموذجية. 
لا تتشدد في المطابقة الحرفية بل قيم "دلالة وفهم" الطالب.
السؤال: ${q.question_text}
الإجابة النموذجية أو القاعدة: ${q.correct_answer}
إجابة الطالب: ${studentAns}
الدرجة الكلية للسؤال: ${q.points}

أرجع التقييم حصرياً بصيغة JSON كالتالي فقط بدون أي نصوص إضافية:
{
  "is_correct": boolean,
  "score_awarded": number (min 0, max ${q.points}, use integers or 0.5 steps),
  "feedback": "رسالة مشجعة للطالب تشرح له لماذا أخذ هذه الدرجة (بالعربية الفصحى أو المصرية المبسطة)"
}`

        let aiResultStr = ''
        for (const modelName of MODELS) {
          try {
            const model = getModel(modelName)
            const result = await model.generateContent(prompt)
            aiResultStr = result.response.text().trim()
            // clean json markdown if present
            if (aiResultStr.startsWith('\`\`\`json')) {
              aiResultStr = aiResultStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim()
            }
            break
          } catch (e) {
            console.warn(`Model ${modelName} failed grading:`, e)
          }
        }

        try {
          const aiEval = JSON.parse(aiResultStr)
          isCorrect = aiEval.is_correct || aiEval.score_awarded > 0
          scoreAwarded = Math.min(q.points, Math.max(0, Number(aiEval.score_awarded) || 0))
          aiFeedback = aiEval.feedback
        } catch (e) {
          console.error("Failed to parse AI grading:", aiResultStr)
          // Fallback to strict check if AI fails
          if (normalizeArabic(studentAns) === normalizeArabic(q.correct_answer)) {
            isCorrect = true
            scoreAwarded = q.points
          }
        }
      }

      totalScore += scoreAwarded

      studentAnswersPayload.push({
        attempt_id: attemptId,
        student_id: user.id,
        exam_id: attempt.exam_id,
        question_id: q.id,
        student_answer: studentAns,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        teacher_feedback: aiFeedback // Save AI feedback here
      })
    }

    // 4. Calculate Final Result
    const passingScore = examData.passing_score || (examData.total_points / 2)
    const percentage = examData.total_points > 0 ? (totalScore / examData.total_points) * 100 : 0
    const isPassed = percentage >= passingScore

    // 5. Update Attempt in DB
    const { error: updateError } = await supabase
      .from('exam_attempts')
      .update({
        score: totalScore,
        percentage: percentage,
        is_passed: isPassed,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId)

    if (updateError) throw updateError

    // 6. Save detailed student answers
    if (studentAnswersPayload.length > 0) {
      await supabase.from('student_answers').upsert(studentAnswersPayload, { onConflict: 'attempt_id,question_id' })
    }

    return NextResponse.json({
      success: true,
      score: totalScore,
      total: examData.total_points,
      percentage,
      is_passed: isPassed
    })

  } catch (error: any) {
    console.error('Exam AI grading error:', error)
    return NextResponse.json(
      { error: error.message || 'خطأ في التقييم' },
      { status: 500 }
    )
  }
}
