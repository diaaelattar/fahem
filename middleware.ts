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

  const isAdminRoute   = pathname.startsWith('/admin')
  const isStudentRoute = pathname.startsWith('/student')
  const isTeacherRoute = pathname.startsWith('/teacher')
  const isProtectedRoute = isAdminRoute || isStudentRoute || isTeacherRoute

  // ── 1. غير مسجل يحاول الوصول لمسار محمي → صفحة الدخول ──────────────────
  if (!user && isProtectedRoute) {
    return redirectWithCookies(request, '/auth/login', supabaseResponse)
  }

  // ── 2. مسجل يحاول الوصول لمسار محمي → تحقق من الدور ──────────────────────
  if (user && isProtectedRoute) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // خطأ في قاعدة البيانات (ليس "لا توجد نتائج") → اترك الصفحة تتعامل معه
    if (profileError && profileError.code !== 'PGRST116') {
      return supabaseResponse
    }

    // لا يوجد بروفايل أصلاً (مستخدم جديد)
    if (!profile) {
      // أدمن أو معلم بدون بروفايل → صفحة الدخول (وليس الـ Onboarding)
      if (isAdminRoute || isTeacherRoute) {
        return redirectWithCookies(request, '/auth/login', supabaseResponse)
      }
      // طالب بدون بروفايل → onboarding
      if (pathname === '/student/onboarding') return supabaseResponse
      return redirectWithCookies(request, '/student/onboarding', supabaseResponse)
    }

    // ── حماية المسارات بحسب الدور ─────────────────────────────────────────

    // الأدمن يحاول الدخول لمسار طالب أو معلم → لوحة الأدمن
    if (profile.role === 'admin' && (isStudentRoute || isTeacherRoute)) {
      return redirectWithCookies(request, '/admin/dashboard', supabaseResponse)
    }

    // المعلم يحاول الدخول لمسار أدمن أو طالب → لوحة المعلم
    if (profile.role === 'teacher' && (isAdminRoute || isStudentRoute)) {
      return redirectWithCookies(request, '/teacher/dashboard', supabaseResponse)
    }

    // الطالب يحاول الدخول لمسار أدمن أو معلم → لوحة الطالب
    if (profile.role === 'student' && (isAdminRoute || isTeacherRoute)) {
      return redirectWithCookies(request, '/student/dashboard', supabaseResponse)
    }

    // ── فحص اختيار الصف للطالب ──────────────────────────────────────────────
    if (profile.role === 'student' && isStudentRoute) {
      const { data: student } = await supabase
        .from('students')
        .select('grade_id')
        .eq('id', user.id)
        .maybeSingle()

      const hasGrade = !!student?.grade_id
      const isOnboardingPage = pathname === '/student/onboarding'

      if (!hasGrade && !isOnboardingPage) {
        // طالب لم يختر صفه → Onboarding
        return redirectWithCookies(request, '/student/onboarding', supabaseResponse)
      }

      if (hasGrade && isOnboardingPage) {
        // طالب اختار صفه بالفعل ويحاول الدخول للـ Onboarding → Dashboard
        return redirectWithCookies(request, '/student/dashboard', supabaseResponse)
      }
    }
  }

  // ── 3. المستخدم المسجل على الصفحة الرئيسية → وجهه للوحة التحكم ──────────
  if (user && pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

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
