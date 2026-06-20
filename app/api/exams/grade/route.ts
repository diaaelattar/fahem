import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkAnswer } from '@/lib/utils/grading'

interface ExamQuestionRow {
  points_override?: number | null
  questions: {
    id: string
    question_type: string
    correct_answer: string | null
    points: number | null
    question_text: string
    explanation: string | null
  } | null
}

interface StudentAnswerPayload {
  attempt_id: string
  student_id: string
  exam_id: string
  question_id: string
  student_answer: string
  is_correct: boolean
  score_awarded: number
  teacher_feedback: string | null
  answer_image_url: string | null
  grading_method: 'image' | 'auto'
}

// ❌ لا تستخدم 'edge' runtime — Buffer غير متاح في Edge ويُسبب crash عند معالجة الصور
// export const runtime = 'edge'

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash']

function getModel(name: string) {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4,
  ].filter(Boolean) as string[]

  const selectedKey = keys[Math.floor(Math.random() * keys.length)] || ''

  return new GoogleGenerativeAI(selectedKey).getGenerativeModel({
    model: name,
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
  })
}

async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  // استخدام Buffer (Node.js runtime) — لا تعمل مع Edge runtime
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return { data: base64, mimeType: contentType.split(';')[0] }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // إعادة 401 مع Retry-After header لمساعدة الـ client على معالجة انتهاء JWT
      return NextResponse.json(
        { error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' },
        { status: 401, headers: { 'Retry-After': '0' } }
      )
    }

    const studentId = user.id

    const body = await req.json()
    const { attemptId, imageAnswers: clientImageAnswers } = body
    if (!attemptId)
      return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 })

    // 1. Fetch Attempt — مع التحقق من ملكية الطالب للمحاولة (أمان)
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .select('*, exams(total_points, passing_score)')
      .eq('id', attemptId)
      .eq('student_id', user.id) // 🔒 تحقق من أن المحاولة تعود للطالب الحالي
      .single()

    if (attemptError || !attempt) throw new Error('Attempt not found')
    if (attempt.completed_at)
      return NextResponse.json({ error: 'Already graded' }, { status: 400 })

    const examData = attempt.exams as unknown as {
      total_points: number
      passing_score: number | null
    } | null
    const answers = (attempt.answers as Record<string, string>) || {}
    // Image answers: either from client payload or from saved attempt
    const imageAnswers: Record<string, string> =
      clientImageAnswers ||
      (attempt as unknown as { answer_images?: Record<string, string> })
        .answer_images ||
      {}

    // Pre-load already-graded image answers from student_answers table
    const { data: existingImageGrades } = await supabase
      .from('student_answers')
      .select(
        'question_id, score_awarded, is_correct, teacher_feedback, grading_method'
      )
      .eq('attempt_id', attemptId)
      .eq('grading_method', 'image')

    const imageGradeMap: Record<
      string,
      {
        score_awarded: number
        is_correct: boolean
        teacher_feedback: string | null
      }
    > = {}
    if (existingImageGrades) {
      for (const row of existingImageGrades) {
        imageGradeMap[row.question_id] = {
          score_awarded: row.score_awarded || 0,
          is_correct: row.is_correct || false,
          teacher_feedback: row.teacher_feedback,
        }
      }
    }

    // 2. Fetch Questions — مع Pagination لتجنب بطء الامتحانات الكبيرة (إصلاح م1)
    const PAGE_SIZE = 50
    let allExamQuestions: ExamQuestionRow[] = []
    let from = 0
    let hasMore = true

    while (hasMore) {
      const { data: page, error: pageError } = await supabase
        .from('exam_questions')
        .select(
          'points_override, questions(id, question_type, correct_answer, points, question_text, explanation)'
        )
        .eq('exam_id', attempt.exam_id)
        .range(from, from + PAGE_SIZE - 1)

      if (pageError) throw pageError
      if (!page || page.length === 0) break

      allExamQuestions = [...allExamQuestions, ...page]
      if (page.length < PAGE_SIZE) hasMore = false
      from += PAGE_SIZE
    }

    const examQuestions = allExamQuestions
    if (!examQuestions.length) throw new Error('Questions not found')

    let totalScore = 0
    let pointsToExclude = 0
    const studentAnswersPayload: StudentAnswerPayload[] = []

    // ─── دالة مساعدة لتصحيح سؤال واحد (تُستدعى بـ Promise.all) ─────────────
    const evaluateQuestion = async (
      eq: ExamQuestionRow
    ): Promise<{
      totalScore: number
      pointsToExclude: number
      payload: StudentAnswerPayload | null
      skipPayload: boolean
    }> => {
      const q = eq.questions
      if (!q)
        return {
          totalScore: 0,
          pointsToExclude: 0,
          payload: null,
          skipPayload: true,
        }

      const qPoints = eq.points_override || Math.max(1, q.points || 1)
      let studentAns = answers[q.id]
      let isCorrect = false
      let scoreAwarded = 0
      let aiFeedback = null

      const hasImageAnswer = imageAnswers[q.id] || imageGradeMap[q.id]

      if (!studentAns && !hasImageAnswer) {
        // Unanswered
      } else if (
        (q.question_type === 'essay' || q.question_type === 'correction') &&
        hasImageAnswer &&
        imageGradeMap[q.id]
      ) {
        // ── Image-graded: use pre-saved vision AI result ──
        const preGraded = imageGradeMap[q.id]
        isCorrect = preGraded.is_correct
        scoreAwarded = Math.min(qPoints, Math.max(0, preGraded.score_awarded))
        aiFeedback = preGraded.teacher_feedback
        return {
          totalScore: scoreAwarded,
          pointsToExclude: 0,
          payload: null,
          skipPayload: true,
        }
      } else if (
        (q.question_type === 'essay' || q.question_type === 'correction') &&
        hasImageAnswer &&
        !imageGradeMap[q.id]
      ) {
        // ── Grade handwritten image answer using Gemini Vision ──
        const imageUrl = imageAnswers[q.id]
        if (imageUrl) {
          try {
            const imageData = await fetchImageAsBase64(imageUrl)
            const visionPrompt = `أنت مصحح امتحانات خبير متخصص في المناهج المصرية. مهمتك قراءة إجابة طالب مكتوبة بخط اليد وتقييمها.

## بيانات التقييم:
- **السؤال:** ${q.question_text}
- **الإجابة النموذجية:** ${q.correct_answer || 'لا توجد إجابة نموذجية محددة، قيّم بناءً على صحة الحل الرياضي والعلمي'}
- **الدرجة العظمى:** ${qPoints}

## تعليمات التصحيح:
1. **اقرأ خط اليد بعناية** - إذا كان خط اليد غير واضح في مكان ما، قدّر الأفضل
2. **للرياضيات:** تحقق من صحة الخطوات والناتج النهائي. الطالب يستحق درجة كاملة إذا وصل للإجابة الصحيحة حتى لو كانت الطريقة مختلفة
3. **الدرجات الجزئية مسموحة** - أعطِ درجة تتناسب مع مدى اكتمال وصحة الإجابة
4. **لا تتشدد** في المطابقة الحرفية، قيّم الفهم والمنطق
5. **اكتب ما قرأته** من الصورة في حقل extracted_text

## المخرجات (JSON فقط، لا أي نص خارجه):
{
  "extracted_text": "النص أو الحل الذي قرأته من الصورة",
  "is_correct": true/false,
  "earned_score": رقم بين 0 و ${qPoints},
  "feedback": "تغذية راجعة تربوية مشجعة للطالب تشرح درجته"
}`

            let aiResultStr = ''
            for (const modelName of MODELS) {
              try {
                const model = getModel(modelName)
                const result = await model.generateContent([
                  {
                    inlineData: {
                      mimeType: imageData.mimeType,
                      data: imageData.data,
                    },
                  },
                  { text: visionPrompt },
                ])
                aiResultStr = result.response
                  .text()
                  .trim()
                  .replace(/^```json\s*/i, '')
                  .replace(/\s*```$/i, '')
                  .trim()
                break
              } catch (e) {
                console.warn(
                  `[Vision Grade Exam] Model ${modelName} failed:`,
                  e
                )
              }
            }

            // BUG-8 FIX: تغليف JSON.parse بـ try/catch
            try {
              const parsed = JSON.parse(aiResultStr)
              isCorrect = parsed.is_correct || parsed.earned_score > 0
              scoreAwarded = Math.min(
                qPoints,
                Math.max(0, Number(parsed.earned_score) || 0)
              )
              aiFeedback = parsed.feedback
              studentAns = parsed.extracted_text || studentAns
            } catch {
              console.error(
                'Failed to parse Vision AI response for question:',
                q.id,
                aiResultStr
              )
              aiFeedback =
                'تعذر قراءة نتيجة التصحيح التلقائي. (تم إعطاء 0 درجة مؤقتاً)'
              scoreAwarded = 0
              isCorrect = false
            }
          } catch (err) {
            console.error('Failed vision grading for question:', q.id, err)
            aiFeedback = 'تعذر تصحيح الصورة تلقائياً. (تم إعطاء 0 درجة مؤقتاً)'
            scoreAwarded = 0
            isCorrect = false
          }
        }
      } else if (
        q.question_type === 'mcq' ||
        q.question_type === 'true_false'
      ) {
        if (studentAns.trim() === q.correct_answer?.trim()) {
          isCorrect = true
          scoreAwarded = qPoints
        }
      } else if (q.question_type === 'fill_blank') {
        if (checkAnswer(studentAns, q.correct_answer, 'fill_blank')) {
          isCorrect = true
          scoreAwarded = qPoints
        }
      } else if (
        q.question_type === 'essay' ||
        q.question_type === 'correction'
      ) {
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
            if (aiResultStr.startsWith('\`\`\`json')) {
              aiResultStr = aiResultStr
                .replace(/\`\`\`json/g, '')
                .replace(/\`\`\`/g, '')
                .trim()
            }
            break
          } catch (e) {
            console.warn(`Model ${modelName} failed grading:`, e)
          }
        }

        try {
          const aiEval = JSON.parse(aiResultStr)
          isCorrect = aiEval.is_correct || aiEval.score_awarded > 0
          scoreAwarded = Math.min(
            qPoints,
            Math.max(0, Number(aiEval.score_awarded) || 0)
          )
          aiFeedback = aiEval.feedback
        } catch (e) {
          console.error('Failed to parse AI grading:', aiResultStr, e)
          aiFeedback =
            'سيتم مراجعة هذا السؤال يدوياً من قِبل المعلم. (لن يؤثر على درجاتك في الوقت الحالي)'
          scoreAwarded = 0
          isCorrect = false
          return {
            totalScore: 0,
            pointsToExclude: qPoints,
            payload: {
              attempt_id: attemptId,
              student_id: studentId,
              exam_id: attempt.exam_id,
              question_id: q.id,
              student_answer: studentAns,
              is_correct: false,
              score_awarded: 0,
              teacher_feedback: aiFeedback,
              answer_image_url: imageAnswers[q.id] || null,
              grading_method: imageAnswers[q.id] ? 'image' : 'auto',
            },
            skipPayload: false,
          }
        }
      }

      const answerImageUrl = imageAnswers[q.id] || null
      const gradingMethod = answerImageUrl ? 'image' : 'auto'

      return {
        totalScore: scoreAwarded,
        pointsToExclude: 0,
        payload: {
          attempt_id: attemptId,
          student_id: studentId,
          exam_id: attempt.exam_id,
          question_id: q.id,
          student_answer: studentAns,
          is_correct: isCorrect,
          score_awarded: scoreAwarded,
          teacher_feedback: aiFeedback,
          answer_image_url: answerImageUrl,
          grading_method: gradingMethod,
        },
        skipPayload: false,
      }
    }

    // PERF-1 FIX: تصحيح بالتوازي مع concurrency limit = 3
    const runWithConcurrency = async <T>(
      tasks: (() => Promise<T>)[],
      limit: number
    ): Promise<T[]> => {
      const results: T[] = []
      let idx = 0
      const worker = async () => {
        while (idx < tasks.length) {
          const i = idx++
          results[i] = await tasks[i]()
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(limit, tasks.length) }, worker)
      )
      return results
    }

    // 3. Evaluate each answer — بالتوازي (3 في وقت واحد)
    const gradingTasks = examQuestions.map((eq) => () => evaluateQuestion(eq))
    const gradingResults = await runWithConcurrency(gradingTasks, 3)

    for (const gr of gradingResults) {
      totalScore += gr.totalScore
      pointsToExclude += gr.pointsToExclude
      if (!gr.skipPayload && gr.payload) {
        studentAnswersPayload.push(gr.payload)
      }
    }

    // 4. Calculate Final Result
    const originalTotalPoints = examQuestions.reduce(
      (sum, eq) =>
        sum + Math.max(1, eq.points_override || eq.questions?.points || 1),
      0
    )
    let finalTotalPoints = originalTotalPoints - pointsToExclude
    if (finalTotalPoints <= 0) finalTotalPoints = 1 // Prevent division by zero

    // نسبة النجاح (passing_score مخزنة كنسبة مئوية 0-100، وليس درجة مطلقة)
    const percentage =
      finalTotalPoints > 0 ? (totalScore / finalTotalPoints) * 100 : 0
    const passThreshold = examData.passing_score ?? 50 // مباشرة كنسبة مئوية
    const isPassed = percentage >= passThreshold

    // 5. Update Attempt in DB
    const { error: updateError } = await supabase
      .from('exam_attempts')
      .update({
        score: totalScore,
        percentage: percentage,
        is_passed: isPassed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId)

    if (updateError) throw updateError

    // 6. Save detailed student answers
    if (studentAnswersPayload.length > 0) {
      await supabase
        .from('student_answers')
        .upsert(studentAnswersPayload, { onConflict: 'attempt_id,question_id' })
    }

    return NextResponse.json({
      success: true,
      score: totalScore,
      total: finalTotalPoints,
      percentage,
      is_passed: isPassed,
    })
  } catch (error) {
    console.error('Exam AI grading error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطأ في التقييم' },
      { status: 500 }
    )
  }
}
