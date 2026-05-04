'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export function StudentEditForm({ student, grades }: { student: any; grades: any[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState((student.profiles as any)?.full_name || '')
  const [gradeId, setGradeId] = useState(student.grade_id?.toString() || '')
  const [classSection, setClassSection] = useState(student.class_section || '')
  const [parentPhone, setParentPhone] = useState(student.parent_phone || '')
  const [notes, setNotes] = useState(student.notes || '')
  const [isActive, setIsActive] = useState((student.profiles as any)?.is_active ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error('الاسم مطلوب'); return }
    setSaving(true)
    try {
      const [profileRes, studentRes] = await Promise.all([
        supabase.from('profiles').update({ full_name: fullName.trim(), is_active: isActive }).eq('id', student.id),
        supabase.from('students').update({
          grade_id: gradeId ? parseInt(gradeId) : null,
          class_section: classSection || null,
          parent_phone: parentPhone || null,
          notes: notes || null,
        }).eq('id', student.id),
      ])

      if (profileRes.error) throw profileRes.error
      if (studentRes.error) throw studentRes.error

      toast.success('تم تحديث بيانات الطالب بنجاح!')
      router.refresh()
    } catch (err: any) {
      toast.error('خطأ في التحديث: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
      {/* Student Code Badge */}
      {student.student_code && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
          <span className="text-xs text-blue-600 font-medium">كود الطالب:</span>
          <code className="text-sm font-mono font-bold text-blue-800">{student.student_code}</code>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold block mb-1.5">الاسم الكامل *</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)}
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold block mb-1.5">الصف الدراسي</label>
          <select value={gradeId} onChange={e => setGradeId(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none">
            <option value="">غير محدد</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">الفصل</label>
          <input value={classSection} onChange={e => setClassSection(e.target.value)}
            placeholder="مثال: 3/1"
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold block mb-1.5">هاتف ولي الأمر</label>
        <input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)}
          dir="ltr"
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
      </div>

      <div>
        <label className="text-sm font-semibold block mb-1.5">ملاحظات</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none resize-none" />
      </div>

      <div className="flex items-center gap-3 py-2 border-t border-border">
        <span className="text-sm font-medium">حالة الحساب:</span>
        <button onClick={() => setIsActive(!isActive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            isActive ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'
          }`}>
          {isActive ? <><UserCheck className="w-4 h-4" /> نشط</> : <><UserX className="w-4 h-4" /> موقوف</>}
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </button>
        <button onClick={() => router.back()} className="border border-border px-5 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors">
          إلغاء
        </button>
      </div>
    </div>
  )
}
