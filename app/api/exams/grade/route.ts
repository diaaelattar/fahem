import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash']

function getModel(name: string) {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4
  ].filter(Boolean) as string[]
  
  const selectedKey = keys[Math.floor(Math.random() * keys.length)] || ''

  return new GoogleGenerativeAI(selectedKey).getGenerativeModel({ 
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

/**
 * تحقق من صحة إجابة الطالب بمنطق مرن يقبل الإجابات القريبة والمختصرة
 */
const checkAnswer = (studentAns: string, correctAns: string, type: string): boolean => {
  if (!studentAns || !correctAns) return false

  if (type === 'true_false') {
    const isStudentTrue  = studentAns === 'صح'  || studentAns.toLowerCase() === 'true'
    const isCorrectTrue  = correctAns  === 'صح'  || correctAns.toLowerCase()  === 'true'
    const isStudentFalse = studentAns === 'خطأ' || studentAns.toLowerCase() === 'false'
    const isCorrectFalse = correctAns  === 'خطأ' || correctAns.toLowerCase()  === 'false'
    return (isStudentTrue && isCorrectTrue) || (isStudentFalse && isCorrectFalse)
  }

  const ns = normalizeArabic(studentAns)
  const nc = normalizeArabic(correctAns)

  if (type === 'mcq') return ns === nc

  // --- مرن للإكمال والمقالة والتصحيح ---

  // تطابق تام
  if (ns === nc) return true

  // الإجابة تحتوي على الإجابة الصحيحة بالكامل (مع حد أدنى 3 أحرف لتجنب التطابق العرضي)
  if (nc.length >= 3 && ns.includes(nc)) return true
  // الإجابة الصحيحة تحتوي على إجابة الطالب
  if (ns.length >= 3 && nc.includes(ns)) return true

  // تحليل الكلمات
  const sw = ns.split(/\s+/).filter(w => w.length >= 2)
  const cw = nc.split(/\s+/).filter(w => w.length >= 2)

  if (sw.length > 0 && cw.length > 0) {
    const common = cw.filter(w => sw.includes(w))

    // إجابة مختصرة (1-2 كلمة) وجميع كلماتها موجودة في الإجابة الصحيحة
    if (sw.length <= 2 && common.length === sw.length) return true

    const ratioCorrect = common.length / cw.length
    const ratioStudent = common.length / sw.length

    // نسبة 40٪ من كلمات الإجابة الصحيدة موجودة، أو 50٪ من كلمات الطالب صحيحة
    if (ratioCorrect >= 0.4 || ratioStudent >= 0.5) return true
  }

  return false
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
      .select('points_override, questions(id, question_type, correct_answer, points, question_text, explanation)')
      .eq('exam_id', attempt.exam_id)

    if (!examQuestions) throw new Error('Questions not found')

    let totalScore = 0
    let pointsToExclude = 0
    let studentAnswersPayload: any[] = []

    // 3. Evaluate each answer
    for (const eq of examQuestions) {
      const q = eq.questions as any
      if (!q) continue

      const qPoints = eq.points_override || Math.max(1, q.points || 1)
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
          scoreAwarded = qPoints
        }
      } else if (q.question_type === 'fill_blank') {
        // Lenient match — accepts short, partial, and close answers
        if (checkAnswer(studentAns, q.correct_answer, 'fill_blank')) {
          isCorrect = true
          scoreAwarded = qPoints
        }
      } else if (q.question_type === 'essay' || q.question_type === 'correction') {
        // AI Semantic Grading
        const prompt = `أنت مصحح امتحانات مصري خبير ومتساهل في التصحيح.

قم بتقييم إجابة الطالب بناءً على الإجابة النموذجية مع مراعاة هذه القواعد:
- الإجابة المختصرة التي تحمل نفس المعنى تُعتبر صحيحة
- الإجابة بصياغة مختلفة لكن بنفس الفكرة تُعتبر صحيحة أو شبه صحيحة
- الأخطاء الإملائية البسيطة لا تُخصم درجات
- إذا أجاب الطالب بجزء صحيح من الإجابة، أعطه درجة جزئية تناسب ما أجاب عنه
- لا تتشدد في المطابقة الحرفية، قيّم الفهم والمعنى
- إذا كانت الإجابة تحتوي على الفكرة الأساسية ولو بشكل مختصر فهي صحيحة

السؤال: ${q.question_text}
الإجابة النموذجية أو القاعدة: ${q.correct_answer}
إجابة الطالب: ${studentAns}
الدرجة الكلية للسؤال: ${qPoints}

أرجع التقييم حصرياً بصيغة JSON كالتالي فقط بدون أي نصوص إضافية:
{
  "is_correct": boolean,
  "score_awarded": number (min 0, max ${qPoints}, use integers or 0.5 steps),
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
          scoreAwarded = Math.min(qPoints, Math.max(0, Number(aiEval.score_awarded) || 0))
          aiFeedback = aiEval.feedback
        } catch (e) {
          console.error("Failed to parse AI grading:", aiResultStr)
          // Fallback: AI Busy -> Exclude from total points
          aiFeedback = 'تعذر التصحيح نظراً لانشغال المساعد الذكي. (تم استبعاد هذا السؤال من التقييم ولن يؤثر على درجاتك)'
          scoreAwarded = 0
          isCorrect = true // Show as "neutral" or not explicitly red
          pointsToExclude += qPoints
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
    const originalTotalPoints = examQuestions.reduce((sum, eq) => sum + Math.max(1, eq.points_override || (eq.questions as any)?.points || 1), 0)
    let finalTotalPoints = originalTotalPoints - pointsToExclude
    if (finalTotalPoints <= 0) finalTotalPoints = 1 // Prevent division by zero

    // نسبة النجاح (مثلاً إذا استبعدنا أسئلة، نعتمد على النسبة المئوية بدلاً من الدرجة المطلقة)
    const percentage = finalTotalPoints > 0 ? (totalScore / finalTotalPoints) * 100 : 0
    const passThreshold = examData.passing_score ? (examData.passing_score / originalTotalPoints) * 100 : 50
    const isPassed = percentage >= passThreshold

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
      total: finalTotalPoints,
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
