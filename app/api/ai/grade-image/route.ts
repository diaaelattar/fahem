import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────
// Gemini Vision: تقييم الإجابة المكتوبة بخط اليد
// ─────────────────────────────────────────────────

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

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

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return { data: base64, mimeType: contentType.split(';')[0] }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { questionText, idealAnswer, imageUrl, maxScore, attemptId, questionId } =
      await req.json()

    if (!imageUrl || !questionText || maxScore === undefined) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // جلب الصورة كـ base64
    const imageData = await fetchImageAsBase64(imageUrl)

    const prompt = `أنت مصحح امتحانات خبير متخصص في المناهج المصرية. مهمتك قراءة إجابة طالب مكتوبة بخط اليد وتقييمها.

## بيانات التقييم:
- **السؤال:** ${questionText}
- **الإجابة النموذجية:** ${idealAnswer || 'لا توجد إجابة نموذجية محددة، قيّم بناءً على صحة الحل الرياضي والعلمي'}
- **الدرجة العظمى:** ${maxScore}

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
  "earned_score": رقم بين 0 و ${maxScore},
  "feedback": "تغذية راجعة تربوية مشجعة للطالب تشرح درجته",
  "math_steps_valid": true/false,
  "confidence": "high/medium/low (مدى وضوح خط اليد)"
}`

    let lastError: any = null

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
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

        const parsed = JSON.parse(text)

        // حفظ النتيجة في قاعدة البيانات إذا كانت متوفرة
        if (attemptId && questionId) {
          await supabase
            .from('student_answers')
            .upsert(
              {
                attempt_id: attemptId,
                student_id: user.id,
                exam_id: undefined, // سيتم جلبه من attempt
                question_id: questionId,
                answer_image_url: imageUrl,
                student_answer: parsed.extracted_text || '[إجابة مصوّرة]',
                is_correct: parsed.is_correct,
                score_awarded: Math.min(maxScore, Math.max(0, Number(parsed.earned_score) || 0)),
                teacher_feedback: parsed.feedback,
                ai_vision_feedback: JSON.stringify({
                  extracted_text: parsed.extracted_text,
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
          is_correct: parsed.is_correct,
          earned_score: Math.min(maxScore, Math.max(0, Number(parsed.earned_score) || 0)),
          feedback: parsed.feedback,
          math_steps_valid: parsed.math_steps_valid,
          confidence: parsed.confidence,
        })
      } catch (err) {
        console.warn(`[Vision Grade] Model ${modelName} failed:`, err)
        lastError = err
      }
    }

    throw lastError || new Error('All models failed')
  } catch (error: any) {
    console.error('[Vision Grade] Error:', error)
    return NextResponse.json(
      { error: 'فشل تقييم الصورة', details: error.message },
      { status: 500 }
    )
  }
}
