import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest']

function getModel(name: string) {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_4
  ].filter(Boolean) as string[]
  
  const selectedKey = keys[Math.floor(Math.random() * keys.length)] || ''

  return new GoogleGenerativeAI(selectedKey).getGenerativeModel({ 
    model: name,
    generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Verify Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { lessonId } = await req.json()
    if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })

    // Fetch lesson data
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('name_ar, objectives, units(name_ar, subjects(name_ar), grades(name_ar))')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) throw new Error('الدرس غير موجود')

    // Fetch related documents (extracted text)
    const { data: documents } = await supabase
      .from('documents')
      .select('extracted_text')
      .eq('lesson_id', lessonId)
      .not('extracted_text', 'is', null)

    const extractedTexts = documents?.map(d => d.extracted_text).join('\n\n') || ''

    const unit = lesson.units as any
    const subjectName = unit?.subjects?.name_ar || 'مادة'
    const gradeName = unit?.grades?.name_ar || 'صف'

    const prompt = `أنت معلم خبير في المناهج المصرية لمادة ${subjectName} للصف ${gradeName}.
قم بإنشاء "ملخص شامل ومركز" للدرس التالي:
اسم الوحدة: ${unit?.name_ar}
اسم الدرس: ${lesson.name_ar}
أهداف الدرس: ${lesson.objectives || 'غير محددة'}

${extractedTexts ? `محتوى الدرس المستخرج من المستندات:\n${extractedTexts}` : ''}

التعليمات للملخص:
1. استخدم لغة عربية فصحى واضحة ومبسطة للطلاب.
2. نسق الملخص باستخدام Markdown (استخدم العناوين ##، والقوائم النقطية -).
3. استخرج القوانين، القواعد، أو النقاط الرئيسية بشكل بارز.
4. استخدم صيغة KaTeX لأي معادلات رياضية أو أرقام أو كسور (مثال: $x^2 + y^2 = z^2$ أو $\\frac{1}{2}$).
5. أضف فقرة صغيرة في النهاية بعنوان "نصيحة سريعة 💡" لتشجيع الطالب.
6. لا تضف أي مقدمات أو ترحيب، ابدأ بالملخص مباشرة.`

    let finalSummary = ''
    let lastError = null

    for (const modelName of MODELS) {
      try {
        const model = getModel(modelName)
        const result = await model.generateContent(prompt)
        finalSummary = result.response.text().trim()
        break
      } catch (err: any) {
        console.warn(`Model ${modelName} failed summary generation:`, err.message)
        lastError = err
      }
    }

    if (!finalSummary && lastError) {
      throw lastError
    }

    // Save to database
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ summary: finalSummary })
      .eq('id', lessonId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      summary: finalSummary
    })

  } catch (error: any) {
    console.error('Summary generation error:', error)
    return NextResponse.json(
      { error: error.message || 'خطأ في توليد الملخص' },
      { status: 500 }
    )
  }
}
