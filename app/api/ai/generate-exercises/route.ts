import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseGeminiJSON } from '@/lib/ai/gemini-client'
import { checkAIQuota } from '@/lib/security/rate-limiter'

/**
 * API Route: POST /api/ai/generate-exercises
 * يستخدمه المعلم لتوليد تدريبات تلقائية من نص الدرس باستخدام الذكاء الاصطناعي.
 * يميز بذكاء بين النص الأصلي للدرس والنصوص الإثرائية أو المقدمات غير المرتبطة.
 */

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
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
]

/**
 * يبني Prompt ذكي يُفرّق بين النص الأصلي للدرس والنصوص الإثرائية أو المقدمات
 */
function buildExerciseGenerationPrompt(params: {
  lessonTitle: string
  subjectName: string
  gradeName: string
  lessonText: string
  exerciseCount: number
  questionTypes: string[]
  difficultyLevel: string
}): string {
  const typeLabels: Record<string, string> = {
    mcq: 'اختيار من متعدد (4 خيارات)',
    true_false: 'صح أو خطأ',
    fill_blank: 'أكمل الفراغ',
    essay: 'سؤال مقالي',
  }

  const requestedTypesStr = params.questionTypes
    .map((t) => typeLabels[t] || t)
    .join(' و')

  return `أنت خبير تربوي مصري متخصص في بناء التقييمات والتدريبات التعليمية للمنهج المصري.

## مهمتك:
قراءة النص التالي المرتبط بدرس "${params.lessonTitle}" في مادة ${params.subjectName} للصف ${params.gradeName}، ثم توليد ${params.exerciseCount} تدريبات تفاعلية من نوع: ${requestedTypesStr}.

## ⚠️ قواعد التحليل الذكي للنص:
1. **حدّد النص الأصلي للدرس**: هو المحتوى العلمي الجوهري الذي يجب أن يفهمه الطالب.
2. **تجاهل النصوص الآتية** (لا تبني عليها تدريبات):
   - مقدمات الكتاب أو الوحدة العامة
   - نصوص إثرائية مكتوبة بخط مختلف أو في صناديق جانبية
   - تعريفات "هل تعلم؟" أو "معلومة إضافية"
   - أسئلة المراجعة الموجودة مسبقاً في الكتاب
   - الإهداءات أو كلمات المؤلف

## النص المُدخَل:
---
${params.lessonText}
---

## مستوى الصعوبة المطلوب: ${params.difficultyLevel === 'easy' ? 'سهل' : params.difficultyLevel === 'hard' ? 'صعب' : 'متوسط'}

## صياغة التدريبات:
- اجعل الأسئلة واضحة ومباشرة
- للـ MCQ: أضف 4 خيارات، اجعل الخيارات الخاطئة معقولة وليست واضحة البطلان
- للإكمال: ضع الفراغ في المكان الأنسب
- للمقالي: اطلب تفسيراً أو تطبيقاً لا مجرد حفظ
- اكتب شرحاً واضحاً ومفيداً للإجابة الصحيحة

## الإخراج (JSON صارم فقط، لا أي نص خارجه):
{
  "exercises": [
    {
      "question_type": "mcq" | "true_false" | "fill_blank" | "essay",
      "question_text": "نص السؤال",
      "options": ["أ- ...", "ب- ...", "ج- ...", "د- ..."],  // للـ MCQ فقط، null للباقي
      "correct_answer": "الإجابة الصحيحة",
      "explanation": "شرح سبب صحة الإجابة وكيف ترتبط بالدرس",
      "difficulty_level": "easy" | "medium" | "hard"
    }
  ],
  "lesson_core_summary": "ملخص موجز للنص الأصلي للدرس الذي اعتمدت عليه (2-3 أسطر)"
}`
}

