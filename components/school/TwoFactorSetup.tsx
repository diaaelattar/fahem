'use client'

/**
 * صفحة إعداد المصادقة الثنائية (2FA/TOTP)
 * NIST 800-63B — Multi-Factor Authentication
 * يستخدم Supabase Auth MFA API
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Trash2,
} from 'lucide-react'

type Factor = {
  id: string
  factor_type: string
  status: string
  friendly_name?: string
  created_at: string
}

export function TwoFactorSetup() {
  const supabase = createClient()
  const [factors, setFactors] = useState<Factor[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // حالة التسجيل
  const [enrollData, setEnrollData] = useState<{
    qrCodeUrl: string
    secret: string
    factorId: string
  } | null>(null)
  const [verifyCode, setVerifyCode] = useState('')

  useEffect(() => {
    loadFactors()
  }, [])

  const loadFactors = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.auth.mfa.listFactors()
      const allFactors = [
        ...(data?.totp ?? []),
        ...(data?.phone ?? []),
      ] as unknown as Factor[]
      setFactors(allFactors)
    } catch {
      setError('فشل تحميل بيانات المصادقة.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    setError('')
    setSuccess('')
    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'تطبيق المصادقة',
      })

      if (enrollErr || !data) {
        setError('فشل إنشاء عامل المصادقة. حاول مجدداً.')
        return
      }

      setEnrollData({
        qrCodeUrl: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
      })
    } catch {
      setError('حدث خطأ غير متوقع.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollData) return
    setVerifying(true)
    setError('')
    try {
      const { data: challengeData, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId: enrollData.factorId })

      if (challengeErr || !challengeData) {
        setError('فشل إنشاء تحدي المصادقة.')
        return
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challengeData.id,
        code: verifyCode.trim(),
      })

      if (verifyErr) {
        setError('الكود غير صحيح. تحقق من التطبيق وحاول مجدداً.')
        return
      }

      setEnrollData(null)
      setVerifyCode('')
      setSuccess('✅ تم تفعيل المصادقة الثنائية بنجاح! حسابك الآن محمي بـ 2FA.')
      await loadFactors()
    } catch {
      setError('حدث خطأ أثناء التحقق.')
    } finally {
      setVerifying(false)
    }
  }

  const handleRemove = async (factorId: string) => {
    setRemoving(true)
    setError('')
    setSuccess('')
    try {
      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({
        factorId,
      })
      if (unenrollErr) {
        setError('فشل إزالة عامل المصادقة.')
        return
      }
      setSuccess('تم إزالة المصادقة الثنائية من حسابك.')
      await loadFactors()
    } catch {
      setError('حدث خطأ غير متوقع.')
    } finally {
      setRemoving(false)
    }
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified')
  const is2FAEnabled = verifiedFactors.length > 0

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس القسم */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            is2FAEnabled
              ? 'bg-emerald-950/40 border-emerald-900/30'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          {is2FAEnabled ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          ) : (
            <ShieldOff className="h-5 w-5 text-slate-500" aria-hidden="true" />
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">
            المصادقة الثنائية (2FA)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {is2FAEnabled
              ? 'حسابك محمي بطبقة أمان إضافية — NIST 800-63B'
              : 'أضف طبقة حماية إضافية لحسابك الإداري'}
          </p>
        </div>
        <span
          className={`mr-auto text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            is2FAEnabled
              ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40'
              : 'text-slate-500 bg-slate-900 border-slate-800'
          }`}
        >
          {is2FAEnabled ? 'مفعّل' : 'معطّل'}
        </span>
      </div>

      {/* رسائل */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3.5 text-sm text-red-400"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-3.5 text-sm text-emerald-400"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" aria-hidden="true" />
        </div>
      ) : (
        <>
          {/* العوامل المسجّلة */}
          {verifiedFactors.length > 0 && (
            <div className="space-y-3">
              {verifiedFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center gap-3 p-4 bg-slate-900/60 border border-emerald-900/20 rounded-2xl"
                >
                  <Smartphone className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {factor.friendly_name || 'تطبيق المصادقة'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      مُضاف بتاريخ{' '}
                      {new Date(factor.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(factor.id)}
                    disabled={removing}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-900/30 hover:border-rose-700/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="إزالة المصادقة الثنائية"
                  >
                    {removing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    إزالة
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* مرحلة عرض QR Code للتسجيل */}
          {enrollData && (
            <div className="space-y-5 p-5 bg-slate-900/60 border border-cyan-900/20 rounded-2xl">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold">
                <QrCode className="h-4 w-4" aria-hidden="true" />
                امسح الرمز بتطبيق المصادقة (Google Authenticator / Authy)
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={enrollData.qrCodeUrl}
                    alt="QR Code للمصادقة الثنائية — امسح بتطبيق Google Authenticator أو Authy"
                    className="w-40 h-40"
                  />
                </div>
              </div>

              {/* السر اليدوي */}
              <div className="text-center">
                <p className="text-[10px] text-slate-500 mb-1">
                  أو أدخل هذا السر يدوياً في التطبيق:
                </p>
                <code className="text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-lg select-all">
                  {enrollData.secret}
                </code>
              </div>

              {/* إدخال الكود للتحقق */}
              <form onSubmit={handleVerify} className="space-y-3">
                <label
                  htmlFor="totp-verify-input"
                  className="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  أدخل الكود من التطبيق للتأكيد
                </label>
                <input
                  id="totp-verify-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] text-xl font-bold bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  autoFocus
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEnrollData(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || verifyCode.length !== 6}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60"
                  >
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    {verifying ? 'جارٍ التحقق...' : 'تفعيل 2FA'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* زر تفعيل جديد */}
          {!enrollData && !is2FAEnabled && (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {enrolling ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              {enrolling ? 'جارٍ الإعداد...' : 'تفعيل المصادقة الثنائية'}
            </button>
          )}

          {/* شرح الأمان */}
          <div className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-900 pt-4">
            <strong className="text-slate-500">ما هي المصادقة الثنائية؟</strong>
            <br />
            تضيف طبقة أمان إضافية لحسابك. عند تسجيل الدخول ستحتاج إلى كلمة المرور
            + كود مؤقت من تطبيق مثل <em>Google Authenticator</em> أو{' '}
            <em>Authy</em>. يتوافق مع معيار <strong>NIST 800-63B</strong>.
          </div>
        </>
      )}
    </div>
  )
}
