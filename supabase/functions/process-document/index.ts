// supabase/functions/process-document/index.ts
// Supabase Edge Function - تعمل على Deno Runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. التحقق من الصلاحية
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'للمديرين فقط' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. استلام البيانات
    const { documentId } = await req.json()
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId مطلوب' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. جلب المستند
    const { data: document } = await supabaseClient
      .from('documents')
      .select('*, subjects(name_ar), grades(name_ar)')
      .eq('id', documentId)
      .single()

    if (!document) {
      return new Response(JSON.stringify({ error: 'المستند غير موجود' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. تحديث الحالة
    await supabaseClient
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId)

    let extractedText = document.extracted_text || ''
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

    // 5. معالجة الملف حسب نوعه
    if (!extractedText && document.file_url) {
      if (['pdf', 'docx', 'pptx'].includes(document.file_type)) {
        // استخدام Unstructured.io
        const unstructuredKey = Deno.env.get('UNSTRUCTURED_API_KEY')
        if (unstructuredKey) {
          try {
            const fileResponse = await fetch(document.file_url)
            const fileBuffer = await fileResponse.arrayBuffer()
            const formData = new FormData()
            formData.append(
              'files',
              new Blob([fileBuffer]),
              `doc.${document.file_type}`
            )
            formData.append('strategy', 'fast')
            formData.append('languages', 'ara')

            const unstructuredRes = await fetch(
              Deno.env.get('UNSTRUCTURED_API_URL') ||
                'https://api.unstructured.io/general/v0/general',
              {
                method: 'POST',
                headers: { 'unstructured-api-key': unstructuredKey },
                body: formData,
              }
            )

            if (unstructuredRes.ok) {
              const elements = await unstructuredRes.json()
              extractedText = elements
                .map((el: any) => el.text || '')
                .filter(Boolean)
                .join('\n')
            }
          } catch (e) {
            console.error('Unstructured error:', e)
          }
        }
      } else if (['mp3', 'mp4', 'wav', 'm4a'].includes(document.file_type)) {
        // Whisper transcription
        const audioResponse = await fetch(document.file_url)
        const audioBuffer = await audioResponse.arrayBuffer()
        const audioFile = new File(
          [audioBuffer],
          `audio.${document.file_type}`,
          {
            type: document.file_type === 'mp4' ? 'video/mp4' : 'audio/mpeg',
          }
        )

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'ar',
        })
        extractedText = transcription.text
      }
    }

    if (!extractedText || extractedText.length < 50) {
      await supabaseClient
        .from('documents')
        .update({
          processing_status: 'failed',
          metadata: { error: 'النص المستخرج قصير جداً' },
        })
        .eq('id', documentId)

      return new Response(
        JSON.stringify({ error: 'لم يتمكن النظام من استخراج نص كافٍ' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 6. توليد الأسئلة
    const prompt = `
أنت خبير في المناهج المصرية. قم بتوليد 12 سؤالاً تقييمياً عالي الجودة من النص التالي.
المادة: ${(document.subjects as any)?.name_ar || 'غير محدد'}
الصف: ${(document.grades as any)?.name_ar || 'غير محدد'}

النص:
"""
${extractedText.slice(0, 6000)}
"""

أنتج JSON فقط بالصيغة:
{"questions":[{"type":"mcq","question_text":"...","options":["أ","ب","ج","د"],"correct_answer":"...","explanation":"...","difficulty":"medium","points":2}]}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    })

    const rawJson = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(rawJson)
    const questions = parsed.questions || []

    // 7. حفظ الأسئلة
    if (questions.length > 0) {
      const inserts = questions.map((q: any) => ({
        admin_id: user.id,
        document_id: documentId,
        question_type: q.type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_level: q.difficulty || 'medium',
        points: q.points || 1,
        subject_id: document.subject_id,
        grade_id: document.grade_id,
        is_approved: false,
      }))

      await supabaseClient.from('questions').insert(inserts)
    }

    // 8. تحديث المستند
    await supabaseClient
      .from('documents')
      .update({
        extracted_text: extractedText,
        processing_status: 'completed',
        questions_count: questions.length,
      })
      .eq('id', documentId)

    return new Response(
      JSON.stringify({ success: true, questions_count: questions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'خطأ داخلي' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
