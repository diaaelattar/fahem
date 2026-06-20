import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkIPRateLimit } from '@/lib/security/rate-limiter'

// دالة مساعدة لنسخ الكوكيز المحدثة من supabaseResponse إلى استجابة إعادة التوجيه
// تمنع هذه الدالة فقدان الجلسة عند استخدام NextResponse.redirect
function redirectWithCookies(
  request: NextRequest,
  targetUrl: string,
  supabaseResponse: NextResponse
) {
  const redirectResponse = NextResponse.redirect(
    new URL(targetUrl, request.url)
  )
  supabaseResponse.cookies.getAll().forEach((cookie) => {
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
  // ── نبدأ بـ response تحمل headers الـ request الأصلي ──────────────────────
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options?: Record<string, unknown>
          }>
        ) {
          // ── الخطوة 1: حدّث كوكيز الـ request حتى يراها الكود التالي في نفس الطلب
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // ── الخطوة 2: أنشئ response جديدة تحمل الـ request المحدّث
          supabaseResponse = NextResponse.next({ request })
          // ── الخطوة 3: اكتب الكوكيز على الـ response حتى تصل للمتصفح
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── 0. حماية IP على مسارات المصادقة ضد هجمات التخمين (Brute-Force) ─────────────
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'
    const rateCheck = await checkIPRateLimit(ip, 20, 60000) // 20 طلب في الدقيقة
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'تجاوزت عدد المحاولات المسموح به. يرجى المحاولة لاحقاً.' },
        { status: 429 }
      )
    }
  }

  // ── Session Timeout لمديري المدارس (30 دقيقة خمول) ─────────────────────
  const SCHOOL_SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 دقيقة
  const isSchoolRoute = pathname.startsWith('/school')

  if (user && isSchoolRoute) {
    const lastActivity = request.cookies.get('school_last_activity')?.value
    const now = Date.now()

    if (lastActivity) {
      const elapsed = now - parseInt(lastActivity, 10)
      if (elapsed > SCHOOL_SESSION_TIMEOUT_MS) {
        // انتهت الجلسة → تسجيل خروج وإعادة توجيه
        await supabase.auth.signOut()
        const loginRedirect = redirectWithCookies(
          request,
          '/auth/school/login',
          supabaseResponse
        )
        loginRedirect.cookies.delete('school_last_activity')
        return loginRedirect
      }
    }

    // تحديث وقت آخر نشاط عند كل طلب
    supabaseResponse.cookies.set('school_last_activity', String(now), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SCHOOL_SESSION_TIMEOUT_MS / 1000,
      path: '/school',
    })
  }

  // ── Session Timeout للمعلمين (30 دقيقة خمول) ─────────────────────
  const TEACHER_SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 دقيقة
  const isTeacherRoute = pathname.startsWith('/teacher')
  const isTrialExpiredPage = pathname === '/teacher/trial-expired'

  if (user && isTeacherRoute && !isTrialExpiredPage) {
    const lastActivity = request.cookies.get('teacher_last_activity')?.value
    const now = Date.now()

    if (lastActivity) {
      const elapsed = now - parseInt(lastActivity, 10)
      if (elapsed > TEACHER_SESSION_TIMEOUT_MS) {
        await supabase.auth.signOut()
        const loginRedirect = redirectWithCookies(
          request,
          '/auth/login',
          supabaseResponse
        )
        loginRedirect.cookies.delete('teacher_last_activity')
        return loginRedirect
      }
    }

    supabaseResponse.cookies.set('teacher_last_activity', String(Date.now()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TEACHER_SESSION_TIMEOUT_MS / 1000,
      path: '/teacher',
    })
  }

  const isAdminRoute = pathname.startsWith('/admin')
  const isStudentRoute = pathname.startsWith('/student')
  const isSchoolAdminRoute = pathname.startsWith('/school')
  const isProtectedRoute =
    isAdminRoute || isStudentRoute || isTeacherRoute || isSchoolAdminRoute

  // ── مسارات الضيف العامة — لا تحتاج auth ─────────────────────────────────
  const isGuestExamRoute = pathname.startsWith('/exam/')
  const isGuestExamAPI = pathname.startsWith('/api/exam/guest')
  if (isGuestExamRoute || isGuestExamAPI) {
    return supabaseResponse
  }

  // ── 4. استخراج الدور من الـ JWT Metadata مباشرة (Zero-DB Hits!) ──────────
  const role = user?.user_metadata?.role || null

  // ── 5. حماية مسارات API الخاصة بالمعلمين والأدمن والمدارس بالاعتماد على JWT ──────
  const isTeacherAPI = pathname.startsWith('/api/teacher/')
  const isAdminAPI = pathname.startsWith('/api/admin/')
  const isSchoolAPI = pathname.startsWith('/api/school/')

  if (isTeacherAPI || isAdminAPI || isSchoolAPI) {
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح. يرجى تسجيل الدخول أولاً.' },
        { status: 401 }
      )
    }

    if (isTeacherAPI && role !== 'teacher') {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية. هذا المسار للمعلمين فقط.' },
        { status: 403 }
      )
    }

    if (isAdminAPI && role !== 'admin') {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية. هذا المسار للمسؤولين فقط.' },
        { status: 403 }
      )
    }

    if (isSchoolAPI && role !== 'school_admin' && role !== 'admin') {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية. هذا المسار لمديري المدارس فقط.' },
        { status: 403 }
      )
    }
  }

  // ── 6. غير مسجل يحاول الوصول لمسار محمي → صفحة الدخول ──────────────────
  if (!user && isProtectedRoute) {
    return redirectWithCookies(request, '/auth/login', supabaseResponse)
  }

  // ── 7. مسجل يحاول الوصول لمسار محمي → تحقق من الدور والتوجيه (Zero-DB) ─────
  if (user && isProtectedRoute) {
    if (role === null) {
      // لا يوجد دور (مستخدم جديد)
      if (isAdminRoute || isTeacherRoute) {
        return redirectWithCookies(request, '/auth/login', supabaseResponse)
      }
      if (pathname === '/student/onboarding') return supabaseResponse
      return redirectWithCookies(
        request,
        '/student/onboarding',
        supabaseResponse
      )
    }

    // منع تداخل مسارات الأدوار المختلفة
    if (
      role === 'admin' &&
      (isStudentRoute || isTeacherRoute || isSchoolAdminRoute)
    ) {
      return redirectWithCookies(request, '/admin/dashboard', supabaseResponse)
    }

    if (
      role === 'school_admin' &&
      (isAdminRoute || isStudentRoute || isTeacherRoute)
    ) {
      return redirectWithCookies(request, '/school/dashboard', supabaseResponse)
    }

    if (
      role === 'teacher' &&
      (isAdminRoute || isStudentRoute || isSchoolAdminRoute)
    ) {
      return redirectWithCookies(
        request,
        '/teacher/dashboard',
        supabaseResponse
      )
    }

    if (
      role === 'student' &&
      (isAdminRoute || isTeacherRoute || isSchoolAdminRoute)
    ) {
      return redirectWithCookies(
        request,
        '/student/dashboard',
        supabaseResponse
      )
    }

    // ── فحص اختيار الصف للطالب (Zero-DB) ──
    if (role === 'student' && isStudentRoute) {
      const hasGrade = !!user.user_metadata?.grade_id
      const isOnboardingPage = pathname === '/student/onboarding'

      if (!hasGrade && !isOnboardingPage) {
        return redirectWithCookies(
          request,
          '/student/onboarding',
          supabaseResponse
        )
      }

      if (hasGrade && isOnboardingPage) {
        return redirectWithCookies(
          request,
          '/student/dashboard',
          supabaseResponse
        )
      }
    }

    // ── فحص اختيار المادة للمعلم (Zero-DB: منع تخطي الإعداد) ──
    if (role === 'teacher' && isTeacherRoute) {
      const hasSubject = !!user.user_metadata?.subject_id
      const isOnboardingPage = pathname === '/auth/teacher-onboarding'

      if (!hasSubject && !isOnboardingPage) {
        return redirectWithCookies(
          request,
          '/auth/teacher-onboarding',
          supabaseResponse
        )
      }

      if (hasSubject && isOnboardingPage) {
        return redirectWithCookies(
          request,
          '/teacher/dashboard',
          supabaseResponse
        )
      }
    }
  }

  // ── 8. المستخدم المسجل على الصفحة الرئيسية أو صفحة تسجيل دخول المعلم → وجهه للوحة التحكم ──
  const isTeacherLoginPage = pathname === '/auth/teacher-login'
  if (user && (pathname === '/' || isTeacherLoginPage)) {
    if (role === 'admin') {
      return redirectWithCookies(request, '/admin/dashboard', supabaseResponse)
    } else if (role === 'school_admin') {
      return redirectWithCookies(request, '/school/dashboard', supabaseResponse)
    } else if (role === 'teacher') {
      return redirectWithCookies(
        request,
        '/teacher/dashboard',
        supabaseResponse
      )
    } else if (role === 'student') {
      return redirectWithCookies(
        request,
        '/student/dashboard',
        supabaseResponse
      )
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
