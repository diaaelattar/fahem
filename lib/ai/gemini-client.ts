import { GoogleGenerativeAI } from '@google/generative-ai'

export const getGeminiModel = (modelName: string = 'gemini-flash-latest') => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })
}

/**
 * دالة مساعدة لتنظيف مخرجات Gemini إذا لم يلتزم بصيغة JSON تماماً
 */
export function parseGeminiJSON(text: string) {
  try {
    // محاولة تنظيف علامات ممركبات Markdown
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('فشل في تحليل مخرجات Gemini:', error)
    throw new Error('فشل في تحليل رد الذكاء الاصطناعي')
  }
}
