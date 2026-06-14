import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { QUESTION_GENERATION_PROMPT, SMART_GEN_PROMPT } from '@/lib/ai/prompts'
import { parseGeminiJSON } from '@/lib/ai/gemini-client'
import { checkAIQuota } from '@/lib/security/rate-limiter'
import {
  TeacherGenerateQuestionsSchema,
  formatZodError,
} from '@/lib/schemas/ai-generation'

function getGenAI() {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4,
  ].filter(Boolean) as string[]

  const selectedKey = keys[Math.floor(Math.random() * keys.length)] || ''
  return new GoogleGenerativeAI(selectedKey)
}

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-pro',
]

async function generateTextQuestionsWithFallback(prompt: string) {
  let lastError: any = null

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[Teacher AI] Trying model: ${modelName}`)
      const model = getGenAI().getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })

      const aiResult = await model.generateContent(prompt)
      return {
        result: parseGeminiJSON(aiResult.response.text()),
        modelUsed: modelName,
      }
    } catch (err: any) {
      console.error(`[Teacher AI] Error with model ${modelName}:`, err.message)
      lastError = err

      const isRetryable =
        err.message.includes('429') ||
        err.message.includes('503') ||
        err.message.includes('403') ||
        err.message.includes('404') ||
        err.message.includes('Forbidden') ||
        err.message.includes('quota')

      if (!isRetryable) throw err
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  throw lastError
}

async function generateQuestionsFromDirectFile(
  fileBuffer: Buffer,
  mimeType: string,
  subject: string,
  grade: string,
  options: {
    questionCount?: number
    requestedTypes?: string[]
    targetCognitiveLevel?: string
    customInstructions?: string
    passageBased?: boolean
  } = {}
) {
  const prompt = QUESTION_GENERATION_PROMPT({
    subject,
    grade,
    extractedText: 'الملف مرفق كصورة/مستند',
    questionCount: options.questionCount || 10,
    requestedTypes: options.requestedTypes,
    targetCognitiveLevel: options.targetCognitiveLevel,
    customInstructions: options.customInstructions,
    passageBased: options.passageBased,
  })

  let lastError: any = null

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[Teacher AI Direct] Trying model: ${modelName}`)
      const model = getGenAI().getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: fileBuffer.toString('base64'),
          },
        },
        { text: prompt },
      ])

      return {
        result: parseGeminiJSON(result.response.text()),
        modelUsed: modelName,
      }
    } catch (err: any) {
      console.error(
        `[Teacher AI Direct] Error with model ${modelName}:`,
        err.message
      )
      lastError = err

      const isRetryable =
        err.message.includes('429') ||
        err.message.includes('503') ||
        err.message.includes('403') ||
        err.message.includes('404') ||
        err.message.includes('Forbidden') ||
        err.message.includes('quota')

      if (!isRetryable) throw err
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  throw lastError
}

const GEMINI_SUPPORTED_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. التحقق من صلاحيات المعلم ──
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'هذه الصلاحية للمعلمين فقط' },
        { status: 403 }
      )
    }

    // ── فحص كوتا الذكاء الاصطناعي للمعلم ─────────────────────────────────
    const quota = await checkAIQuota(user.id, '/api/teacher/generate-questions')
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.message || 'تجاوزت الحد اليومي للذكاء الاصطناعي',
          quota: { limit: quota.limit, usage: quota.usage, remaining: quota.remaining },
        },
        { status: 429 }
      )
    }

    // ── 2. استلام البيانات من الطلب مع Zod Validation ──
    const rawBody = await request.json()
    const validation = TeacherGenerateQuestionsSchema.safeParse(rawBody)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'بيانات غير صحيحة',
          details: formatZodError(validation.error),
        },
        { status: 400 }
      )
    }

    const {
      pastedText,
      fileData,
      fileExtension,
      subjectId,
      gradeId,
      questionCount,
      requestedTypes,
      targetCognitiveLevel,
      customInstructions,
      passageBased,
    } = validation.data

    if (!subjectId || !gradeId) {
      return NextResponse.json(
        { error: 'يرجى تحديد المادة والصف الدراسي' },
        { status: 400 }
      )
    }

    // جلب أسماء المادة والصف
    const [{ data: subjectData }, { data: gradeData }] = await Promise.all([
      supabase.from('subjects').select('name_ar').eq('id', subjectId).single(),
      supabase.from('grades').select('name_ar').eq('id', gradeId).single(),
    ])

    const subjectName = subjectData?.name_ar || 'غير محدد'
    const gradeName = gradeData?.name_ar || 'غير محدد'

    let finalResult: any = null

    // ── 3. مسار الملف المباشر (صورة/PDF) ──
    if (fileData && fileExtension && GEMINI_SUPPORTED_MIME[fileExtension]) {
      const mimeType = GEMINI_SUPPORTED_MIME[fileExtension]
      const fileBuffer = Buffer.from(fileData, 'base64')

      const genResult = await generateQuestionsFromDirectFile(
        fileBuffer,
        mimeType,
        subjectName,
        gradeName,
        {
          questionCount,
          requestedTypes,
          targetCognitiveLevel,
          customInstructions,
          passageBased,
        }
      )
      finalResult = genResult.result

      // ── 4. مسار النص الملصوق ──
    } else if (pastedText && pastedText.trim().length >= 10) {
      const prompt = SMART_GEN_PROMPT({
        subject: subjectName,
        grade: gradeName,
        extractedText: pastedText,
        questionCount,
        requestedTypes,
        targetCognitiveLevel,
        customInstructions,
        passageBased,
      })

      const genResult = await generateTextQuestionsWithFallback(prompt)
      finalResult = genResult.result
    } else {
      return NextResponse.json(
        { error: 'يرجى تقديم نص الدرس أو رفع ملف تعليمي متوافق' },
        { status: 400 }
      )
    }

    // ── 5. تنسيق النتيجة وإرجاعها ──
    let questionsArray: any[] = []
    if (Array.isArray(finalResult)) {
      questionsArray = finalResult
    } else if (
      finalResult &&
      finalResult.questions &&
      Array.isArray(finalResult.questions)
    ) {
      questionsArray = finalResult.questions
    } else if (
      finalResult &&
      finalResult.result &&
      Array.isArray(finalResult.result)
    ) {
      questionsArray = finalResult.result
    }

    if (questionsArray.length === 0) {
      return NextResponse.json(
        {
          error:
            'تعذر توليد أسئلة من المحتوى المقدم. تأكد من أن النص أو الملف يحتوي على مادة تعليمية واضحة.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      questions: questionsArray,
    })
  } catch (error: any) {
    console.error('[Teacher AI Error]:', error)
    let message = error.message || 'خطأ داخلي في معالجة طلب الذكاء الاصطناعي'
    if (message.includes('503') || message.includes('overloaded')) {
      message =
        'خوادم الذكاء الاصطناعي مشغولة حالياً، يرجى المحاولة مرة أخرى بعد ثوانٍ.'
    } else if (message.includes('429') || message.includes('Quota')) {
      message =
        'تم تجاوز كوتا الاستخدام المتاحة مؤقتاً، يرجى إعادة المحاولة بعد دقيقة.'
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
