'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2, School, LogIn, UserPlus } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { acceptSchoolInvitationAction } from '../actions'

export default function SchoolInvitationPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const token = params.token

  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [school, setSchool] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function checkInvitation() {
      try {
        setLoading(true)
        setError('')

        // 1. جلب بيانات الدعوة والمدرسة المرتبطة بها
        const { data: inviteData, error: inviteErr } = await supabase
          .from('school_invitations')
          .select('*, schools(*)')
          .eq('token', token)
          .maybeSingle()

        if (inviteErr || !inviteData) {
          setError('رابط الدعوة هذا غير صالح أو قد تم إتلافه.')
          return
        }

        // 2. التحقق من صلاحية تاريخ الدعوة
        const isExpired = new Date(inviteData.expires_at) < new Date()
        if (isExpired) {
          setError('انتهت صلاحية هذا الرابط. يرجى طلب دعوة جديدة من إدارة المدرسة.')
          return
        }

        // 3. التحقق مما إذا كانت الدعوة مستخدمة بالفعل
        if (inviteData.used_at) {
          setError('تم استخدام رابط الدعوة هذا مسبقاً.')
          return
        }

        setInvite(inviteData)
        setSchool(inviteData.schools)

        // 4. التحقق من حالة تسجيل الدخول الحالية للمستخدم
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
      } catch (err) {
        setError('حدث خطأ غير متوقع أثناء التحقق من الدعوة.')
      } finally {
        setLoading(false)
      }
    }

    checkInvitation()
  }, [token, supabase])

  const handleAcceptInvite = async () => {
    if (!currentUser || !invite) return
    
    setVerifying(true)
    setError('')
    try {
      // استخدام Server Action آمنة لقبول الدعوة
      // تعمل على السيرفر عبر service_role لتجاوز قيود RLS
      const result = await acceptSchoolInvitationAction(token)

      if (!result.success) {
        throw new Error(result.error)
      }

      setSuccess(true)
      
      // إعادة التوجيه التلقائية بعد 3 ثوانٍ
      setTimeout(() => {
        router.push(result.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
      }, 3000)

    } catch (err: unknown) {
      setError((err as Error).message || 'حدث خطأ أثناء قبول الدعوة. حاول مجدداً.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div
      className="bg-slate-950 text-slate-100 flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Logo variant="vertical" size="lg" light />
        </div>

        <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
              <p className="text-sm text-slate-400">جاري التحقق من رمز الدعوة...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 space-y-5">
              <XCircle className="h-14 w-14 text-red-500 mx-auto" />
              <h2 className="text-lg font-bold text-white">عذراً، لا يمكن المتابعة</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  العودة للرئيسية
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-5">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">تهانينا! تم الانضمام بنجاح</h2>
              <p className="text-sm text-slate-400">
                لقد انضممت بنجاح إلى **{school?.name}** كـ {invite?.role === 'teacher' ? 'معلم' : 'طالب'}.
              </p>
              <p className="text-xs text-cyan-400 animate-pulse">جاري تحويلك إلى لوحة التحكم الخاصة بك...</p>
            </div>
          ) : (
            <div className="text-center py-4 space-y-6">
              <div className="h-16 w-16 bg-cyan-950/50 border border-cyan-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <School className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white">دعوة للانضمام للمدرسة</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                لقد تمت دعوتك للانضمام إلى **{school?.name}** كـ <span className="font-bold text-cyan-400">{invite?.role === 'teacher' ? 'معلم' : 'طالب'}</span>.
              </p>

              {currentUser ? (
                <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-right space-y-2">
                  <span className="text-xs text-slate-500">حسابك الحالي النشط:</span>
                  <div className="text-sm font-bold text-slate-200">{currentUser.email}</div>
                  <p className="text-xs text-slate-400">سيتم ربط هذا الحساب بالمدرسة وتعديل دوره.</p>
                </div>
              ) : (
                <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 text-center space-y-4">
                  <p className="text-xs text-slate-400">يرجى تسجيل الدخول أو إنشاء حساب جديد أولاً لقبول الدعوة.</p>
                  <div className="flex gap-3">
                    <Link
                      href={`/auth/login?invite_token=${token}`}
                      className="flex-1 flex items-center justify-center gap-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      تسجيل الدخول
                    </Link>
                    <Link
                      href={`/auth/register?invite_token=${token}`}
                      className="flex-1 flex items-center justify-center gap-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      إنشاء حساب
                    </Link>
                  </div>
                </div>
              )}

              {currentUser && (
                <button
                  onClick={handleAcceptInvite}
                  disabled={verifying}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-60"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                      جاري قبول الدعوة...
                    </>
                  ) : (
                    'قبول الدعوة والانضمام'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
