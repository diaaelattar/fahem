import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─────────────────────────────────────────────────
// Gemini Vision: تقييم الإجابة المكتوبة بخط اليد
// ─────────────────────────────────────────────────

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
    generationConfig: { temperature: 0.15, maxOutputTokens: 1000 },
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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const {
      questionText,
      idealAnswer,
      imageUrl,
      maxScore,
      attemptId,
      questionId,
    } = await req.json()

    if (!imageUrl || !questionText || maxScore === undefined) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // 🔒 حماية أمنية: التحقق من الإجابة النموذجية مباشرة من قاعدة البيانات لمنع التلاعب بالطلب من العميل
    const adminClient = createAdminClient()
    let verifiedIdealAnswer = idealAnswer

    if (questionId) {
      const { data: qData } = await adminClient
        .from('questions')
        .select('correct_answer, question_text')
        .eq('id', questionId)
        .maybeSingle()
      if (qData?.correct_answer) {
        verifiedIdealAnswer = qData.correct_answer
      }
    }

    // جلب الصورة كـ base64
    const imageData = await fetchImageAsBase64(imageUrl)

    // جلب exam_id من محاولة الامتحان (BUG-7)
    let examId: string | undefined = undefined
    if (attemptId) {
      const { data: attemptData } = await supabase
        .from('exam_attempts')
        .select('exam_id')
        .eq('id', attemptId)
        .single()
      if (attemptData) {
        examId = attemptData.exam_id
      }
    }

    const conceptsMax = Math.round(maxScore * 0.4 * 10) / 10
    const stepsMax = Math.round(maxScore * 0.4 * 10) / 10
    const outcomeMax = Math.round((maxScore - conceptsMax - stepsMax) * 10) / 10

    const prompt = `أنت مصحح امتحانات خبير متخصص في المناهج المصرية ومعايير المركز القومي للامتحانات والتقويم التربوي (NCREE). مهمتك قراءة إجابة طالب مكتوبة بخط اليد وتقييمها موضوعياً وفق نموذج التقييم ثلاثي الأبعاد:

## بيانات التقييم:
- **السؤال:** ${questionText}
- **الإجابة النموذجية المعتمدة ومفاتيح الحل:** ${verifiedIdealAnswer || 'لا توجد إجابة نموذجية محددة، قيّم بناءً على صحة الحل العلمي/اللغوي/الرياضي'}
- **الدرجة العظمى للسؤال:** ${maxScore}

## معايير التقييم الثلاثية (Rubric Dimensions):
1. **المفاهيم والمصطلحات/القوانين الأساسية (الوزن: 40% = حتى ${conceptsMax} درجة):**
   - مدى صحة القوانين، الرموز، والمفاهيم العلمية/اللغوية المستخدمة.
2. **التسلسل المنطقي وخطوات الحل (الوزن: 40% = حتى ${stepsMax} درجة):**
   - صحة تسلسل الخطوات الحسابية أو التعليلية ووضوح البرهان والمنطق.
3. **الناتج النهائي ودقة الصياغة (الوزن: 20% = حتى ${outcomeMax} درجة):**
   - الوصول إلى الناتج النهائي الصحيح مع كتابة وحدات القياس إن وجدت.

## تعليمات هامة:
1. **اقرأ خط اليد بعناية** - إذا كان خط اليد غير واضح في موضع جزئي، قدّر الأقرب بالقرائن.
2. **للرياضيات والعلوم:** الطالب يستحق درجة الخطوات والمنطق حتى لو أخطأ في الحساب النهائي، ويستحق الدرجة كاملة إذا وصل للإجابة الصحيحة بطريقة رياضية سليمة أخرى.
3. **اكتب ما قرأته** من الصورة بدقة في حقل extracted_text.

## المخرجات (JSON فقط، لا أي نص خارجه):
{
  "extracted_text": "النص أو الحل الذي قرأته من الصورة",
  "concepts_score": رقم بين 0 و ${conceptsMax},
  "steps_score": رقم بين 0 و ${stepsMax},
  "outcome_score": رقم بين 0 و ${outcomeMax},
  "earned_score": رقم بين 0 و ${maxScore} (مجموع الدرجات مقرباً لأقرب نصف درجة),
  "is_correct": true إذا كان earned_score >= ${maxScore * 0.5} وإلا false,
  "feedback": "ملاحظات التقييم التربوي موضحة الدرجة المستحقة وما ينقص الطالب",
  "math_steps_valid": true/false,
  "confidence": "high/medium/low (مدى وضوح خط اليد)"
}`

    let lastError: unknown = null

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
          { text: prompt },
        ])

        let text = result.response.text().trim()
        // تنظيف markdown إذا أرجع الموديل ```json```
        text = text
          .replace(/^```json\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()

        const parsed = JSON.parse(text)

        const cScore = Math.min(
          conceptsMax,
          Math.max(0, Number(parsed.concepts_score) || 0)
        )
        const sScore = Math.min(
          stepsMax,
          Math.max(0, Number(parsed.steps_score) || 0)
        )
        const oScore = Math.min(
          outcomeMax,
          Math.max(0, Number(parsed.outcome_score) || 0)
        )

        let computedScore = Number(parsed.earned_score)
        if (isNaN(computedScore) || computedScore < 0) {
          computedScore = cScore + sScore + oScore
        }
        const finalEarnedScore = Math.min(
          maxScore,
          Math.max(0, Math.round(computedScore * 2) / 2)
        )
        const isPassed =
          typeof parsed.is_correct === 'boolean'
            ? parsed.is_correct
            : finalEarnedScore >= maxScore * 0.5

        const rubricPrefix = `[معايير NCREE: المفاهيم ${cScore}/${conceptsMax} | الخطوات ${sScore}/${stepsMax} | النتيجة ${oScore}/${outcomeMax}]`
        const finalFeedback = parsed.feedback
          ? `${rubricPrefix} - ${parsed.feedback}`
          : rubricPrefix

        // حفظ النتيجة في قاعدة البيانات إذا كانت متوفرة
        if (attemptId && questionId) {
          await supabase
            .from('student_answers')
            .upsert(
              {
                attempt_id: attemptId,
                student_id: user.id,
                exam_id: examId, // سيتم جلبه من attempt
                question_id: questionId,
                answer_image_url: imageUrl,
                student_answer: parsed.extracted_text || '[إجابة مصوّرة]',
                is_correct: isPassed,
                score_awarded: finalEarnedScore,
                teacher_feedback: finalFeedback,
                ai_vision_feedback: JSON.stringify({
                  extracted_text: parsed.extracted_text,
                  rubric: {
                    concepts: cScore,
                    steps: sScore,
                    outcome: oScore,
                  },
                  math_steps_valid: parsed.math_steps_valid,
                  confidence: parsed.confidence,
                }),
                grading_method: 'image',
              },
              { onConflict: 'attempt_id,question_id' }
            )
            .select()
        }

        return NextResponse.json({
          success: true,
          extracted_text: parsed.extracted_text,
          is_correct: isPassed,
          earned_score: finalEarnedScore,
          feedback: finalFeedback,
          math_steps_valid: parsed.math_steps_valid,
          confidence: parsed.confidence,
        })
      } catch (err) {
        console.warn(`[Vision Grade] Model ${modelName} failed:`, err)
        lastError = err
      }
    }

    throw lastError || new Error('All models failed')
  } catch (error) {
    console.error('[Vision Grade] Error:', error)
    return NextResponse.json(
      {
        error: 'فشل تقييم الصورة',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
