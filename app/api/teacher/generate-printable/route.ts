import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseGeminiJSON } from '@/lib/ai/gemini-client'

export const maxDuration = 60

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

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!teacher) {
      return NextResponse.json({ error: 'هذه الخدمة للمعلمين فقط' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type = 'worksheet',
      subjectName,
      gradeName,
      lessonTitle,
      unitName,
      instructions,
      questionCounts = { mcq: 4, trueFalse: 4, essay: 2 },
    } = body

    if (!subjectName || !gradeName || !lessonTitle) {
      return NextResponse.json(
        { error: 'يرجى إدخال المادة، الصف، وعنوان الدرس' },
        { status: 400 }
      )
    }

    let prompt = ''
    if (type === 'worksheet') {
      prompt = `أنت موجه أول بوزارة التربية والتعليم المصرية لمادة ${subjectName}.
المطلوب إعداد ورقة عمل واختبار أسبوعي للطباعة الرسمية A4 لصف ${gradeName}، درس ${lessonTitle}، وحدة ${unitName || 'الدرس'}.
ملاحظات: ${instructions || 'التدرج ومراعاة معايير الوزارة'}.
الأسئلة: ${questionCounts.mcq || 4} اختيار من متعدد، ${questionCounts.trueFalse || 4} صح وخطأ، ${questionCounts.essay || 2} مقالي وشرح.
أرجع الناتج بتنسيق JSON نظيف حصرا بالمفاتيح:
title, totalMarks, estimatedTimeMinutes, motivationalQuote, sections (كل عنصر فيه sectionTitle, marks, items مصفوفة من questionNumber, questionText, options, marks, modelAnswer).`
    } else {
      prompt = `أنت موجه أول بوزارة التربية والتعليم المصرية لمادة ${subjectName}.
أعد دفتر تحضير وخطة درس رسمية للطباعة A4 لصف ${gradeName}، درس ${lessonTitle}، وحدة ${unitName || 'الدرس'}.
أرجع الناتج بتنسيق JSON نظيف حصرا بالمفاتيح:
title, lessonMeta (durationMinutes, grade, subject, unit), objectives (cognitive, skillful, emotional مصفوفات نصوص), teachingAids, teachingStrategies, lessonStages (مصفوفة من stageName, teacherRole, studentRole), homework, selfEvaluation.`
    }

    let generatedData = null
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
        const aiResult = await model.generateContent(prompt)
        const parsed = parseGeminiJSON(aiResult.response.text())
        if (parsed) {
          generatedData = parsed
          break
        }
      } catch (err: any) {
        lastError = err
      }
    }

    if (!generatedData) {
      throw lastError || new Error('فشل توليد المستند بالذكاء الاصطناعي')
    }

    return NextResponse.json({ success: true, type, data: generatedData })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    )
  }
}
