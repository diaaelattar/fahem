import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai-client'
import { QUESTION_GENERATION_PROMPT, YOUTUBE_ANALYSIS_PROMPT } from '@/lib/ai/prompts'
import { parseQuestionsResponse } from '@/lib/ai/openai-client'

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق من الصلاحية
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'هذه الخاصية للمديرين فقط' }, { status: 403 })

    // 2. استلام البيانات
    const body = await request.json()
    const { documentId, fileType, pastedText, youtubeUrl, subjectId, gradeId } = body

    // 3. جلب بيانات المستند وبيانات المنهج
    const { data: doc } = await supabase.from('documents').select('*').eq('id', documentId).single()
    if (!doc) return NextResponse.json({ error: 'المستند غير موجود' }, { status: 404 })

    const [{ data: subject }, { data: grade }] = await Promise.all([
      supabase.from('subjects').select('name_ar').eq('id', subjectId).single(),
      supabase.from('grades').select('name_ar').eq('id', gradeId).single(),
    ])

    // 4. تحديث الحالة إلى "processing"
    await supabase.from('documents').update({ processing_status: 'processing' }).eq('id', documentId)

    const openai = getOpenAIClient()
    let extractedText = ''

    // 5. استخراج النص حسب نوع الملف
    if (fileType === 'text' && pastedText) {
      extractedText = pastedText
    } else if (fileType === 'youtube' && youtubeUrl) {
      // ملاحظة: في الإنتاج يستخدم yt-dlp + Whisper
      extractedText = `محتوى فيديو يوتيوب: ${youtubeUrl}\n[يتطلب تكاملاً مع yt-dlp في بيئة الإنتاج]`
    } else if (doc.file_url) {
      // استخراج النص من الملف باستخدام Unstructured.io
      try {
        const unstructuredApiKey = process.env.UNSTRUCTURED_API_KEY
        if (unstructuredApiKey && doc.file_url) {
          const fileResponse = await fetch(doc.file_url)
          const fileBuffer = await fileResponse.arrayBuffer()
          const formData = new FormData()
          formData.append('files', new Blob([fileBuffer]), `document.${fileType}`)
          formData.append('strategy', 'fast')
          formData.append('languages', 'ara')

          const unstructuredResponse = await fetch(
            process.env.UNSTRUCTURED_API_URL || 'https://api.unstructured.io/general/v0/general',
            {
              method: 'POST',
              headers: { 'unstructured-api-key': unstructuredApiKey },
              body: formData,
            }
          )

          if (unstructuredResponse.ok) {
            const elements = await unstructuredResponse.json()
            extractedText = elements.map((el: any) => el.text || '').filter(Boolean).join('\n')
          }
        }

        // Fallback: إذا كان الملف صوتاً أو فيديو، استخدم Whisper
        if (!extractedText && (fileType === 'mp3' || fileType === 'mp4' || fileType === 'wav')) {
          const audioResponse = await fetch(doc.file_url)
          const audioBuffer = await audioResponse.arrayBuffer()
          const audioFile = new File([audioBuffer], `audio.${fileType}`, { type: `audio/${fileType}` })

          const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'ar',
          })
          extractedText = transcription.text
        }
      } catch (extractError) {
        console.error('فشل استخراج النص:', extractError)
        extractedText = doc.extracted_text || ''
      }
    }

    if (!extractedText || extractedText.length < 50) {
      await supabase.from('documents').update({ processing_status: 'failed', metadata: { error: 'النص المستخرج قصير جداً أو فارغ' } }).eq('id', documentId)
      return NextResponse.json({ error: 'لم يتمكن النظام من استخراج نص كافٍ من المحتوى المرفوع' }, { status: 400 })
    }

    // 6. حفظ النص المستخرج
    await supabase.from('documents').update({ extracted_text: extractedText }).eq('id', documentId)

    // 7. توليد الأسئلة باستخدام GPT-4o
    const prompt = QUESTION_GENERATION_PROMPT({
      subject: subject?.name_ar || 'غير محدد',
      grade: grade?.name_ar || 'غير محدد',
      extractedText,
      questionCount: 12,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    })

    const rawResponse = completion.choices[0]?.message?.content || ''
    const result = parseQuestionsResponse(rawResponse)

    // 8. تحديث حالة المستند إلى "completed"
    await supabase.from('documents').update({
      processing_status: 'completed',
      questions_count: result.questions.length,
      metadata: { ai_metadata: result.metadata, extraction_length: extractedText.length },
    }).eq('id', documentId)

    return NextResponse.json({
      success: true,
      questions: result.questions,
      metadata: result.metadata,
      document_id: documentId,
    })

  } catch (error: any) {
    console.error('خطأ في توليد الأسئلة:', error)
    return NextResponse.json({ error: error.message || 'خطأ داخلي في الخادم' }, { status: 500 })
  }
}
