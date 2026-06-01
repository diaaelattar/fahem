// lib/ai/gemini-fallback.ts
// ملف مشترك يُزيل التكرار بين generate-questions (admin) و generate-questions (teacher)
// والـ grade/route.ts — بدلاً من 3 نسخ من نفس الدالة

import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseGeminiJSON } from './gemini-client'

// ─── النماذج مرتبة حسب الأولوية والجودة ─────────────────────────────────────
export const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
] as const

export type FallbackModel = (typeof FALLBACK_MODELS)[number]

// ─── إنشاء client بمفتاح عشوائي من المفاتيح المتاحة (Load Balancing) ────────
export function getRandomGeminiClient(): GoogleGenerativeAI {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4,
  ].filter((k): k is string => Boolean(k))

  if (keys.length === 0) {
    throw new Error('لا يوجد Gemini API Key معرّف في متغيرات البيئة')
  }
  const selectedKey = keys[Math.floor(Math.random() * keys.length)]
  return new GoogleGenerativeAI(selectedKey)
}

// ─── تحديد إذا كان الخطأ قابلاً للتكرار مع نموذج آخر ──────────────────────
export function isRetryableError(errorMessage: string): boolean {
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('503') ||
    errorMessage.includes('403') ||
    errorMessage.includes('404') ||
    errorMessage.includes('Forbidden') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('GenerateRequestsPerDay') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('Service Unavailable')
  )
}

// ─── نوع محتوى الطلب لـ Gemini ───────────────────────────────────────────────
export type GeminiContent =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

// ─── الدالة الموحدة للتوليد مع Fallback بين النماذج ─────────────────────────
/**
 * يُجرب النماذج بالترتيب ويُعيد أول نتيجة ناجحة
 * @param buildContents دالة تُنشئ محتوى الطلب (قد تستخدم modelName)
 * @param tag تسمية للـ logging
 * @param parseJSON إذا true يُعيد parsed JSON، وإلا يُعيد النص الخام
 */
export async function generateWithFallback(
  buildContents: (modelName: FallbackModel) => GeminiContent[],
  tag: string = 'Gemini',
  parseJSON: boolean = true
): Promise<{ result: unknown; modelUsed: FallbackModel }> {
  let lastError: unknown = null

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[${tag}] Trying model: ${modelName}`)

      const model = getRandomGeminiClient().getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: parseJSON ? 'application/json' : undefined,
          temperature: 0.2,
        },
      })

      const contents = buildContents(modelName)
      const response = await model.generateContent(contents)
      const text = response.response.text()

      if (!text || text.trim().length === 0) {
        throw new Error('استجابة فارغة من النموذج')
      }

      const result = parseJSON ? parseGeminiJSON(text) : text

      return { result, modelUsed: modelName }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[${tag}] Error with model ${modelName}: ${msg}`)
      lastError = err

      // إذا لم يكن الخطأ قابلاً للتكرار (مثل خطأ في الـ prompt) → ارمِه مباشرة
      if (!isRetryableError(msg)) {
        throw err
      }

      // انتظر قبل المحاولة مع النموذج التالي
      if (FALLBACK_MODELS.indexOf(modelName) < FALLBACK_MODELS.length - 1) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }

  throw lastError
}

// ─── دالة مساعدة لتوليد أسئلة من نص فقط ─────────────────────────────────────
export async function generateQuestionsFromText(
  prompt: string,
  tag: string = 'TextGen'
): Promise<{ result: unknown; modelUsed: FallbackModel }> {
  return generateWithFallback(
    () => [{ text: prompt }],
    tag,
    true
  )
}

// ─── دالة مساعدة لتوليد أسئلة من ملف (PDF/صورة) ─────────────────────────────
export async function generateQuestionsFromFile(
  fileBuffer: Buffer,
  mimeType: string,
  prompt: string,
  tag: string = 'FileGen'
): Promise<{ result: unknown; modelUsed: FallbackModel }> {
  const base64Data = fileBuffer.toString('base64')

  return generateWithFallback(
    () => [
      { inlineData: { mimeType, data: base64Data } },
      { text: prompt },
    ],
    tag,
    true
  )
}

// ─── تحويل رسائل خطأ Gemini لرسائل عربية للمستخدم ───────────────────────────
export function getArabicErrorMessage(errorMessage: string): string {
  if (
    errorMessage.includes('503') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('Service Unavailable')
  ) {
    return 'خوادم الذكاء الاصطناعي مشغولة حالياً. يرجى المحاولة بعد قليل أو تقسيم الملف لأجزاء أصغر.'
  }
  if (errorMessage.includes('429') || errorMessage.includes('quota')) {
    return 'تم استنفاد الحد المسموح به من الطلبات. يرجى الانتظار بضع دقائق قبل المحاولة مجدداً.'
  }
  if (errorMessage.includes('استجابة فارغة')) {
    return 'لم يُنتج الذكاء الاصطناعي استجابة. تأكد من أن المحتوى يحتوي على مادة تعليمية واضحة.'
  }
  return errorMessage || 'خطأ غير متوقع في الذكاء الاصطناعي'
}