async function generateWithFallback(prompt: string): Promise<any> {
  let lastError: any = null

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = getGenAI().getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      })

      const result = await model.generateContent(prompt)
      return parseGeminiJSON(result.response.text())
    } catch (err: any) {
      console.error(`[Generate Exercises] Model ${modelName} failed:`, err.message)
      lastError = err

      const isRetryable =
        err.message.includes('429') ||
        err.message.includes('503') ||
        err.message.includes('403') ||
        err.message.includes('404') ||
        err.message.includes('quota') ||
        err.message.includes('Forbidden')

      if (!isRetryable) throw err
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  throw lastError
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. التحقق من صلاحيات المعلم ──────────────────────────────────────
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
    const quota = await checkAIQuota(user.id, '/api/ai/generate-exercises')
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.message || 'تجاوزت الحد اليومي للذكاء الاصطناعي',
          quota: { limit: quota.limit, usage: quota.usage, remaining: quota.remaining },
        },
        { status: 429 }
      )
    }

    // ── 2. استلام البيانات ────────────────────────────────────────────────
    const body = await request.json()
    const {
      lessonId,
      lessonText,
      exerciseCount = 5,
      questionTypes = ['mcq', 'true_false', 'fill_blank'],
      difficultyLevel = 'medium',
    } = body

    if (!lessonId || !lessonText || lessonText.trim().length < 30) {
      return NextResponse.json(
        { error: 'يرجى تقديم نص الدرس (30 حرفاً على الأقل) لتوليد التدريبات' },
        { status: 400 }
      )
    }

    // ── 3. جلب بيانات الدرس ──────────────────────────────────────────────
    const { data: lesson } = await supabase
      .from('lessons')
      .select(
        `
        name_ar,
        units(
          subject_id,
          grade_id,
          subjects(name_ar),
          grades(name_ar)
        )
      `
      )
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 })
    }

    const unit = lesson.units as any
    const subjectName = unit?.subjects?.name_ar || 'المادة'
    const gradeName = unit?.grades?.name_ar || 'الصف'
    const lessonTitle = lesson.name_ar

    // ── 4. بناء الـ Prompt وتوليد التدريبات ──────────────────────────────
    const prompt = buildExerciseGenerationPrompt({
      lessonTitle,
      subjectName,
      gradeName,
      lessonText,
      exerciseCount: Math.min(exerciseCount, 15), // حد أقصى 15 تدريب في المرة الواحدة
      questionTypes,
      difficultyLevel,
    })

    const aiResult = await generateWithFallback(prompt)

    // ── 5. استخراج وتنسيق التدريبات ──────────────────────────────────────
    let exercises: any[] = []
    if (Array.isArray(aiResult)) {
      exercises = aiResult
    } else if (aiResult?.exercises && Array.isArray(aiResult.exercises)) {
      exercises = aiResult.exercises
    }

    if (exercises.length === 0) {
      return NextResponse.json(
        { error: 'تعذر توليد تدريبات من النص المُقدّم. تأكد من وضوح المحتوى التعليمي.' },
        { status: 400 }
      )
    }

    // تنسيق النتائج
    const formattedExercises = exercises.map((ex: any, index: number) => ({
      question_type: ex.question_type || 'mcq',
      question_text: ex.question_text || '',
      options: ex.options || null,
      correct_answer: ex.correct_answer || '',
      explanation: ex.explanation || '',
      difficulty_level: ex.difficulty_level || difficultyLevel,
      sort_order: index,
      source: 'ai_generated' as const,
      lesson_id: lessonId,
    }))

    return NextResponse.json({
      success: true,
      exercises: formattedExercises,
      lesson_core_summary: aiResult?.lesson_core_summary || null,
      count: formattedExercises.length,
    })
  } catch (error: any) {
    console.error('[Generate Exercises Error]:', error)
    let message = error.message || 'خطأ داخلي أثناء توليد التدريبات'

    if (message.includes('503') || message.includes('overloaded')) {
      message = 'خوادم الذكاء الاصطناعي مشغولة، يرجى المحاولة مجدداً بعد لحظات.'
    } else if (message.includes('429') || message.includes('quota')) {
      message = 'تم الوصول للحد اليومي من الطلبات، يرجى المحاولة لاحقاً.'
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
