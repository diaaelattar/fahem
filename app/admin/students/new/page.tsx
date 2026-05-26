'use client'

// app/admin/students/new/page.tsx
// إضافة طالب جديد مع توليد كلمة مرور وعرض بيانات الدخول بعد الإنشاء

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  RefreshCw,
  Copy,
  Check,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  let pass = ''
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)]
  }
  return pass
}

export default function NewStudentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [grades, setGrades] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [createdStudent, setCreatedStudent] = useState<{
    email: string
    password: string
    student_code: string
    full_name: string
  } | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
    grade_id: '',
    class_section: '',
    parent_phone: '',
  })

  useEffect(() => {
    supabase
      .from('grades')
      .select('id, name_ar, grade_number')
      .order('grade_number')
      .then(({ data }) => setGrades(data || []))
  }, [])

  const handleRegenPassword = () => {
    setFormData((prev) => ({ ...prev, password: generatePassword() }))
  }

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.grade_id) {
      alert('الرجاء اختيار الصف الدراسي')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ غير متوقع')
      }

      setCreatedStudent({
        email: formData.email,
        password: formData.password,
        student_code: data.student.student_code,
        full_name: formData.full_name,
      })
    } catch (error: any) {
      alert('خطأ: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // شاشة النجاح — عرض بيانات الدخول
  if (createdStudent) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-9 w-9 text-green-600" />
          </div>
          <h2 className="mb-1 text-2xl font-bold text-green-800">
            تم إنشاء الحساب بنجاح!
          </h2>
          <p className="mb-6 text-green-600">
            احتفظ ببيانات الدخول التالية وأرسلها للطالب
          </p>

          <div className="space-y-3 text-right">
            {[
              {
                label: 'الاسم الكامل',
                value: createdStudent.full_name,
                key: 'name',
              },
              {
                label: 'البريد الإلكتروني',
                value: createdStudent.email,
                key: 'email',
              },
              {
                label: 'كلمة المرور',
                value: createdStudent.password,
                key: 'password',
              },
              {
                label: 'كود الطالب',
                value: createdStudent.student_code,
                key: 'code',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-green-200 bg-white px-4 py-3"
              >
                <div>
                  <div className="text-xs text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold">
                    {item.value}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(item.value, item.key)}
                  className="rounded-lg p-2 transition-colors hover:bg-green-50"
                >
                  {copied === item.key ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setCreatedStudent(null)
                setFormData({
                  full_name: '',
                  email: '',
                  password: generatePassword(),
                  grade_id: '',
                  class_section: '',
                  parent_phone: '',
                })
              }}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted"
            >
              إضافة طالب آخر
            </button>
            <button
              onClick={() => router.push('/admin/students')}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary/90"
            >
              العودة للطلاب
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 transition-colors hover:bg-muted"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">إضافة طالب جديد</h1>
          <p className="mt-0.5 text-muted-foreground">
            إنشاء حساب طالب وتوليد بيانات الدخول
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border bg-white p-8 shadow-sm"
      >
        {/* البيانات الشخصية */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            البيانات الشخصية
          </h3>
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
                placeholder="مثال: أحمد محمد علي"
                className="w-full rounded-xl border border-border px-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-primary" /> البريد الإلكتروني
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="student@example.com"
                className="w-full rounded-xl border border-border px-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-primary" /> هاتف ولي الأمر
                (اختياري)
              </label>
              <input
                type="tel"
                value={formData.parent_phone}
                onChange={(e) =>
                  setFormData({ ...formData, parent_phone: e.target.value })
                }
                placeholder="01012345678"
                className="w-full rounded-xl border border-border px-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* البيانات الأكاديمية */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            البيانات الأكاديمية
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-primary" /> الصف الدراسي
              </label>
              <select
                required
                value={formData.grade_id}
                onChange={(e) =>
                  setFormData({ ...formData, grade_id: e.target.value })
                }
                className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">اختر الصف</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                الفصل الدراسي (اختياري)
              </label>
              <input
                type="text"
                value={formData.class_section}
                onChange={(e) =>
                  setFormData({ ...formData, class_section: e.target.value })
                }
                placeholder="مثال: 3/1"
                className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* كلمة المرور */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            بيانات الدخول
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-primary" /> كلمة المرور
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-xl border border-border px-4 py-2.5 pr-10 font-mono outline-none focus:ring-2 focus:ring-primary/20"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleRegenPassword}
                title="توليد كلمة مرور جديدة"
                className="rounded-xl border border-border p-2.5 transition-colors hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCopy(formData.password, 'pass')}
                title="نسخ كلمة المرور"
                className="rounded-xl border border-border p-2.5 transition-colors hover:bg-muted"
              >
                {copied === 'pass' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              يمكنك تعديل كلمة المرور أو توليد أخرى تلقائياً
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />{' '}
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" /> إنشاء حساب الطالب
            </>
          )}
        </button>
      </form>
    </div>
  )
}
