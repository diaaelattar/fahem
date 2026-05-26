import { createClient } from '@supabase/supabase-js'

// ─── 1. إعداد عميل Supabase المسؤول للعمليات الأمنية والحسابية ─────────────────
// نستخدم مفتاح الـ Service Role لتجنب تجاوز صلاحيات RLS أثناء تسجيل استهلاك الـ AI
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface QuotaCheckResult {
  allowed: boolean
  limit: number
  usage: number
  remaining: number
  isPremium: boolean
  role: string
  message?: string
}

/**
 * دالة التحقق من كوتا الذكاء الاصطناعي اليومية للمستخدم
 * @param userId معرف المستخدم
 * @param apiRoute مسار الـ API المستدعى
 */
export async function checkAIQuota(
  userId: string,
  apiRoute: string
): Promise<QuotaCheckResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_and_log_ai_usage', {
      p_user_id: userId,
      p_api_route: apiRoute,
    })

    if (error) {
      console.error('[AI Quota System Error]', error.message)
      // في حالة حدوث خطأ بالنظام، نسمح بالعملية كفالباك لمنع تعطيل الخدمة
      return {
        allowed: true,
        limit: 100,
        usage: 0,
        remaining: 100,
        isPremium: false,
        role: 'student',
      }
    }

    const result = data as {
      allowed: boolean
      limit: number
      usage: number
      remaining: number
      is_premium: boolean
      role: string
    }

    const friendlyResult: QuotaCheckResult = {
      allowed: result.allowed,
      limit: result.limit,
      usage: result.usage,
      remaining: result.remaining,
      isPremium: result.is_premium,
      role: result.role,
    }

    if (!result.allowed) {
      if (result.role === 'student' && !result.is_premium) {
        friendlyResult.message = `عفواً، لقد استنفذت الحد اليومي المجاني للاستخدام اليومي (${result.limit} عمليات). يرجى الترقية إلى باقة VIP للحصول على استخدام شبه غير محدود!`
      } else {
        friendlyResult.message = `عفواً، لقد تجاوزت الحد الأقصى للاستخدام اليومي الوقائي للـ AI اليوم (${result.limit} عملية). يرجى المحاولة مرة أخرى غداً.`
      }
    }

    return friendlyResult
  } catch (err: any) {
    console.error('[AI Quota Unexpected Exception]', err.message)
    return {
      allowed: true,
      limit: 100,
      usage: 0,
      remaining: 100,
      isPremium: false,
      role: 'student',
    }
  }
}

// ─── 2. نظام الـ Memory-based Rate Limiter للمسارات العامة (كحماية للـ Auth) ───
const ipRequestCache = new Map<string, { count: number; resetTime: number }>()

/**
 * دالة التحقق من معدل الطلبات للـ IP للحماية ضد هجمات القوة الغاشمة (Brute-Force)
 * @param ip عنوان الـ IP للطلب
 * @param limit الحد الأقصى للطلبات في الفترة
 * @param windowMs طول الفترة الزمنية بالمللي ثانية (مثال: دقيقة واحدة)
 */
export function checkIPRateLimit(
  ip: string,
  limit: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = ipRequestCache.get(ip)

  if (!entry || now > entry.resetTime) {
    // إدخال جديد أو انتهت صلاحية الفترة السابقة
    const resetTime = now + windowMs
    ipRequestCache.set(ip, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }

  // تحديث العداد الحالي
  entry.count += 1
  const remaining = Math.max(0, limit - entry.count)

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  return { allowed: true, remaining, resetTime: entry.resetTime }
}
