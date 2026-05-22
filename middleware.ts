import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// دالة مساعدة لنسخ الكوكيز المحدثة من supabaseResponse إلى استجابة إعادة التوجيه
// تمنع هذه الدالة فقدان الجلسة عند استخدام NextResponse.redirect
function redirectWithCookies(request: NextRequest, targetUrl: string, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url))
  supabaseResponse.cookies.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      expires: cookie.expires,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
    })
  })
  return redirectResponse
}

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
  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname.startsWith('/teacher'))) {
    return redirectWithCookies(request, '/auth/login', supabaseResponse)
  }

  // إذا كان مسجلاً، تحقق من الدور
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname.startsWith('/teacher'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      if (pathname === '/student/onboarding') {
        return supabaseResponse
      }
      return redirectWithCookies(request, '/student/onboarding', supabaseResponse)
    }

    // المدير يحاول الوصول لمسار الطالب أو المعلم
    if (profile.role === 'admin' && (pathname.startsWith('/student') || pathname.startsWith('/teacher'))) {
      return redirectWithCookies(request, '/admin/dashboard', supabaseResponse)
    }

    // الطالب يحاول الوصول لمسار المدير أو المعلم
    if (profile.role === 'student' && (pathname.startsWith('/admin') || pathname.startsWith('/teacher'))) {
      return redirectWithCookies(request, '/student/dashboard', supabaseResponse)
    }

    // المعلم يحاول الوصول لمسار المدير أو الطالب
    if (profile.role === 'teacher' && (pathname.startsWith('/admin') || pathname.startsWith('/student'))) {
      return redirectWithCookies(request, '/teacher/dashboard', supabaseResponse)
    }

    // Smart Barrier: فحص اختيار الصف للطالب
    if (profile.role === 'student' && pathname.startsWith('/student')) {
      const { data: student } = await supabase
        .from('students')
        .select('grade_id')
        .eq('id', user.id)
        .single()
      
      const hasGrade = !!student?.grade_id
      const isOnboardingPage = pathname === '/student/onboarding'

      if (!hasGrade && !isOnboardingPage) {
        // طالب لم يختر صفه ويحاول الدخول لأي صفحة أخرى → أعده للتسجيل
        return redirectWithCookies(request, '/student/onboarding', supabaseResponse)
      }
      
      if (hasGrade && isOnboardingPage) {
        // طالب اختار صفه بالفعل ويحاول الدخول لصفحة التسجيل → أعده للرئيسية
        return redirectWithCookies(request, '/student/dashboard', supabaseResponse)
      }
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
      return redirectWithCookies(request, '/admin/dashboard', supabaseResponse)
    } else if (profile?.role === 'teacher') {
      return redirectWithCookies(request, '/teacher/dashboard', supabaseResponse)
    } else if (profile?.role === 'student') {
      return redirectWithCookies(request, '/student/dashboard', supabaseResponse)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

