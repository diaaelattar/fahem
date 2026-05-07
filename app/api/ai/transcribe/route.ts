import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('audio') as File

    if (!file) {
      return NextResponse.json({ error: 'لم يتم العثور على ملف صوتي' }, { status: 400 })
    }

    // قراءة الملف كـ ArrayBuffer ثم تحويله لـ Base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')
    
    // WebM and MP4 are commonly produced by browsers
    const mimeType = file.type || 'audio/webm'

    const model = getGenAI().getGenerativeModel({
      model: 'gemini-2.5-flash', // Updated: 1.5-flash no longer available on this API key
      generationConfig: {
        temperature: 0.1,
      }
    })

    const prompt = `أنت خبير تفريغ صوتي للغة العربية.
استمع إلى هذا التسجيل الصوتي لطالب يجيب على سؤال تعليمي، واكتب النص الذي يقوله بدقة تامة.
- لا تضف أي مقدمات أو شروحات.
- اكتب النص العربي فقط.
- تجاهل أي أصوات غير واضحة أو ضجيج.
- حافظ على المصطلحات العلمية إن وجدت.`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      { text: prompt }
    ])

    const text = result.response.text()

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'لم أتمكن من استخراج أي نص من الصوت.' }, { status: 400 })
    }

    return NextResponse.json({ text: text.trim() })

  } catch (error: any) {
    console.error('خطأ في تفريغ الصوت:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الصوت.', details: error.message },
      { status: 500 }
    )
  }
}
