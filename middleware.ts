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
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isAdminRoute = pathname.startsWith('/admin')
  const isStudentRoute = pathname.startsWith('/student')
  const isTeacherRoute = pathname.startsWith('/teacher')
  const isSchoolAdminRoute = pathname.startsWith('/school')
  const isProtectedRoute =
    isAdminRoute || isStudentRoute || isTeacherRoute || isSchoolAdminRoute

  // ── مسارات الضيف العامة — لا تحتاج auth ─────────────────────────────────
  const isGuestExamRoute = pathname.startsWith('/exam/')
  const isGuestExamAPI = pathname.startsWith('/api/exam/guest')
  if (isGuestExamRoute || isGuestExamAPI) {
    return supabaseResponse
  }

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

  // ── إصلاح: جلب الـ profile مرة واحدة فقط بدلاً من 3 استعلامات ──────────
  // يُقلص latency بـ 100–300ms لكل طلب ويُخفف الضغط على connection pool
  let profileRole: string | null = null
  let profileFetched = false

  async function getProfileRole(): Promise<string | null> {
    if (profileFetched) return profileRole
    profileFetched = true
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    profileRole = data?.role ?? null
    return profileRole
  }

  // ── 0b. حماية مسارات API الخاصة بالمعلمين والأدمن والمدارس ──────────────────────
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

    const role = await getProfileRole()

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

  // ── 1. غير مسجل يحاول الوصول لمسار محمي → صفحة الدخول ──────────────────
  if (!user && isProtectedRoute) {
    return redirectWithCookies(request, '/auth/login', supabaseResponse)
  }

  // ── 2. مسجل يحاول الوصول لمسار محمي → تحقق من الدور ──────────────────────
  if (user && isProtectedRoute) {
    const role = await getProfileRole() // يُعيد القيمة المخزّنة إذا سبق جلبها

    // خطأ في جلب البروفايل (الدالة ستُعيد null) — اترك الصفحة تتعامل معه
    if (role === null && profileFetched) {
      // لا يوجد بروفايل أصلاً (مستخدم جديد)
      // أدمن أو معلم بدون بروفايل → صفحة الدخول
      if (isAdminRoute || isTeacherRoute) {
        return redirectWithCookies(request, '/auth/login', supabaseResponse)
      }
      // طالب بدون بروفايل → onboarding
      if (pathname === '/student/onboarding') return supabaseResponse
      return redirectWithCookies(
        request,
        '/student/onboarding',
        supabaseResponse
      )
    }

    if (role) {
      // ── حماية المسارات بحسب الدور ─────────────────────────────────────────

      // الأدمن يحاول الدخول لمسار طالب أو معلم أو مدرسة → لوحة الأدمن
      if (
        role === 'admin' &&
        (isStudentRoute || isTeacherRoute || isSchoolAdminRoute)
      ) {
        return redirectWithCookies(
          request,
          '/admin/dashboard',
          supabaseResponse
        )
      }

      // مدير المدرسة يحاول الدخول لمسار أدمن أو طالب أو معلم → لوحة المدرسة
      if (
        role === 'school_admin' &&
        (isAdminRoute || isStudentRoute || isTeacherRoute)
      ) {
        return redirectWithCookies(
          request,
          '/school/dashboard',
          supabaseResponse
        )
      }

      // المعلم يحاول الدخول لمسار أدمن أو طالب أو مدرسة → لوحة المعلم
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

      // الطالب يحاول الدخول لمسار أدمن أو معلم أو مدرسة → لوحة الطالب
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

      // ── فحص اختيار الصف للطالب ──────────────────────────────────────────────
      if (role === 'student' && isStudentRoute) {
        const { data: student } = await supabase
          .from('students')
          .select('grade_id')
          .eq('id', user.id)
          .maybeSingle()

        const hasGrade = !!student?.grade_id
        const isOnboardingPage = pathname === '/student/onboarding'

        if (!hasGrade && !isOnboardingPage) {
          // طالب لم يختر صفه → Onboarding
          return redirectWithCookies(
            request,
            '/student/onboarding',
            supabaseResponse
          )
        }

        if (hasGrade && isOnboardingPage) {
          // طالب اختار صفه بالفعل ويحاول الدخول للـ Onboarding → Dashboard
          return redirectWithCookies(
            request,
            '/student/dashboard',
            supabaseResponse
          )
        }
      }
    }
  }

  // ── 3. المستخدم المسجل على الصفحة الرئيسية → وجهه للوحة التحكم ──────────
  if (user && pathname === '/') {
    const role = await getProfileRole() // يُعيد القيمة المخزّنة إذا سبق جلبها

    if (role === 'admin') {
      return redirectWithCookies(request, '/admin/dashboard', supabaseResponse)
    } else if (role === 'school_admin') {
      return redirectWithCookies(
        request,
        '/school/dashboard',
        supabaseResponse
      )
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
