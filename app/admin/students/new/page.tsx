'use client'

// app/admin/students/new/page.tsx
// إضافة طالب جديد مع توليد كلمة مرور وعرض بيانات الدخول بعد الإنشاء

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, User, Mail, Lock, Phone, GraduationCap, RefreshCw, Copy, Check, Save, Eye, EyeOff } from 'lucide-react'

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
  const [createdStudent, setCreatedStudent] = useState<{ email: string; password: string; student_code: string; full_name: string } | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
    grade_id: '',
    class_section: '',
    parent_phone: '',
  })

  useEffect(() => {
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number')
      .then(({ data }) => setGrades(data || []))
  }, [])

  const handleRegenPassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }))
  }

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.grade_id) { alert('الرجاء اختيار الصف الدراسي'); return }

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
      <div className="max-w-lg mx-auto">
        <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-1">تم إنشاء الحساب بنجاح!</h2>
          <p className="text-green-600 mb-6">احتفظ ببيانات الدخول التالية وأرسلها للطالب</p>

          <div className="space-y-3 text-right">
            {[
              { label: 'الاسم الكامل', value: createdStudent.full_name, key: 'name' },
              { label: 'البريد الإلكتروني', value: createdStudent.email, key: 'email' },
              { label: 'كلمة المرور', value: createdStudent.password, key: 'password' },
              { label: 'كود الطالب', value: createdStudent.student_code, key: 'code' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between bg-white rounded-xl border border-green-200 px-4 py-3">
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-mono font-bold text-sm mt-0.5">{item.value}</div>
                </div>
                <button
                  onClick={() => handleCopy(item.value, item.key)}
                  className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  {copied === item.key
                    ? <Check className="w-4 h-4 text-green-500" />
                    : <Copy className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setCreatedStudent(null)
                setFormData({ full_name: '', email: '', password: generatePassword(), grade_id: '', class_section: '', parent_phone: '' })
              }}
              className="flex-1 border border-border py-3 rounded-xl font-medium text-sm hover:bg-muted"
            >
              إضافة طالب آخر
            </button>
            <button
              onClick={() => router.push('/admin/students')}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary/90"
            >
              العودة للطلاب
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">إضافة طالب جديد</h1>
          <p className="text-muted-foreground mt-0.5">إنشاء حساب طالب وتوليد بيانات الدخول</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-sm p-8 space-y-6">

        {/* البيانات الشخصية */}
        <div>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">البيانات الشخصية</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> الاسم الكامل
              </label>
              <input
                required
                type="text"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="مثال: أحمد محمد علي"
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> البريد الإلكتروني
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> هاتف ولي الأمر (اختياري)
              </label>
              <input
                type="tel"
                value={formData.parent_phone}
                onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                placeholder="01012345678"
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* البيانات الأكاديمية */}
        <div>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">البيانات الأكاديمية</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" /> الصف الدراسي
              </label>
              <select
                required
                value={formData.grade_id}
                onChange={e => setFormData({ ...formData, grade_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">اختر الصف</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name_ar}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الفصل الدراسي (اختياري)</label>
              <input
                type="text"
                value={formData.class_section}
                onChange={e => setFormData({ ...formData, class_section: e.target.value })}
                placeholder="مثال: 3/1"
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* كلمة المرور */}
        <div>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">بيانات الدخول</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> كلمة المرور
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border outline-none font-mono focus:ring-2 focus:ring-primary/20 pr-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleRegenPassword}
                title="توليد كلمة مرور جديدة"
                className="p-2.5 border border-border rounded-xl hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCopy(formData.password, 'pass')}
                title="نسخ كلمة المرور"
                className="p-2.5 border border-border rounded-xl hover:bg-muted transition-colors"
              >
                {copied === 'pass' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">يمكنك تعديل كلمة المرور أو توليد أخرى تلقائياً</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الإنشاء...</>
          ) : (
            <><Save className="w-5 h-5" /> إنشاء حساب الطالب</>
          )}
        </button>
      </form>
    </div>
  )
}
