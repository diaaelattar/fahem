import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { QUESTION_AUDIT_PROMPT } from '@/lib/ai/prompts'
import { parseGeminiJSON } from '@/lib/ai/gemini-client'

function getGenAI() {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4,
  ].filter(Boolean) as string[]
  const key = keys[Math.floor(Math.random() * keys.length)] || ''
  return new GoogleGenerativeAI(key)
}

const FALLBACK_MODELS = ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro']

async function auditWithAI(prompt: string): Promise<any> {
  let lastError: any = null
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = getGenAI().getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.15 },
      })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      return parseGeminiJSON(text)
    } catch (err: any) {
      console.error(`[audit] model ${modelName} failed:`, err.message)
      lastError = err
      const retryable = err.message.includes('429') || err.message.includes('quota') ||
                        err.message.includes('503') || err.message.includes('404')
      if (!retryable) throw err
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw lastError
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin')
      return NextResponse.json({ error: 'للمديرين فقط' }, { status: 403 })

    const { questionId, overrideText } = await request.json()
    if (!questionId)
      return NextResponse.json({ error: 'رقم السؤال مطلوب' }, { status: 400 })

    // Fetch question with subject & grade names for richer context
    const { data: q, error: qErr } = await supabase
      .from('questions')
      .select(`
        id, question_type, question_text, options, correct_answer, explanation,
        difficulty_level, bloom_level,
        subjects(name_ar),
        grades(name_ar)
      `)
      .eq('id', questionId)
      .single()

    if (qErr || !q)
      return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 })

    const prompt = QUESTION_AUDIT_PROMPT({
      question_type:   q.question_type,
      question_text:   overrideText && overrideText.trim() ? overrideText.trim() : q.question_text,
      options:         q.options,
      correct_answer:  q.correct_answer,
      explanation:     q.explanation,
      difficulty_level: q.difficulty_level,
      bloom_level:     q.bloom_level,
      subject_name:    (q.subjects as any)?.name_ar,
      grade_name:      (q.grades as any)?.name_ar,
    })

    const auditResult = await auditWithAI(prompt)

    // Persist audit results (fire and forget — don't block response)
    supabase.from('questions').update({ ai_audit_results: auditResult }).eq('id', questionId)
      .then(({ error }) => { if (error) console.error('[audit] save error:', error.message) })

    return NextResponse.json({ success: true, result: auditResult })

  } catch (error: any) {
    console.error('[audit] Error:', error)
    const msg = error.message?.includes('429') || error.message?.includes('quota')
      ? 'تم استنفاد حد الطلبات، انتظر قليلاً ثم أعد المحاولة'
      : error.message || 'حدث خطأ أثناء التدقيق'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
