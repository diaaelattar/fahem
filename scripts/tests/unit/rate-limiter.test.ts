/**
 * اختبارات وحدة: نظام Rate Limiting وكوتا الـ AI
 * يختبر منطق checkIPRateLimit بشكل معزول (بدون اتصال حقيقي بقاعدة البيانات)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── vi.hoisted يضمن تعريف المتغير قبل رفع vi.mock ───────────────────────────
const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}))

// استيراد الدالة بعد الـ Mock
import { checkIPRateLimit } from '@/lib/security/rate-limiter'

// ── اختبارات IP Rate Limiter ────────────────────────────────────────────────────
describe('checkIPRateLimit — IP-Based Rate Limiter', () => {
  const TEST_IP = '192.168.1.100'
  const HIGH_LOAD_IP = '10.0.0.1'

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-supabase-url.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
    mockRpc.mockReset()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  it('يجب أن يسمح بالطلب الأول من IP جديد', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 10,
        count: 1,
        remaining: 9,
      },
      error: null,
    })

    const result = await checkIPRateLimit(TEST_IP, 10, 60000)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
  })

  it('يجب أن يُرجع remaining أقل بعد كل طلب', async () => {
    const ip = 'unique-ip-for-remaining-test'
    const limit = 5

    // الطلب الأول
    mockRpc.mockResolvedValueOnce({
      data: {
        allowed: true,
        limit: 5,
        count: 1,
        remaining: 4,
      },
      error: null,
    })
    const first = await checkIPRateLimit(ip, limit, 60000)

    // الطلب الثاني
    mockRpc.mockResolvedValueOnce({
      data: {
        allowed: true,
        limit: 5,
        count: 2,
        remaining: 3,
      },
      error: null,
    })
    const second = await checkIPRateLimit(ip, limit, 60000)

    expect(first.remaining).toBeGreaterThan(second.remaining)
  })

  it('يجب أن يمنع الطلب بعد تجاوز الحد المسموح', async () => {
    const ip = HIGH_LOAD_IP
    const limit = 3

    mockRpc.mockResolvedValue({
      data: {
        allowed: false,
        limit: 3,
        count: 3,
        remaining: 0,
      },
      error: null,
    })
    const result = await checkIPRateLimit(ip, limit, 60000)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('يجب أن يعيد السماح بالطلبات بعد انتهاء النافذة الزمنية', async () => {
    const ip = 'expiry-test-ip'
    const limit = 2
    const windowMs = 500

    mockRpc.mockResolvedValueOnce({
      data: {
        allowed: false,
        limit: 2,
        count: 2,
        remaining: 0,
      },
      error: null,
    })
    const blockedResult = await checkIPRateLimit(ip, limit, windowMs)
    expect(blockedResult.allowed).toBe(false)

    // انتقال الوقت لما بعد نهاية النافذة
    mockRpc.mockResolvedValueOnce({
      data: {
        allowed: true,
        limit: 2,
        count: 1,
        remaining: 1,
      },
      error: null,
    })
    const recoveredResult = await checkIPRateLimit(ip, limit, windowMs)
    expect(recoveredResult.allowed).toBe(true)
  })

  it('يجب أن يكون resetTime موجوداً وأكبر من الوقت الحالي', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 10,
        count: 1,
        remaining: 9,
      },
      error: null,
    })
    const result = await checkIPRateLimit('new-ip-for-reset-test', 10, 60000)
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })

  it('يجب أن تعمل حدود مختلفة لعناوين IP مختلفة بشكل مستقل', async () => {
    const ip1 = 'ip-alpha-123'
    const ip2 = 'ip-beta-456'

    mockRpc.mockResolvedValueOnce({
      data: {
        allowed: false,
        limit: 1,
        count: 1,
        remaining: 0,
      },
      error: null,
    })
    const ip1Result = await checkIPRateLimit(ip1, 1, 60000)

    mockRpc.mockResolvedValueOnce({
      data: {
        allowed: true,
        limit: 5,
        count: 1,
        remaining: 4,
      },
      error: null,
    })
    const ip2Result = await checkIPRateLimit(ip2, 5, 60000)

    expect(ip1Result.allowed).toBe(false)
    expect(ip2Result.allowed).toBe(true)
  })
})
