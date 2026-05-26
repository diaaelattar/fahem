'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Loader2,
  Crown,
  GraduationCap,
} from 'lucide-react'
import Link from 'next/link'
import { PremiumToggle } from '@/components/admin/PremiumToggle'

interface Student {
  id: string
  class_section: string | null
  student_code: string | null
  xp_points: number
  level: number
  profiles: {
    id: string
    full_name: string
    email: string
    is_active: boolean
    is_premium: boolean
    avatar_url: string | null
  } | null
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
        supabase
          .from('students')
          .select(
            `
          id, class_section, student_code, xp_points, level, grade_id,
          profiles(id, full_name, email, is_active, is_premium, avatar_url),
          grades(name_ar)
        `
          )
          .order('xp_points', { ascending: false }),
        supabase.from('grades').select('id, name_ar').order('grade_number'),
      ])
      setStudents((studentsRes.data as any) || [])
      setGrades(gradesRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const name = s.profiles?.full_name?.toLowerCase() || ''
      const code = s.student_code?.toLowerCase() || ''
      const email = s.profiles?.email?.toLowerCase() || ''
      const q = search.toLowerCase()
      if (q && !name.includes(q) && !code.includes(q) && !email.includes(q))
        return false
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
          <h1 className="font-display text-3xl font-bold">إدارة الطلاب</h1>
          <p className="mt-1 text-muted-foreground">
            {loading ? '...' : `${filtered.length} طالب`}
            {!loading &&
              filtered.length !== students.length &&
              ` (من أصل ${students.length})`}
          </p>
        </div>
        <Link
          href="/admin/students/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          إضافة طالب
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو البريد..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">كل الصفوف</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name_ar}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-border bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                  الطالب
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                  الصف
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                  المستوى
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                  XP
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                  الحالة
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          student.profiles?.avatar_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${student.profiles?.full_name || 'U'}`
                        }
                        alt={student.profiles?.full_name}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">
                            {student.profiles?.full_name}
                          </p>
                          {student.profiles?.is_premium && (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {student.profiles?.email}
                        </p>
                        {student.student_code && (
                          <p className="font-mono text-[10px] text-muted-foreground/70">
                            {student.student_code}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {student.grades?.name_ar || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                        LVL {student.level || 1}
                      </span>
                      {student.profiles?.id && (
                        <PremiumToggle
                          profileId={student.profiles.id}
                          initialIsPremium={
                            student.profiles.is_premium || false
                          }
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">
                    {(student.xp_points || 0).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-5 py-4">
                    {student.profiles?.is_active ? (
                      <span className="flex w-fit items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs text-green-600">
                        <UserCheck className="h-3 w-3" /> نشط
                      </span>
                    ) : (
                      <span className="flex w-fit items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-600">
                        <UserX className="h-3 w-3" /> موقوف
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        تعديل
                      </Link>
                      <Link
                        href={`/admin/reports?student=${student.id}`}
                        className="text-xs text-muted-foreground underline decoration-dotted transition-colors hover:text-primary"
                      >
                        النتائج
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-16 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-bold">
            {search || gradeFilter || statusFilter
              ? 'لا توجد نتائج تطابق البحث'
              : 'لا يوجد طلاب بعد'}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {search || gradeFilter || statusFilter
              ? 'جرب تغيير معايير الفلترة'
              : 'أضف طلاباً وأرسل لهم بيانات الدخول'}
          </p>
          {!search && !gradeFilter && !statusFilter && (
            <Link
              href="/admin/students/new"
              className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              إضافة أول طالب
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
