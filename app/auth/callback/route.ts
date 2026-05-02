import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        }

        if (profile?.role === 'student') {
          // Check if student has grade set (onboarding complete)
          const { data: student } = await supabase
            .from('students')
            .select('grade_id')
            .eq('id', user.id)
            .single()

          if (!student?.grade_id) {
            return NextResponse.redirect(`${origin}/student/onboarding`)
          }
          return NextResponse.redirect(`${origin}/student/dashboard`)
        }

        // Brand new Google user — create student profile
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'طالب'
        const avatarUrl = user.user_metadata?.avatar_url || null

        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: 'student',
        })

        await supabase.from('students').upsert({
          id: user.id,
          xp_points: 0,
          level: 1,
          streak_days: 0,
        })

        return NextResponse.redirect(`${origin}/student/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
