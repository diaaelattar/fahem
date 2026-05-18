'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Plus, Search, UserCheck, UserX, Loader2, Crown, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { PremiumToggle } from '@/components/admin/PremiumToggle'

interface Student {
  id: string
  class_section: string | null
  student_code: string | null
  xp_points: number
  level: number
  profiles: { id: string; full_name: string; email: string; is_active: boolean; is_premium: boolean; avatar_url: string | null } | null
  grades: { name_ar: string } | null
  grade_id: number | null
}

export default function AdminStudentsPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<{ id: number; name_ar: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      const [studentsRes, gradesRes] = await Promise.all([
        supabase.from('students').select(`
          id, class_section, student_code, xp_points, level, grade_id,
          profiles(id, full_name, email, is_active, is_premium, avatar_url),
          grades(name_ar)
        `).order('xp_points', { ascending: false }),
        supabase.from('grades').select('id, name_ar').order('grade_number'),
      ])
      setStudents((studentsRes.data as any) || [])
      setGrades(gradesRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return students.filter(s => {
      const name = s.profiles?.full_name?.toLowerCase() || ''
      const code = s.student_code?.toLowerCase() || ''
      const email = s.profiles?.email?.toLowerCase() || ''
      const q = search.toLowerCase()
      if (q && !name.includes(q) && !code.includes(q) && !email.includes(q)) return false
      if (gradeFilter && String(s.grade_id) !== gradeFilter) return false
      if (statusFilter === 'active' && !s.profiles?.is_active) return false
      if (statusFilter === 'inactive' && s.profiles?.is_active) return false
      if (statusFilter === 'premium' && !s.profiles?.is_premium) return false
      return true
    })
  }, [students, search, gradeFilter, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">إدارة الطلاب</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? '...' : `${filtered.length} طالب`}
            {!loading && filtered.length !== students.length && ` (من أصل ${students.length})`}
          </p>
        </div>
        <Link href="/admin/students/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          إضافة طالب
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو البريد..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">كل الصفوف</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">موقوف</option>
          <option value="premium">VIP فقط</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الطالب</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الصف</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">المستوى</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">XP</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الحالة</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${student.profiles?.full_name || 'U'}`}
                        alt={student.profiles?.full_name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{student.profiles?.full_name}</p>
                          {student.profiles?.is_premium && (
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{student.profiles?.email}</p>
                        {student.student_code && (
                          <p className="text-[10px] font-mono text-muted-foreground/70">{student.student_code}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {student.grades?.name_ar || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-md">
                        LVL {student.level || 1}
                      </span>
                      {student.profiles?.id && (
                        <PremiumToggle profileId={student.profiles.id} initialIsPremium={student.profiles.is_premium || false} />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">
                    {(student.xp_points || 0).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-5 py-4">
                    {student.profiles?.is_active
                      ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit"><UserCheck className="w-3 h-3" /> نشط</span>
                      : <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit"><UserX className="w-3 h-3" /> موقوف</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/students/${student.id}`} className="text-xs text-primary hover:underline font-bold">تعديل</Link>
                      <Link href={`/admin/reports?student=${student.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors underline decoration-dotted">النتائج</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">
            {search || gradeFilter || statusFilter ? 'لا توجد نتائج تطابق البحث' : 'لا يوجد طلاب بعد'}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {search || gradeFilter || statusFilter ? 'جرب تغيير معايير الفلترة' : 'أضف طلاباً وأرسل لهم بيانات الدخول'}
          </p>
          {!search && !gradeFilter && !statusFilter && (
            <Link href="/admin/students/new" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 inline-block">
              إضافة أول طالب
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
