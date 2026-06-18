import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

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
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return { data: base64, mimeType: contentType.split(';')[0] }
}

// ---- Math/LaTeX normalization ----
const normalizeMath = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/\$+/g, '') // strip LaTeX $ delimiters
    .replace(/\\text\{([^}]*)\}/g, '$1') // \text{x} → x
    .replace(/\\[a-zA-Z]+\s*/g, '') // strip other LaTeX commands
    .replace(/(\d),(\d{3})(?=[^\d]|$)/g, '$1$2') // thousands ONLY: 5,000 → 5000 (NOT 9,81)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Extract all distinct numbers from a string
const extractNumbers = (text: string): number[] => {
  const clean = normalizeMath(text)
  const matches = clean.match(/\d+(\.\d+)?/g) || []
  return Array.from(new Set(matches.map(Number)))
}

const normalizeArabic = (text: string) => {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
    .replace(/[،\-_/\\.:؛"']/g, ' ') // استبدال علامات الترقيم بمسافة (استبعدنا الفاصلة الإنجليزية لأنها تُعالج في normalizeMath)
    .replace(/\s+/g, ' ') // إزالة المسافات الزائدة
}

/**
 * تحقق من صحة إجابة الطالب بمنطق مرن يقبل الإجابات القريبة والمختصرة
 */
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

  // ── Math-aware comparison (runs first, before Arabic normalization) ──
  const ms = normalizeMath(studentAns)
  const mc = normalizeMath(correctAns)
  if (ms === mc) return true
  if (ms.replace(/\s/g, '') === mc.replace(/\s/g, '')) return true

  // Key-numbers set matching: student writes "9,81" → [9,81], correct has [9,81] → match!
  const correctNums = extractNumbers(correctAns)
  if (correctNums.length >= 2) {
    const studentNums = extractNumbers(studentAns)
    if (correctNums.every((n) => studentNums.includes(n))) return true
  }

  // Numeric-core: student writes "10", correct is "10 trees"
  const numCoreS = ms.match(/^[\d./+\-\s×÷*]+/)?.[0]?.trim()
  const numCoreC = mc.match(/^[\d./+\-\s×÷*]+/)?.[0]?.trim()
  if (
    numCoreS &&
    numCoreC &&
    numCoreS.replace(/\s/g, '') === numCoreC.replace(/\s/g, '')
  )
    return true
  // Numeric equivalence: 1/2 == 0.5
  const numS = Number(ms.replace(/[^\d.]/g, ''))
  const numC = Number(mc.replace(/[^\d.]/g, ''))
  if (!isNaN(numS) && !isNaN(numC) && numS > 0 && Math.abs(numS - numC) < 1e-9)
    return true

  const ns = normalizeArabic(studentAns)
  const nc = normalizeArabic(correctAns)

  if (type === 'mcq') return ns === nc

  // --- مرن للإكمال والمقالة والتصحيح ---
  if (ns === nc) return true
  if (nc.length >= 3 && ns.includes(nc)) return true
  if (ns.length >= 3 && nc.includes(ns)) return true

  const sw = ns.split(/\s+/).filter((w) => w.length >= 2)
  const cw = nc.split(/\s+/).filter((w) => w.length >= 2)

  if (sw.length > 0 && cw.length > 0) {
    const common = cw.filter((w) => sw.includes(w))
    if (sw.length <= 2 && common.length === sw.length) return true
    const ratioCorrect = common.length / cw.length
    const ratioStudent = common.length / sw.length
    if (ratioCorrect >= 0.4 || ratioStudent >= 0.5) return true
  }

  return false
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

    const examData = attempt.exams as any
    const answers = (attempt.answers as Record<string, string>) || {}
    // Image answers: either from client payload or from saved attempt
    const imageAnswers: Record<string, string> =
      clientImageAnswers || (attempt as any).answer_images || {}

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
    let allExamQuestions: any[] = []
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
    let studentAnswersPayload: any[] = []

    // 3. Evaluate each answer
    for (const eq of examQuestions) {
      const q = eq.questions as any
      if (!q) continue

      const qPoints = eq.points_override || Math.max(1, q.points || 1)
      let studentAns = answers[q.id]
      let isCorrect = false
      let scoreAwarded = 0
      let aiFeedback = null

      // Check if this question was answered via image upload
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
        // Skip adding to studentAnswersPayload (already saved by /api/ai/grade-image)
        totalScore += scoreAwarded
        continue
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

                aiResultStr = result.response.text().trim()
                aiResultStr = aiResultStr
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

            const parsed = JSON.parse(aiResultStr)
            isCorrect = parsed.is_correct || parsed.earned_score > 0
            scoreAwarded = Math.min(
              qPoints,
              Math.max(0, Number(parsed.earned_score) || 0)
            )
            aiFeedback = parsed.feedback
            studentAns = parsed.extracted_text || studentAns
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
            // clean json markdown if present
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
          // 🔧 إصلاح: isCorrect=false وليس true — لتجنب تقارير أداء مضللة
          // السؤال يُستبعد من التقييم الكلي (pointsToExclude) ويُوضع للمراجعة اليدوية
          aiFeedback =
            'سيتم مراجعة هذا السؤال يدوياً من قِبل المعلم. (لن يؤثر على درجاتك في الوقت الحالي)'
          scoreAwarded = 0
          isCorrect = false // 🔒 لا يجوز اعتبار السؤال صح عند فشل التصحيح
          pointsToExclude += qPoints
        }
      }

      totalScore += scoreAwarded

      const answerImageUrl = imageAnswers[q.id] || null
      const gradingMethod = answerImageUrl ? 'image' : 'auto'

      studentAnswersPayload.push({
        attempt_id: attemptId,
        student_id: user.id,
        exam_id: attempt.exam_id,
        question_id: q.id,
        student_answer: studentAns,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        teacher_feedback: aiFeedback, // Save AI feedback here
        answer_image_url: answerImageUrl,
        grading_method: gradingMethod,
      })
    }

    // 4. Calculate Final Result
    const originalTotalPoints = examQuestions.reduce(
      (sum, eq) =>
        sum +
        Math.max(1, eq.points_override || (eq.questions as any)?.points || 1),
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
  } catch (error: any) {
    console.error('Exam AI grading error:', error)
    return NextResponse.json(
      { error: error.message || 'خطأ في التقييم' },
      { status: 500 }
    )
  }
}
