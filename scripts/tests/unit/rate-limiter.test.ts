/**
 * اختبارات وحدة: نظام Rate Limiting وكوتا الـ AI
 * يختبر منطق checkIPRateLimit بشكل معزول (بدون اتصال بقاعدة البيانات)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock: نعزل وحدة rate-limiter عن Supabase تماماً ────────────────────────────
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: vi.fn().mockResolvedValue({
      data: {
        allowed: true,
        limit: 5,
        usage: 1,
        remaining: 4,
        is_premium: false,
        role: 'student',
      },
      error: null,
    }),
  }),
}))

// استيراد الدالة بعد الـ Mock
import { checkIPRateLimit } from '@/lib/security/rate-limiter'

// ── اختبارات IP Rate Limiter ────────────────────────────────────────────────────
describe('checkIPRateLimit — IP-Based Rate Limiter', () => {
  const TEST_IP = '192.168.1.100'
  const HIGH_LOAD_IP = '10.0.0.1'

  beforeEach(() => {
    // إعادة ضبط الـ cache الداخلي للـ IP بين الاختبارات بمحاكاة نافذة زمنية جديدة
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  it('يجب أن يسمح بالطلب الأول من IP جديد', () => {
    const result = checkIPRateLimit(TEST_IP, 10, 60000)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
  })

  it('يجب أن يُرجع remaining أقل بعد كل طلب', () => {
    const ip = 'unique-ip-for-remaining-test'
    const limit = 5

    const first = checkIPRateLimit(ip, limit, 60000)
    const second = checkIPRateLimit(ip, limit, 60000)

    expect(first.remaining).toBeGreaterThan(second.remaining)
  })

  it('يجب أن يمنع الطلب بعد تجاوز الحد المسموح', () => {
    const ip = HIGH_LOAD_IP
    const limit = 3

    // استهلاك الحد كاملاً
    checkIPRateLimit(ip, limit, 60000)
    checkIPRateLimit(ip, limit, 60000)
    checkIPRateLimit(ip, limit, 60000)
    // الطلب الرابع يجب أن يُرفض
    const result = checkIPRateLimit(ip, limit, 60000)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('يجب أن يعيد السماح بالطلبات بعد انتهاء النافذة الزمنية', () => {
    const ip = 'expiry-test-ip'
    const limit = 2
    const windowMs = 500 // نافذة قصيرة للاختبار

    checkIPRateLimit(ip, limit, windowMs)
    checkIPRateLimit(ip, limit, windowMs)
    const blockedResult = checkIPRateLimit(ip, limit, windowMs)
    expect(blockedResult.allowed).toBe(false)

    // انتقال الوقت لما بعد نهاية النافذة
    vi.setSystemTime(new Date(Date.now() + 600))
    const recoveredResult = checkIPRateLimit(ip, limit, windowMs)
    expect(recoveredResult.allowed).toBe(true)
  })

  it('يجب أن يكون resetTime موجوداً وأكبر من الوقت الحالي', () => {
    const result = checkIPRateLimit('new-ip-for-reset-test', 10, 60000)
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })

  it('يجب أن تعمل حدود مختلفة لعناوين IP مختلفة بشكل مستقل', () => {
    const ip1 = 'ip-alpha-123'
    const ip2 = 'ip-beta-456'

    checkIPRateLimit(ip1, 1, 60000) // استهلاك ip1
    const ip1Result = checkIPRateLimit(ip1, 1, 60000) // يجب أن يُحجب
    const ip2Result = checkIPRateLimit(ip2, 5, 60000) // يجب أن يُسمح

    expect(ip1Result.allowed).toBe(false)
    expect(ip2Result.allowed).toBe(true)
  })
})
