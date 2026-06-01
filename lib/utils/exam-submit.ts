// lib/utils/exam-submit.ts
// معالجة تسليم الامتحان مع حماية من انتهاء JWT
// يحفظ الإجابات في localStorage كـ fallback ويُحدّث الجلسة قبل التسليم

import { createClient } from '@/lib/supabase/client'

const ANSWERS_STORAGE_KEY = (attemptId: string) =>
  `exam_draft_answers_${attemptId}`

/**
 * يحفظ إجابات الطالب محلياً أثناء الامتحان (auto-save)
 * للحماية من فقدان البيانات عند انتهاء الجلسة
 */
export function saveAnswersDraft(
  attemptId: string,
  answers: Record<string, string>,
  imageAnswers?: Record<string, string>
): void {
  try {
    localStorage.setItem(
      ANSWERS_STORAGE_KEY(attemptId),
      JSON.stringify({
        answers,
        imageAnswers: imageAnswers || {},
        savedAt: new Date().toISOString(),
      })
    )
  } catch {
    // localStorage قد لا يكون متاحاً في بعض البيئات
    console.warn('[ExamSubmit] تعذر حفظ الإجابات محلياً')
  }
}

/**
 * استرجاع الإجابات المحفوظة محلياً
 */
export function loadAnswersDraft(attemptId: string): {
  answers: Record<string, string>
  imageAnswers: Record<string, string>
  savedAt: string
} | null {
  try {
    const raw = localStorage.getItem(ANSWERS_STORAGE_KEY(attemptId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * حذف المسودة بعد التسليم الناجح
 */
export function clearAnswersDraft(attemptId: string): void {
  try {
    localStorage.removeItem(ANSWERS_STORAGE_KEY(attemptId))
  } catch {
    // تجاهل أخطاء localStorage
  }
}

interface SubmitExamOptions {
  attemptId: string
  answers: Record<string, string>
  imageAnswers?: Record<string, string>
  onSessionExpired?: (attemptId: string) => void
}

interface SubmitExamResult {
  success: boolean
  score?: number
  total?: number
  percentage?: number
  is_passed?: boolean
  error?: string
  sessionExpired?: boolean
}

/**
 * تسليم الامتحان مع معالجة انتهاء الجلسة (JWT Expiry)
 *
 * الخطوات:
 * 1. حفظ الإجابات محلياً (safety net)
 * 2. محاولة تحديث الجلسة
 * 3. إرسال الطلب للـ API
 * 4. في حالة 401: إعادة التوجيه لتسجيل الدخول مع رابط استئناف
 */
export async function submitExamSafely(
  options: SubmitExamOptions
): Promise<SubmitExamResult> {
  const { attemptId, answers, imageAnswers, onSessionExpired } = options

  // الخطوة 1: حفظ الإجابات محلياً قبل أي شيء
  saveAnswersDraft(attemptId, answers, imageAnswers)

  const supabase = createClient()

  // الخطوة 2: محاولة تحديث الجلسة
  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    console.warn('[ExamSubmit] فشل تحديث الجلسة:', refreshError.message)
  }

  // الخطوة 3: التحقق من وجود جلسة صالحة
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // الجلسة منتهية ولا يمكن تجديدها
    if (onSessionExpired) {
      onSessionExpired(attemptId)
    } else {
      // سلوك افتراضي: توجيه لتسجيل الدخول مع رابط الاستئناف
      window.location.href = `/auth/login?redirect=/student/exams/${attemptId}/resume&reason=session_expired`
    }
    return {
      success: false,
      sessionExpired: true,
      error:
        'انتهت صلاحية الجلسة. تم حفظ إجاباتك محلياً. سجّل الدخول مجدداً لإتمام التسليم.',
    }
  }

  // الخطوة 3.5: حفظ الإجابات في قاعدة البيانات لضمان دقتها قبل التصحيح
  try {
    const { error: updateError } = await supabase
      .from('exam_attempts')
      .update({ answers })
      .eq('id', attemptId)
    if (updateError) {
      console.error('[ExamSubmit] فشل حفظ الإجابات في قاعدة البيانات:', updateError.message)
    }
  } catch (dbErr) {
    console.error('[ExamSubmit] خطأ أثناء الاتصال بقاعدة البيانات لحفظ الإجابات:', dbErr)
  }

  // الخطوة 4: إرسال الطلب للـ API
  try {
    const response = await fetch('/api/exams/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId,
        imageAnswers: imageAnswers || {},
      }),
    })

    if (response.status === 401) {
      // الـ API أعاد 401 رغم تجديد الجلسة (حالة نادرة)
      if (onSessionExpired) onSessionExpired(attemptId)
      return {
        success: false,
        sessionExpired: true,
        error:
          'انتهت صلاحية الجلسة أثناء التسليم. إجاباتك محفوظة — سجّل الدخول مجدداً.',
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `خطأ ${response.status} أثناء التسليم`,
      }
    }

    const data = await response.json()

    // نجح التسليم — احذف المسودة المحلية
    clearAnswersDraft(attemptId)

    return {
      success: true,
      score: data.score,
      total: data.total,
      percentage: data.percentage,
      is_passed: data.is_passed,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ في الشبكة'
    return {
      success: false,
      error: `فشل التسليم: ${msg}. إجاباتك محفوظة محلياً.`,
    }
  }
}
