import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // إذا لم يكن مسجلاً وحاول الوصول لمسار محمي
  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/student'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // إذا كان مسجلاً، تحقق من الدور
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/student'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // المدير يحاول الوصول لمسار الطالب
    if (profile.role === 'admin' && pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    // الطالب يحاول الوصول لمسار المدير
    if (profile.role === 'student' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // إعادة توجيه المستخدم المسجل من الصفحة الرئيسية
  if (user && pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else if (profile?.role === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
