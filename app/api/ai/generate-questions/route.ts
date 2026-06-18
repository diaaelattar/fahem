import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  QUESTION_GENERATION_PROMPT,
  EXACT_EXTRACT_PROMPT,
  GenerationMode,
} from '@/lib/ai/prompts'
import { parseGeminiJSON } from '@/lib/ai/gemini-client'
import {
  AdminGenerateQuestionsSchema,
  formatZodError,
} from '@/lib/schemas/ai-generation'

// ─── رفع حد حجم الطلبات لدعم ملفات PDF/صور كبيرة ───────────────────────────
export const maxDuration = 60

// ─── إعداد Gemini ───────────────────────────────────────────────────────────
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

// نماذج متسقة مع الـ File API - مرتبة حسب الأولوية وتوافر الكوتا
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
]
const DEFAULT_MODEL = FALLBACK_MODELS[0]
const GEMINI_MODEL = DEFAULT_MODEL // للـ backward compatibility

/**
 * استخراج محتوى PDF/DOCX/Image مباشرةً عبر Gemini Inline Data
 * بدلاً من pdf-parse الذي يفشل مع كثير من الملفات
 */
async function extractTextViaGemini(
  fileBuffer: Buffer,
  mimeType: string,
  subject: string,
  grade: string
): Promise<string> {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: fileBuffer.toString('base64'),
      },
    },
    {
      text: `استخرج كامل النص العربي والعلمي الموجود في هذا المستند التعليمي (مادة ${subject} - ${grade}) بالكامل وبدقة تامة. من الضروري جداً تحويل أي معادلات رياضية، أسس، أرقام، أو كسور إلى صيغة LaTeX الرياضية الصحيحة. لا تستخدم أرقاماً عادية للتعبير عن الأسس (مثل a 4) بل استخدم a^{4}. لا تضف تعليقاً، فقط النص المستخرج من الملف.`,
    },
  ])

  return result.response.text()
}

/**
 * توليد الأسئلة مباشرةً من الملف (PDF/صورة) بدون استخراج نص وسيط
 * أفضل للملفات التي تحتوي على معادلات أو رسوم بيانية
 */
async function generateQuestionsDirectly(
  fileBuffer: Buffer,
  mimeType: string,
  subject: string,
  grade: string,
  options: {
    questionCount?: number
    requestedTypes?: string[]
    targetCognitiveLevel?: string
    customInstructions?: string
    mode?: GenerationMode
    passageBased?: boolean
  } = {}
): Promise<{ result: any; modelUsed: string }> {
  const promptParams = {
    subject,
    grade,
    extractedText: 'الملف مرفق كصورة/مستند',
    questionCount: options.questionCount || 12,
    requestedTypes: options.requestedTypes,
    targetCognitiveLevel: options.targetCognitiveLevel,
    customInstructions: options.customInstructions,
    passageBased: options.passageBased,
  }
  const prompt =
    options.mode === 'EXACT_EXTRACT'
      ? EXACT_EXTRACT_PROMPT(promptParams)
      : QUESTION_GENERATION_PROMPT(promptParams)

  let lastError: any = null

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`Trying model: ${modelName}`)
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
      console.error(`Error with model ${modelName}:`, err.message)
      lastError = err

      // إذا كان هذا خطأ "الحصة اليومية" (Daily Quota)، لا داعي لتجربة نماذج أخرى على نفس المفتاح عادةً
      if (err.message.includes('GenerateRequestsPerDay')) {
        console.warn(
          `Daily quota reached for model ${modelName}. Jumping to next or failing.`
        )
      }

      // إذا كان الخطأ متعلقاً بالكوتا أو السيرفر أو الصلاحية، جرب الموديل التالي
      const isRetryable =
        err.message.includes('429') ||
        err.message.includes('503') ||
        err.message.includes('403') ||
        err.message.includes('404') || // Skip invalid model names
        err.message.includes('Forbidden') ||
        err.message.includes('quota') ||
        err.message.includes('RESOURCE_EXHAUSTED') ||
        err.message.includes('not found') ||
        err.message.includes('NOT_FOUND')

      if (!isRetryable) {
        throw err
      }

      // إضافة تأخير بسيط قبل المحاولة مع الموديل التالي لتخفيف الضغط
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  throw lastError
}

