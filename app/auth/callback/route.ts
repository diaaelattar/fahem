import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // تحقق إذا كان البروفايل موجوداً
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        }

        if (profile?.role === 'student') {
          // تحقق إذا اختار الطالب صفه (onboarding مكتمل)
          const { data: student } = await supabase
            .from('students')
            .select('grade_id')
            .eq('id', user.id)
            .maybeSingle()

          if (!student?.grade_id) {
            return NextResponse.redirect(`${origin}/student/onboarding`)
          }
          return NextResponse.redirect(`${origin}/student/dashboard`)
        }

        if (profile?.role === 'teacher') {
          // Check if teacher has completed onboarding (has a subject_id)
          const { data: teacher } = await supabase
            .from('teachers')
            .select('subject_id')
            .eq('id', user.id)
            .maybeSingle()
          
          if (!teacher?.subject_id) {
            return NextResponse.redirect(`${origin}/auth/teacher-onboarding`)
          }
          return NextResponse.redirect(`${origin}/teacher/dashboard`)
        }

        // مستخدم Google جديد — إنشاء بروفايل
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const fullName =
          user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم'
        const avatarUrl = user.user_metadata?.avatar_url || null
        const requestedRole =
          searchParams.get('role') === 'teacher' ? 'teacher' : 'student'

        await supabaseAdmin.from('profiles').upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: requestedRole,
        })

        if (requestedRole === 'student') {
          await supabaseAdmin.from('students').upsert({
            id: user.id,
            xp_points: 0,
            level: 1,
            streak_days: 0,
          })
          return NextResponse.redirect(`${origin}/student/onboarding`)
        } else {
          await supabaseAdmin.from('teachers').upsert({
            id: user.id,
            subscription_status: 'trial',
          })
          return NextResponse.redirect(`${origin}/auth/teacher-onboarding`)
        }
      }
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_failed`
  )
}
