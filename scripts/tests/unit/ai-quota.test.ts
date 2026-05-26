/**
 * اختبارات وحدة: دالة checkAIQuota — كوتا الذكاء الاصطناعي اليومية
 * نختبر منطق الاستجابة (allowed/blocked) بشكل معزول عبر mock لـ Supabase RPC
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

import { checkAIQuota } from '@/lib/security/rate-limiter'


const FAKE_USER_ID = '00000000-0000-0000-0000-000000000001'
const FAKE_ROUTE = '/api/ai/explain-question'

describe('checkAIQuota — AI Quota System', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  it('يجب أن يسمح للمستخدم المجاني ضمن الحد المسموح', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 5,
        usage: 2,
        remaining: 3,
        is_premium: false,
        role: 'student',
      },
      error: null,
    })

    const result = await checkAIQuota(FAKE_USER_ID, FAKE_ROUTE)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(3)
    expect(result.isPremium).toBe(false)
    expect(result.message).toBeUndefined()
  })

  it('يجب أن يحجب المستخدم المجاني الذي تجاوز الحد ويُعيد رسالة باللغة العربية', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: false,
        limit: 5,
        usage: 5,
        remaining: 0,
        is_premium: false,
        role: 'student',
      },
      error: null,
    })

    const result = await checkAIQuota(FAKE_USER_ID, FAKE_ROUTE)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.message).toBeDefined()
    expect(result.message).toContain('5') // يذكر الحد في الرسالة
    expect(result.message).toMatch(/[\u0600-\u06FF]/) // تحتوي على نص عربي
  })

  it('يجب أن يسمح للمستخدم المميز (VIP) بحد أعلى', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 100,
        usage: 50,
        remaining: 50,
        is_premium: true,
        role: 'student',
      },
      error: null,
    })

    const result = await checkAIQuota(FAKE_USER_ID, FAKE_ROUTE)

    expect(result.allowed).toBe(true)
    expect(result.isPremium).toBe(true)
    expect(result.limit).toBe(100)
  })

  it('يجب أن يسمح للمعلم بحد 100 عملية يومياً', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 100,
        usage: 10,
        remaining: 90,
        is_premium: false,
        role: 'teacher',
      },
      error: null,
    })

    const result = await checkAIQuota(FAKE_USER_ID, '/api/ai/generate-exercises')

    expect(result.allowed).toBe(true)
    expect(result.role).toBe('teacher')
    expect(result.limit).toBe(100)
  })

  it('يجب أن يُعيد fallback (allowed=true) في حالة خطأ قاعدة البيانات لمنع تعطيل الخدمة', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'connection timeout', code: 'PGRST000' },
    })

    const result = await checkAIQuota(FAKE_USER_ID, FAKE_ROUTE)

    // في حالة خطأ النظام، نسمح بالعملية كـ fallback
    expect(result.allowed).toBe(true)
    expect(result.limit).toBeGreaterThan(0)
  })

  it('يجب أن يتعامل مع الاستثناءات غير المتوقعة بسلاسة', async () => {
    mockRpc.mockRejectedValue(new Error('Network failure'))

    const result = await checkAIQuota(FAKE_USER_ID, FAKE_ROUTE)

    // حتى مع استثناء غير متوقع، يجب إرجاع fallback آمن
    expect(result.allowed).toBe(true)
  })

  it('يجب أن تُرسَل المعاملات الصحيحة إلى دالة RPC', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 5,
        usage: 1,
        remaining: 4,
        is_premium: false,
        role: 'student',
      },
      error: null,
    })

    await checkAIQuota(FAKE_USER_ID, FAKE_ROUTE)

    expect(mockRpc).toHaveBeenCalledWith('check_and_log_ai_usage', {
      p_user_id: FAKE_USER_ID,
      p_api_route: FAKE_ROUTE,
    })
  })
})
