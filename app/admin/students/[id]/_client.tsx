'use client'

// app/admin/students/[id]/_client.tsx
// Client Component لنموذج تعديل بيانات الطالب

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  User,
  GraduationCap,
  Phone,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Save,
} from 'lucide-react'

interface Props {
  student: {
    id: string
    grade_id: number
    class_section: string | null
    parent_phone: string | null
    student_code: string | null
    enrollment_date: string | null
    profiles: {
      full_name: string
      email: string
      is_active: boolean
      created_at: string
    }
  }
  grades: { id: number; name_ar: string; grade_number: number }[]
  attempts: any[]
}

export default function StudentEditClient({
  student,
  grades,
  attempts,
}: Props) {
  const router = useRouter()
  const [loading, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    full_name: student.profiles.full_name,
    grade_id: String(student.grade_id),
    class_section: student.class_section || '',
    parent_phone: student.parent_phone || '',
    is_active: student.profiles.is_active,
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          ...formData,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      alert('خطأ: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const passedCount = attempts.filter((a) => a.is_passed).length
  const avgScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            attempts.length
        )
      : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 transition-colors hover:bg-muted"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">تعديل بيانات الطالب</h1>
          <p className="mt-0.5 text-muted-foreground">
            {student.profiles.email}
          </p>
        </div>

        {/* حالة الحساب */}
        <div className="mr-auto">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              formData.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {formData.is_active ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
            {formData.is_active ? 'حساب نشط' : 'حساب موقوف'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* نموذج التعديل */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-2xl border border-border bg-white p-8 shadow-sm"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-primary" /> الاسم الكامل
                </label>
                <input
                  required
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <GraduationCap className="h-4 w-4 text-primary" /> الصف
                    الدراسي
                  </label>
                  <select
                    value={formData.grade_id}
                    onChange={(e) =>
                      setFormData({ ...formData, grade_id: e.target.value })
                    }
                    className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">الفصل</label>
                  <input
                    type="text"
                    value={formData.class_section}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        class_section: e.target.value,
                      })
                    }
                    placeholder="مثال: 3/1"
                    className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-primary" /> هاتف ولي الأمر
                </label>
                <input
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_phone: e.target.value })
                  }
                  placeholder="01012345678"
                  className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                  dir="ltr"
                />
              </div>

              {/* حالة الحساب */}
              <div className="border-t border-border pt-2">
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  حالة الحساب
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, is_active: true })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                      formData.is_active
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-border text-muted-foreground hover:border-green-300'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" /> نشط
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, is_active: false })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                      !formData.is_active
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-border text-muted-foreground hover:border-red-300'
                    }`}
                  >
                    <UserX className="h-4 w-4" /> موقوف
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />{' '}
                  جاري الحفظ...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="h-5 w-5" /> تم الحفظ!
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" /> حفظ التعديلات
                </>
              )}
            </button>
          </form>
        </div>

        {/* معلومات الطالب + آخر النتائج */}
        <div className="space-y-4">
          {/* بطاقة المعلومات */}
          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-bold">معلومات الحساب</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'كود الطالب', value: student.student_code || '—' },
                {
                  label: 'تاريخ التسجيل',
                  value: student.enrollment_date
                    ? new Date(student.enrollment_date).toLocaleDateString(
                        'ar-EG'
                      )
                    : '—',
                },
                {
                  label: 'تاريخ إنشاء الحساب',
                  value: new Date(
                    student.profiles.created_at
                  ).toLocaleDateString('ar-EG'),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-xs font-medium">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* إحصائيات */}
          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-bold">الأداء الأكاديمي</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'الاختبارات', value: attempts.length, icon: '📝' },
                { label: 'ناجح', value: passedCount, icon: '✅' },
                { label: 'متوسط', value: `${avgScore}٪`, icon: '📊' },
                {
                  label: 'راسب',
                  value: attempts.length - passedCount,
                  icon: '❌',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-muted/40 p-3 text-center"
                >
                  <div className="mb-1 text-xl">{s.icon}</div>
                  <div className="text-base font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* آخر النتائج */}
          {attempts.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="border-b border-border p-4">
                <h3 className="text-sm font-bold">آخر الاختبارات</h3>
              </div>
              <div className="divide-y divide-border">
                {attempts.slice(0, 5).map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.exams?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.completed_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`text-sm font-bold ${a.is_passed ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {a.percentage?.toFixed(0)}٪
                      </span>
                      {a.is_passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
