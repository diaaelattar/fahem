import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { fileName } = await request.json()
    if (!fileName) return NextResponse.json({ error: 'اسم الملف مطلوب' }, { status: 400 })

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.storage
      .from('documents')
      .createSignedUploadUrl(fileName)

    if (error) {
      throw new Error(`تعذر توليد رابط الرفع: ${error.message}`)
    }

    return NextResponse.json({ signedUrl: data.signedUrl, token: data.token })
  } catch (error: any) {
    console.error('Upload Token Error:', error)
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 })
  }
}