// ─── MIME types المدعومة لـ Gemini Direct ────────────────────────────────────
const GEMINI_SUPPORTED_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
}

/**
 * دالة مساعدة لتوليد الأسئلة من النصوص باستخدام استراتيجية الـ Fallback لتفادي أخطاء الكوتا 429
 */
async function generateTextQuestionsWithFallback(prompt: string) {
  let lastError: any = null

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`Trying text model: ${modelName}`)
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
      console.error(`Error with text model ${modelName}:`, err.message)
      lastError = err

      if (err.message.includes('GenerateRequestsPerDay')) {
        console.warn(
          `Daily quota reached for model ${modelName}. Jumping to next or failing.`
        )
      }

      const isRetryable =
        err.message.includes('429') ||
        err.message.includes('503') ||
        err.message.includes('403') ||
        err.message.includes('404') || // Skip invalid model names
        err.message.includes('Forbidden') ||
        err.message.includes('quota') ||
        err.message.includes('RESOURCE_EXHAUSTED') ||
        err.message.includes('not found') ||
        err.message.includes('NOT_FOUND')

      if (!isRetryable) throw err

      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  throw lastError
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. التحقق من الصلاحية ──────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    // ── 1b. تحقق من صلاحية الأدمن — جدول admins مباشرة (أكثر أماناً من profiles.role) ──
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminRecord)
      return NextResponse.json(
        { error: 'هذه الخاصية للمديرين فقط' },
        { status: 403 }
      )

    // ── 2. استلام البيانات مع Zod Validation ──
    const rawBody = await request.json()
    const validation = AdminGenerateQuestionsSchema.safeParse(rawBody)
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
      documentId,
      fileType,
      pastedText,
      youtubeUrl,
      subjectId,
      gradeId,
      fileData,
      chunkIndex,
      totalChunks,
      generationMode,
      questionCount,
      requestedTypes,
      targetCognitiveLevel,
      customInstructions,
      passageBased,
    } = validation.data

    // ── 3. جلب المستند — تحديد الأعمدة المطلوبة فقط (إصلاح SELECT *) ──
    const { data: doc } = (await supabase
      .from('documents')
      .select('id, file_url, file_type, processing_status, subject_id, grade_id')
      .eq('id', documentId)
      .single()) as { data: any }
    if (!doc)
      return NextResponse.json({ error: 'المستند غير موجود' }, { status: 404 })

    const [{ data: subject }, { data: grade }] = (await Promise.all([
      supabase.from('subjects').select('name_ar, teaching_language').eq('id', subjectId).single(),
      supabase.from('grades').select('name_ar').eq('id', gradeId).single(),
    ])) as [{ data: any }, { data: any }]

    const subjectName = subject?.name_ar || 'غير محدد'
    const gradeName = grade?.name_ar || 'غير محدد'
    // لغة تدريس المادة: arabic أو english (لمدارس اللغات)
    const teachingLanguage: string = subject?.teaching_language || 'arabic'
    const isEnglishSubject = teachingLanguage === 'english'

    // تعليمات اللغة للذكاء الاصطناعي
    const languageInstruction = isEnglishSubject
      ? `
## ⚠️ تعليمات لغة التوليد — إلزامية مطلقة
This subject is taught in ENGLISH (Language Schools / مدارس اللغات). 
You MUST generate ALL question texts, answer choices, correct answers, and explanations in **ENGLISH ONLY**.
Use precise Cambridge/IGCSE-aligned scientific and mathematical terminology.
For complex technical terms, you MAY add an Arabic translation in parentheses to aid student comprehension. Example: "What is the function of the mitochondria (متقدرة الخلية)?"
`
      : ''

    // ── 4. تحديث الحالة إلى processing ───────────────────────────────────
    await (supabase.from('documents') as any)
      .update({ processing_status: 'processing' })
      .eq('id', documentId)

    let finalResult: any = null

    // دمج تعليمات اللغة في التعليمات المخصصة
    const mergedCustomInstructions = isEnglishSubject
      ? `${languageInstruction}\n${customInstructions || ''}`
      : customInstructions

    // ── 5. المسار الأول: نص ملصوق مباشرةً ──────────────────────────────
    if (fileType === 'text' && pastedText && pastedText.trim().length >= 50) {
      const promptParams = {
        subject: subjectName,
        grade: gradeName,
        extractedText: pastedText,
        questionCount,
        requestedTypes,
        targetCognitiveLevel,
        customInstructions: mergedCustomInstructions,
        passageBased,
      }
      const prompt =
        generationMode === 'EXACT_EXTRACT'
          ? EXACT_EXTRACT_PROMPT(promptParams)
          : QUESTION_GENERATION_PROMPT(promptParams)

      const genResult = await generateTextQuestionsWithFallback(prompt)
      finalResult = genResult.result

      await (supabase.from('documents') as any)
        .update({ extracted_text: pastedText })
        .eq('id', documentId)

      // ── 6. المسار الثاني: PDF/صورة — إرسال مباشر لـ Gemini ───────────
    } else if (doc.file_url && GEMINI_SUPPORTED_MIME[fileType]) {
      const mimeType = GEMINI_SUPPORTED_MIME[fileType]

      // تحميل الملف (إما مرسل مباشرة كـ chunk أو جلب من التخزين)
      let fileBuffer: Buffer
      if (fileData) {
        fileBuffer = Buffer.from(fileData, 'base64')
      } else {
        const fileResponse = await fetch(doc.file_url)
        if (!fileResponse.ok) {
          if (fileResponse.status === 429) {
            console.error(
              `تجاوزت حد الطلبات المسموح به (Quota Exceeded). جاري الانتظار 60 ثانية قبل المحاولة التالية...`
            )
            await new Promise((r) => setTimeout(r, 60000))
            throw new Error('Quota Exceeded')
          }
          throw new Error(`فشل جلب الملف من التخزين: ${fileResponse.status}`)
        }
        fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
      }

      if (fileBuffer.length === 0) {
        throw new Error('الملف فارغ')
      }

      // توليد مباشر من الملف — الأفضل للـ PDFs التي تحتوي على معادلات
      const directGen = await generateQuestionsDirectly(
        fileBuffer,
        mimeType,
        subjectName,
        gradeName,
        {
          questionCount,
          requestedTypes,
          targetCognitiveLevel,
          customInstructions: mergedCustomInstructions,
          mode: generationMode,
          passageBased,
        }
      )
      finalResult = directGen.result
      const actualModel = directGen.modelUsed

      // إصلاح ِ13: دمج استخراج النص مع توليد الأسئلة — بدلاً من طلبين منفصلين لنفس الملف
      // نستخرج النص من حقل extracted_text الذي تطلب من Gemini تضمينه في الاستجابة
      const rawResult = directGen.result as any
      const extractedTextFromResult: string =
        rawResult?.extracted_text ||
        rawResult?.metadata?.extracted_text ||
        ''

      if (extractedTextFromResult.length > 50) {
        // حفظ النص من نفس الطلب (بدون تكلفة إضافية)
        ;(supabase.from('documents') as any)
          .update({ extracted_text: extractedTextFromResult })
          .eq('id', documentId)
          .then(() => {})
          .catch(() => {})
      } else {
        // Fallback: استخراج النص في الخلفية فقط إذا لم يتضمنه النموذج
        try {
          const model = getGenAI().getGenerativeModel({ model: actualModel })
          const extractRes = await model.generateContent([
            { inlineData: { mimeType, data: fileBuffer.toString('base64') } },
            { text: 'استخرج كامل النص العربي الموجود في هذا المستند بدقة. من الضروري تحويل أي معادلات أو أسس أو كسور رياضية إلى صيغة LaTeX الصحيحة.' },
          ])
          const txt = extractRes.response.text()
          if (txt.length > 50) {
            ;(supabase.from('documents') as any)
              .update({ extracted_text: txt })
              .eq('id', documentId)
              .then(() => {})
              .catch(() => {})
          }
        } catch {
          /* لا يُوقف العملية الرئيسية */
        }
      }

      // ── 7. المسار الثالث: DOCX ─────────────────────────────────────────
    } else if (doc.file_url && fileType === 'docx') {
      // إصلاح م5: فحص استجابة الجلب قبل استخدام البيانات
      const fileResponse = await fetch(doc.file_url)
      if (!fileResponse.ok) {
        return NextResponse.json(
          { error: `فشل جلب ملف DOCX من التخزين (خطأ ${fileResponse.status})` },
          { status: 400 }
        )
      }
      const fileBuffer = Buffer.from(await fileResponse.arrayBuffer())

      let extractedText = ''
      try {
        const mammoth = await import('mammoth')
        const mammothResult = await mammoth.extractRawText({
          buffer: fileBuffer,
        })
        extractedText = mammothResult.value?.trim() || ''
      } catch (e) {
        console.error('mammoth error:', e)
      }

      // إصلاح م5: لا نُرسل DOCX binary لـ Gemini — البيانات ستكون مشوّهة تماماً
      // يُنصح المستخدم بتحويل الملف لـ PDF أو الصق النص مباشرة
      if (extractedText.length < 50) {
        await (supabase.from('documents') as any)
          .update({ processing_status: 'failed' })
          .eq('id', documentId)
        return NextResponse.json(
          {
            error:
              'تعذّر قراءة محتوى ملف Word. يرجى تحويله إلى PDF أو نسخ النص ولصقه مباشرة في الحقل المخصص.',
          },
          { status: 400 }
        )
      }

      const prompt = QUESTION_GENERATION_PROMPT({
        subject: subjectName,
        grade: gradeName,
        extractedText,
        questionCount,
        requestedTypes,
        targetCognitiveLevel,
        customInstructions: mergedCustomInstructions,
        passageBased,
      })
      const genResult = await generateTextQuestionsWithFallback(prompt)
      finalResult = genResult.result

      await (supabase.from('documents') as any)
        .update({ extracted_text: extractedText })
        .eq('id', documentId)

      // ── 8. مسار يوتيوب (placeholder) ─────────────────────────────────
    } else if (fileType === 'youtube' && youtubeUrl) {
      return NextResponse.json(
        {
          error:
            'دعم يوتيوب سيتوفر قريباً — قم بنسخ النص من الفيديو ولصقه يدوياً.',
        },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        {
          error:
            'نوع الملف غير مدعوم. الأنواع المدعومة: PDF، PNG، JPG، DOCX، أو الصق النص مباشرة.',
        },
        { status: 400 }
      )
    }

    // ── 9. التحقق من النتيجة والحفظ ──────────────────────────────────
    let questionsArray: any[] = []
    let aiMetadata: any = null

    if (Array.isArray(finalResult)) {
      questionsArray = finalResult
    } else if (
      finalResult &&
      finalResult.questions &&
      Array.isArray(finalResult.questions)
    ) {
      questionsArray = finalResult.questions
      aiMetadata = finalResult.metadata || finalResult.ai_metadata || null
    } else if (
      finalResult &&
      finalResult.result &&
      Array.isArray(finalResult.result)
    ) {
      questionsArray = finalResult.result
    }

    if (questionsArray.length === 0) {
      await (supabase.from('documents') as any)
        .update({ processing_status: 'failed' })
        .eq('id', documentId)
      return NextResponse.json(
        {
          error:
            'لم ينتج عن التحليل أي أسئلة. تأكد من أن الملف يحتوي على محتوى تعليمي كافٍ.',
        },
        { status: 400 }
      )
    }

    await (supabase.from('documents') as any)
      .update({
        processing_status: 'completed',
        questions_count: questionsArray.length,
        metadata: {
          ai_metadata: aiMetadata,
          models_tried: FALLBACK_MODELS,
        },
      })
      .eq('id', documentId)

    return NextResponse.json({
      success: true,
      questions: questionsArray,
      metadata: aiMetadata,
      document_id: documentId,
    })
  } catch (error: any) {
    console.error('خطأ في توليد الأسئلة:', error)
    let msg = error.message || 'خطأ داخلي في الخادم'

    if (
      msg.includes('503') ||
      msg.includes('Service Unavailable') ||
      msg.includes('overloaded')
    ) {
      msg =
        'خوادم الذكاء الاصطناعي مشغولة حالياً (خطأ 503). يرجى المحاولة بعد قليل أو تقسيم الملف لأجزاء أصغر.'
    } else if (msg.includes('429') || msg.includes('Quota')) {
      msg =
        'تم استنفاد الحد المسموح به من الطلبات. يرجى الانتظار بضع دقائق قبل المحاولة مجدداً.'
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
