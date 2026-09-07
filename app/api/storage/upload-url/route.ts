import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getR2UploadUrl } from '@/lib/storage/r2'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, contentType, folder = 'worksheets' } = body

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'يرجى إرسال اسم الملف ونوعه' },
        { status: 400 }
      )
    }

    // مجلد منظم لكل مستخدم
    const userFolder = `${folder}/${user.id}`
    const { uploadUrl, key, publicUrl } = await getR2UploadUrl(
      fileName,
      contentType,
      userFolder,
      300 // 5 دقائق صلاحية
    )

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      publicUrl,
    })
  } catch (error: any) {
    console.error('R2 upload-url error:', error)
    return NextResponse.json(
      { error: error.message || 'فشل توليد رابط الرفع' },
      { status: 500 }
    )
  }
}
