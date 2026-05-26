// lib/ai/openai-client.ts
import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY غير معرّف')
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

// lib/ai/parsers.ts
export interface GeneratedQuestion {
  type: 'mcq' | 'true_false' | 'fill_blank'
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
}

export interface GenerationResult {
  questions: GeneratedQuestion[]
  metadata: {
    total_questions: number
    estimated_time_minutes: number
    topics_covered?: string[]
  }
}

export function parseQuestionsResponse(rawResponse: string): GenerationResult {
  try {
    // إزالة أي markdown wrappers محتملة
    const clean = rawResponse
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim()

    const parsed = JSON.parse(clean)

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('صيغة الاستجابة غير صحيحة: لا يوجد مصفوفة questions')
    }

    // التحقق من صحة كل سؤال
    const validQuestions = parsed.questions.filter((q: GeneratedQuestion) => {
      return (
        q.type &&
        ['mcq', 'true_false', 'fill_blank'].includes(q.type) &&
        q.question_text &&
        q.question_text.length > 5 &&
        q.correct_answer &&
        q.correct_answer.length > 0
      )
    })

    return {
      questions: validQuestions,
      metadata: parsed.metadata || {
        total_questions: validQuestions.length,
        estimated_time_minutes: Math.ceil(validQuestions.length * 1.5),
      },
    }
  } catch (error) {
    console.error('خطأ في تحليل استجابة الأسئلة:', error)
    throw new Error(
      `فشل في تحليل الأسئلة المولدة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    )
  }
}

export function sanitizeQuestionText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[<>]/g, '').trim()
}
