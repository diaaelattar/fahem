'use client'

// app/admin/students/[id]/_client.tsx
// Client Component لنموذج تعديل بيانات الطالب

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, User, GraduationCap, Phone, CheckCircle, XCircle, UserCheck, UserX, Save } from 'lucide-react'

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

export default function StudentEditClient({ student, grades, attempts }: Props) {
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

  const passedCount = attempts.filter(a => a.is_passed).length
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">تعديل بيانات الطالب</h1>
          <p className="text-muted-foreground mt-0.5">{student.profiles.email}</p>
        </div>

        {/* حالة الحساب */}
        <div className="mr-auto">
          <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
            formData.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {formData.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            {formData.is_active ? 'حساب نشط' : 'حساب موقوف'}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* نموذج التعديل */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border shadow-sm p-8 space-y-6">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" /> الصف الدراسي
                  </label>
                  <select
                    value={formData.grade_id}
                    onChange={e => setFormData({ ...formData, grade_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">الفصل</label>
                  <input
                    type="text"
                    value={formData.class_section}
                    onChange={e => setFormData({ ...formData, class_section: e.target.value })}
                    placeholder="مثال: 3/1"
                    className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> هاتف ولي الأمر
                </label>
                <input
                  type="tel"
                  value={formData.parent_phone}
                  onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="01012345678"
                  className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                  dir="ltr"
                />
              </div>

              {/* حالة الحساب */}
              <div className="pt-2 border-t border-border">
                <label className="text-sm font-medium flex items-center gap-2 mb-3">حالة الحساب</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: true })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.is_active ? 'border-green-400 bg-green-50 text-green-700' : 'border-border text-muted-foreground hover:border-green-300'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" /> نشط
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: false })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      !formData.is_active ? 'border-red-400 bg-red-50 text-red-700' : 'border-border text-muted-foreground hover:border-red-300'
                    }`}
                  >
                    <UserX className="w-4 h-4" /> موقوف
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
              } disabled:opacity-50`}
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
              ) : saved ? (
                <><CheckCircle className="w-5 h-5" /> تم الحفظ!</>
              ) : (
                <><Save className="w-5 h-5" /> حفظ التعديلات</>
              )}
            </button>
          </form>
        </div>

        {/* معلومات الطالب + آخر النتائج */}
        <div className="space-y-4">
          {/* بطاقة المعلومات */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">معلومات الحساب</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'كود الطالب', value: student.student_code || '—' },
                { label: 'تاريخ التسجيل', value: student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString('ar-EG') : '—' },
                { label: 'تاريخ إنشاء الحساب', value: new Date(student.profiles.created_at).toLocaleDateString('ar-EG') },
              ].map(item => (
                <div key={item.label} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono font-medium text-xs">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* إحصائيات */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">الأداء الأكاديمي</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'الاختبارات', value: attempts.length, icon: '📝' },
                { label: 'ناجح', value: passedCount, icon: '✅' },
                { label: 'متوسط', value: `${avgScore}٪`, icon: '📊' },
                { label: 'راسب', value: attempts.length - passedCount, icon: '❌' },
              ].map(s => (
                <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="font-bold text-base">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* آخر النتائج */}
          {attempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-sm">آخر الاختبارات</h3>
              </div>
              <div className="divide-y divide-border">
                {attempts.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.exams?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.completed_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${a.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                        {a.percentage?.toFixed(0)}٪
                      </span>
                      {a.is_passed
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                      }
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
