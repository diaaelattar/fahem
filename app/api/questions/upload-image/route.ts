import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// POST /api/questions/upload-image
// يقبل: FormData { file, questionId }
// يرفع الصورة لـ Supabase Storage ثم يحدث حقل question_image_url في الـ questions table
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // التحقق من أن المستخدم مشرف
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const questionId = formData.get('questionId') as string

    if (!file || !questionId) {
      return NextResponse.json({ error: 'الملف ومعرف السؤال مطلوبان' }, { status: 400 })
    }

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WebP, GIF' }, { status: 400 })
    }

    // التحقق من حجم الملف (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم الصورة يتجاوز الحد المسموح (5 ميجابايت)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `question-images/${questionId}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // رفع الصورة إلى Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `فشل رفع الصورة: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // تحديث حقل question_image_url في قاعدة البيانات
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        question_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)

    if (updateError) {
      return NextResponse.json({ error: `فشل تحديث السؤال: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, imageUrl: publicUrl })
  } catch (err: any) {
    console.error('Question image upload error:', err)
    return NextResponse.json({ error: err.message || 'خطأ غير متوقع' }, { status: 500 })
  }
}

// DELETE /api/questions/upload-image
// يحذف الصورة ويمسح حقل question_image_url
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).single()
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { questionId, imageUrl } = await request.json()
    if (!questionId) return NextResponse.json({ error: 'معرف السؤال مطلوب' }, { status: 400 })

    // استخراج مسار الملف من الـ URL وحذفه من Storage
    if (imageUrl) {
      const urlPath = imageUrl.split('/documents/')[1]
      if (urlPath) {
        await supabase.storage.from('documents').remove([decodeURIComponent(urlPath)])
      }
    }

    await supabase
      .from('questions')
      .update({ question_image_url: null, updated_at: new Date().toISOString() })
      .eq('id', questionId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
