import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { schoolName, contactName, phone, email } = await request.json()

    if (!schoolName || !contactName || !phone || !email) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة للتسجيل.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase.from('school_registrations').insert({
      school_name: schoolName,
      contact_name: contactName,
      phone: phone,
      email: email,
    })

    if (error) {
      console.error('[School Registration Error]:', error.message)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء حفظ البيانات في قاعدة البيانات: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل اهتمام مدرستك بنجاح في قاعدة البيانات الحية لمنصة فاهم!',
    })
  } catch (error: any) {
    console.error('[School Lead API Exception]:', error)
    return NextResponse.json(
      { error: error.message || 'خطأ داخلي غير متوقع أثناء معالجة الطلب.' },
      { status: 500 }
    )
  }
}
