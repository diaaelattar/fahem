import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash']

function getModel(name: string) {
  return new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  ).getGenerativeModel({ 
    model: name,
    generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // التحقق من المستخدم
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { questionId, questionText, correctAnswer, studentAnswer, subject, grade } = await req.json()

    if (!questionText) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const prompt = `أنت أستاذ مصري خبير في مادة ${subject || 'العلوم'} للصف ${grade || 'السابع'}. 
    
شرح السؤال التالي شرحاً تعليمياً مفصلاً بالعربية الفصيحة لطالب مصري:

**السؤال:** ${questionText}
**الإجابة الصحيحة:** ${correctAnswer || 'غير محددة'}
${studentAnswer ? `**إجابة الطالب:** ${studentAnswer}` : ''}

اشرح:
1. **المفهوم الأساسي:** اشرح المفهوم العلمي/الأكاديمي المرتبط بالسؤال
2. **لماذا الإجابة الصحيحة صحيحة؟** اشرح بأسلوب بسيط ومنطقي
${studentAnswer && studentAnswer !== correctAnswer ? '3. **لماذا الإجابة الخاطئة خاطئة؟** اشرح بأسلوب مشجع' : ''}
4. **قاعدة لتذكرها:** اكتب جملة قصيرة تساعد الطالب على تذكر هذه المعلومة

أسلوبك: مشجع، واضح، مع أمثلة من الحياة اليومية المصرية إن أمكن. لا تستخدم مصطلحات معقدة.
**هام جداً:** استخدم وسوم KaTeX للمعادلات الرياضية والأرقام: $...$ للأسطر المدمجة و $$...$$ للكبيرة. لا تستخدم علامات النجمة ** للمعادلات.`

    let explanation = ''
    let lastError: Error | null = null

    for (const modelName of MODELS) {
      try {
        const model = getModel(modelName)
        const result = await model.generateContent(prompt)
        explanation = result.response.text()
        break
      } catch (e: any) {
        lastError = e
        continue
      }
    }

    if (!explanation) {
      throw lastError || new Error('فشل في الاتصال بالذكاء الاصطناعي')
    }

    return NextResponse.json({ explanation })
  } catch (error: any) {
    console.error('Explain question error:', error)
    return NextResponse.json(
      { error: error.message || 'خطأ في توليد الشرح' },
      { status: 500 }
    )
  }
}
