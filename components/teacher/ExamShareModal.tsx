'use client'
// components/teacher/ExamShareModal.tsx
// Modal مشاركة الاختبار — يُفتح من كارت الاختبار

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Link2,
  Copy,
  Check,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Share2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'

interface ShareToken {
  id: string
  token: string
  is_active: boolean
  expires_at: string | null
  created_at: string
}

interface Props {
  examId: string
  examTitle: string
  onClose: () => void
}

export function ExamShareModal({ examId, examTitle, onClose }: Props) {
  const [token, setToken] = useState<ShareToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareUrl = token?.is_active
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/exam/${token.token}`
    : null

  // جلب التوكن الحالي
  const fetchToken = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teacher/exams/${examId}/share`)
      const data = await res.json()
      setToken(data.token || null)
    } catch {
      setError('فشل تحميل بيانات المشاركة')
    } finally {
      setLoading(false)
    }
  }, [examId])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // إنشاء توكن جديد
  const createToken = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teacher/exams/${examId}/share`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToken(data.token)
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الرابط')
    } finally {
      setActionLoading(false)
    }
  }

  // تعديل التوكن (تفعيل/تعطيل/تجديد)
  const modifyToken = async (action: 'enable' | 'disable' | 'renew') => {
    if (!token) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teacher/exams/${examId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tokenId: token.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToken(data.token)
    } catch (err: any) {
      setError(err.message || 'فشل تعديل الرابط')
    } finally {
      setActionLoading(false)
    }
  }

  // نسخ الرابط
  const copyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // إغلاق عند الضغط على الخلفية
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-3xl bg-white shadow-2xl duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={`مشاركة اختبار: ${examTitle}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-emerald-50 to-teal-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-800">مشاركة الاختبار</h2>
              <p className="text-xs text-slate-500">{examTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* خطأ */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* تحميل */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">جاري التحميل...</p>
            </div>
          ) : !token ? (
            /* لا يوجد توكن بعد */
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
                <Link2 className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="mb-1 font-bold text-slate-800">لا يوجد رابط مشاركة</h3>
                <p className="text-sm text-slate-500">
                  أنشئ رابطاً لمشاركة هذا الاختبار مع الطلاب بدون الحاجة لحساب
                </p>
              </div>
              <button
                onClick={createToken}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-70"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                إنشاء رابط المشاركة
              </button>
            </div>
          ) : (
            /* يوجد توكن */
            <div className="space-y-4">
              {/* حالة الرابط */}
              <div
                className={`flex items-center gap-3 rounded-2xl p-4 ${
                  token.is_active
                    ? 'bg-emerald-50 border border-emerald-100'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <div
                  className={`h-3 w-3 rounded-full ${
                    token.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    token.is_active ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  {token.is_active ? 'الرابط نشط — الطلاب يمكنهم الدخول' : 'الرابط معطل'}
                </span>
              </div>

              {/* الرابط */}
              {token.is_active && shareUrl && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">رابط المشاركة</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <code className="flex-1 truncate text-sm text-slate-700 font-mono" dir="ltr">
                      {shareUrl}
                    </code>
                    <button
                      onClick={copyLink}
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        copied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {copied ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> تم النسخ!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="h-3 w-3" /> نسخ
                        </span>
                      )}
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="فتح الرابط"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* أزرار التحكم */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {/* تفعيل/تعطيل */}
                <button
                  onClick={() => modifyToken(token.is_active ? 'disable' : 'enable')}
                  disabled={actionLoading}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all disabled:opacity-50 ${
                    token.is_active
                      ? 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : token.is_active ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                  {token.is_active ? 'تعطيل' : 'تفعيل'}
                </button>

                {/* تجديد الرابط */}
                <button
                  onClick={() => modifyToken('renew')}
                  disabled={actionLoading}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-600 transition-all hover:bg-amber-100 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                  تجديد
                </button>

                {/* نسخ الرابط — للموبايل */}
                {token.is_active && shareUrl && (
                  <button
                    onClick={copyLink}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                    {copied ? 'تم!' : 'نسخ'}
                  </button>
                )}
              </div>

              {/* تحذير تجديد الرابط */}
              <p className="text-center text-xs text-slate-400">
                ⚠️ تجديد الرابط يلغي الرابط القديم ويُنشئ رابطاً جديداً
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-center text-xs text-slate-500">
            🔒 الطلاب يمكنهم حل الاختبار بدون تسجيل الدخول — اسمهم فقط
          </p>
        </div>
      </div>
    </div>
  )
}
