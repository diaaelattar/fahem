import { createClient } from '@supabase/supabase-js'

// ─── التحقق من أن هذا الملف يعمل فقط على الخادم ───────────────────────────
if (typeof window !== 'undefined') {
  throw new Error(
    '[rate-limiter] يجب استخدام هذا الملف فقط على الخادم (Server-Side). لا تستورده في Client Components.'
  )
}

// ─── عميل Supabase المسؤول للعمليات الأمنية ──────────────────────────────────
// نستخدم مفتاح Service Role لتجاوز RLS في سجلات Rate Limiting
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير معرّفين في متغيرات البيئة'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

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
 * تستخدم دالة DB ذرية لتجنب Race Conditions
 */
export async function checkAIQuota(
  userId: string,
  apiRoute: string
): Promise<QuotaCheckResult> {
  try {
    const supabaseAdmin = getAdminClient()

    const { data, error } = await supabaseAdmin.rpc('check_and_log_ai_usage', {
      p_user_id: userId,
      p_api_route: apiRoute,
    })

    if (error) {
      console.error('[AI Quota System Error]', error.message)
      // في حالة خطأ في النظام، نسمح بالعملية لمنع تعطيل الخدمة
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
        friendlyResult.message = `عفواً، لقد استنفذت الحد اليومي المجاني للاستخدام (${result.limit} عمليات). يرجى الترقية إلى باقة VIP للحصول على استخدام شبه غير محدود!`
      } else {
        friendlyResult.message = `عفواً، لقد تجاوزت الحد الأقصى للاستخدام اليومي للـ AI اليوم (${result.limit} عملية). يرجى المحاولة مرة أخرى غداً.`
      }
    }

    return friendlyResult
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[AI Quota Unexpected Exception]', msg)
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

// ─── DB-based IP Rate Limiter (يعمل في Serverless/Edge) ──────────────────────
// يحل مشكلة Memory Map التي لا تعمل عبر Instances متعددة في Vercel

/**
 * التحقق من معدل الطلبات لعنوان IP
 * يستخدم قاعدة البيانات للتخزين المركزي بدلاً من الذاكرة المحلية
 */
export async function checkIPRateLimit(
  ip: string,
  limit: number = 20,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const supabaseAdmin = getAdminClient()
    const windowSeconds = Math.ceil(windowMs / 1000)

    const { data, error } = await supabaseAdmin.rpc(
      'check_and_log_ip_rate_limit',
      {
        p_ip: ip,
        p_endpoint: 'auth',
        p_limit: limit,
        p_window_seconds: windowSeconds,
      }
    )

    if (error) {
      console.error('[IP Rate Limit DB Error]', error.message)
      // Fail-open: إذا فشل النظام، اسمح بالطلب
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs }
    }

    const result = data as {
      allowed: boolean
      count: number
      limit: number
      remaining: number
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: Date.now() + windowMs,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[IP Rate Limit Exception]', msg)
    // Fail-open للحفاظ على الخدمة
    return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs }
  }
}
