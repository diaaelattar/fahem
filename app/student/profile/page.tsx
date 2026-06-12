'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2,
  Save,
  Lock,
  User,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { toast } from 'sonner'

export default function StudentProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [grades, setGrades] = useState<{ id: number; name_ar: string }[]>([])
  const [fullName, setFullName] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingGrade, setSavingGrade] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [loading, setLoading] = useState(true)

  // GDPR Deletion request state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [requestingDelete, setRequestingDelete] = useState(false)
  const deleteModalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(deleteModalRef, showDeleteModal, () => setShowDeleteModal(false))

  const handleDeleteRequest = async () => {
    if (deleteConfirmText !== 'حذف حسابي') {
      toast.error('يرجى كتابة العبارة الصحيحة للتأكيد')
      return
    }
    setRequestingDelete(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const { error } = await supabase.from('data_deletion_requests').insert({
        user_id: user.id,
        status: 'pending',
        user_role: 'student',
        user_email: user.email,
      })

      if (error) throw error

      toast.success('تم تقديم طلب حذف الحساب والبيانات بنجاح. سنقوم بمراجعة طلبك وإتمامه خلال 7 أيام عمل.')
      setShowDeleteModal(false)
      setDeleteConfirmText('')
    } catch (err: any) {
      toast.error(`حدث خطأ: ${err.message}`)
    } finally {
      setRequestingDelete(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: s }, { data: g }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('students')
          .select('*, grades(name_ar)')
          .eq('id', user.id)
          .single(),
        supabase.from('grades').select('id, name_ar').order('grade_number'),
      ])
      setProfile(p)
      setStudent(s)
      setGrades(g || [])
      setFullName(p?.full_name || '')
      setSelectedGrade(s?.grade_id || null)
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      toast.error('الاسم مطلوب')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id)
    setSaving(false)
    error
      ? toast.error(`خطأ: ${error.message}`)
      : toast.success('تم تحديث الاسم بنجاح!')
  }

  const handleSaveGrade = async () => {
    if (!selectedGrade) {
      toast.error('يرجى اختيار الصف الدراسي')
      return
    }
    setSavingGrade(true)
    const { error } = await supabase
      .from('students')
      .update({ grade_id: selectedGrade })
      .eq('id', profile.id)
    setSavingGrade(false)
    if (error) {
      toast.error(`خطأ: ${error.message}`)
    } else {
      toast.success('تم تغيير الصف الدراسي بنجاح!')
      setStudent((prev: any) => ({ ...prev, grade_id: selectedGrade }))
    }
  }

  const handleChangePwd = async () => {
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    setChangingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPwd(false)
    if (error) toast.error(`خطأ: ${error.message}`)
    else {
      toast.success('تم تغيير كلمة المرور بنجاح!')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

  const currentGradeName =
    grades.find((g) => g.id === student?.grade_id)?.name_ar || 'غير محدد'

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">ملفي الشخصي</h1>
        <p className="mt-1 text-muted-foreground">إدارة بياناتك الشخصية</p>
      </div>

      {/* Info card */}
      {student && (
        <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50 p-5">
          <img
            src={
              profile?.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name}&backgroundColor=1B4F72&textColor=ffffff`
            }
            alt={profile?.full_name}
            className="h-16 w-16 shrink-0 rounded-2xl border-2 border-primary/20 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold">{profile?.full_name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {profile?.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                {currentGradeName}
              </span>
              {student.class_section && (
                <span className="rounded-full bg-muted px-2 py-0.5">
                  فصل {student.class_section}
                </span>
              )}
              {student.student_code && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono">
                  {student.student_code}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit name */}
      <div className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <User className="h-4 w-4 text-primary" />
          تعديل الاسم
        </h2>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="الاسم الكامل"
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleSaveName}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ الاسم
        </button>
      </div>

      {/* Change Grade */}
      <div className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <GraduationCap className="h-4 w-4 text-primary" />
          تغيير الصف الدراسي
        </h2>
        <p className="text-xs text-muted-foreground">
          الصف الحالي: <strong>{currentGradeName}</strong>
        </p>
        <div className="grid grid-cols-1 gap-2">
          {grades.map((grade) => (
            <button
              key={grade.id}
              onClick={() => setSelectedGrade(grade.id)}
              aria-pressed={selectedGrade === grade.id ? 'true' : 'false'}
              className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-right text-sm font-medium transition-all ${
                selectedGrade === grade.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <span>{grade.name_ar}</span>
              {selectedGrade === grade.id ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-border" />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={handleSaveGrade}
          disabled={savingGrade || selectedGrade === student?.grade_id}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {savingGrade ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GraduationCap className="h-4 w-4" />
          )}
          {selectedGrade === student?.grade_id
            ? 'هذا هو صفك الحالي'
            : 'تغيير الصف'}
        </button>
      </div>

      {/* Change password */}
      <div className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Lock className="h-4 w-4 text-primary" />
          تغيير كلمة المرور
        </h2>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="كلمة المرور الجديدة"
          dir="ltr"
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="تأكيد كلمة المرور"
          dir="ltr"
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleChangePwd}
          disabled={changingPwd || !newPassword}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          {changingPwd ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          تغيير كلمة المرور
        </button>
      </div>

      {/* Danger Zone (GDPR Data Erasure) */}
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50/30 p-6">
        <h2 className="flex items-center gap-2 font-bold text-red-700">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          منطقة الخطر (حذف الحساب والبيانات الشخصية)
        </h2>
        <p className="text-sm text-red-600">
          وفقاً للحق في مسح البيانات (حق النسيان) بموجب اللائحة العامة لحماية البيانات (GDPR)، يمكنك طلب حذف حسابك وكافة بياناتك الشخصية المخزنة لدينا بشكل نهائي.
        </p>
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            سيؤدي هذا الإجراء إلى جدولة حذف كافة سجلاتك الأكاديمية، والامتحانات المؤداة، والبيانات الشخصية خلال 7 أيام عمل. هذا الإجراء نهائي ولا يمكن التراجع عنه.
          </p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <Trash2 className="h-4 w-4" />
          طلب حذف الحساب والبيانات
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            ref={deleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-desc"
            className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2 text-right">
                <h3
                  id="delete-modal-title"
                  className="font-display text-lg font-bold text-gray-900"
                >
                  تأكيد طلب حذف الحساب
                </h3>
                <p
                  id="delete-modal-desc"
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  هذا الإجراء سيقوم بتقديم طلب رسمي لحذف حسابك وكامل بياناتك الشخصية من المنصة نهائياً وفقاً للائحة العامة لحماية البيانات (GDPR). بمجرد إتمام الطلب، لن تتمكن من استعادة بياناتك.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground text-center">
                  لتأكيد الطلب، يرجى كتابة العبارة التالية في الحقل أدناه:
                  <br />
                  <strong className="text-gray-900 text-sm select-all">حذف حسابي</strong>
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="اكتب العبارة هنا للتأكيد"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteRequest}
                  disabled={requestingDelete || deleteConfirmText !== 'حذف حسابي'}
                  className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {requestingDelete ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  تأكيد الحذف النهائي
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={requestingDelete}
                  className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
