import { NextResponse } from 'next/server'
import { AI_GRADING_PROMPT } from '@/lib/ai/prompts'

// دالة لجلب الموديل المناسب للتقييم
async function gradeWithFallback(prompt: string): Promise<unknown> {
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash']
  let lastError = null

  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4,
  ].filter(Boolean) as string[]
  const selectedKey = keys[Math.floor(Math.random() * keys.length)] || ''

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${selectedKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2, // دقة عالية في التصحيح
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response from AI')

      const parsed = JSON.parse(text)
      return parsed
    } catch (error) {
      console.warn(`[AI Grading] Model ${model} failed:`, error)
      lastError = error
    }
  }
  throw lastError
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { questionText, idealAnswer, studentAnswer, maxScore } = body

    if (
      !questionText ||
      !idealAnswer ||
      !studentAnswer ||
      maxScore === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prompt = AI_GRADING_PROMPT({
      questionText,
      idealAnswer,
      studentAnswer,
      maxScore,
    })
    const result = await gradeWithFallback(prompt)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error grading essay:', error)
    return NextResponse.json(
      {
        error: 'Failed to grade answer',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
