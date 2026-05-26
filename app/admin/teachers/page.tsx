'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap,
  Search,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Mail,
} from 'lucide-react'
import Link from 'next/link'

interface Teacher {
  id: string
  subject_id: number | null
  is_verified: boolean
  is_active: boolean
  created_at: string
  groups_count?: number
  exams_count?: number
  profiles: {
    full_name: string
    email: string
    avatar_url: string | null
  } | null
  subjects: { name_ar: string; icon: string } | null
}

export default function AdminTeachersPage() {
  const supabase = createClient()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<
    { id: number; name_ar: string; icon: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      const [teachersRes, subjectsRes] = await Promise.all([
        supabase
          .from('teachers')
          .select(
            'id, subject_id, is_verified, created_at, profiles(full_name, email, avatar_url, is_active), subjects!teachers_subject_id_fkey(name_ar, icon)'
          )
          .order('created_at', { ascending: false }),
        supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
      ])
      const raw = (teachersRes.data || []) as any[]
      const enriched = await Promise.all(
        raw.map(async (t) => {
          const [g, e] = await Promise.all([
            supabase
              .from('student_groups')
              .select('id', { count: 'exact', head: true })
              .eq('teacher_id', t.id),
            supabase
              .from('exams')
              .select('id', { count: 'exact', head: true })
              .eq('teacher_id', t.id),
          ])
          return {
            ...t,
            is_active: t.profiles?.is_active ?? true,
            groups_count: g.count || 0,
            exams_count: e.count || 0,
          }
        })
      )
      setTeachers(enriched)
      setSubjects(subjectsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(
    () =>
      teachers.filter((t) => {
        const name = t.profiles?.full_name?.toLowerCase() || ''
        const email = t.profiles?.email?.toLowerCase() || ''
        const q = search.toLowerCase()
        if (q && !name.includes(q) && !email.includes(q)) return false
        if (subjectFilter && String(t.subject_id) !== subjectFilter)
          return false
        if (statusFilter === 'verified' && !t.is_verified) return false
        if (statusFilter === 'unverified' && t.is_verified) return false
        if (statusFilter === 'active' && !t.is_active) return false
        if (statusFilter === 'inactive' && t.is_active) return false
        return true
      }),
    [teachers, search, subjectFilter, statusFilter]
  )

  const toggleVerified = async (id: string, cur: boolean) => {
    await supabase.from('teachers').update({ is_verified: !cur }).eq('id', id)
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_verified: !cur } : t))
    )
  }
  const toggleActive = async (id: string, cur: boolean) => {
    await supabase.from('profiles').update({ is_active: !cur }).eq('id', id)
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_active: !cur } : t))
    )
  }

  const stats = [
    {
      label: 'إجمالي المعلمين',
      value: teachers.length,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'موثّق',
      value: teachers.filter((t) => t.is_verified).length,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'نشط',
      value: teachers.filter((t) => t.is_active).length,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'مجموعات',
      value: teachers.reduce((s, t) => s + (t.groups_count || 0), 0),
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            إدارة المعلمين
          </h1>
          <p className="mt-1 text-muted-foreground">
            {loading ? '...' : `${filtered.length} معلم`}
            {!loading &&
              filtered.length !== teachers.length &&
              ` (من أصل ${teachers.length})`}
          </p>
        </div>
        <Link
          href="/admin/teachers/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> إضافة معلم
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.color} border-current/10 rounded-2xl border p-4 text-center shadow-sm`}
          >
            <p className="text-2xl font-black">{loading ? '...' : s.value}</p>
            <p className="mt-0.5 text-xs font-medium opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">كل المواد</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name_ar}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">كل الحالات</option>
          <option value="verified">موثّق</option>
          <option value="unverified">غير موثّق</option>
          <option value="active">نشط</option>
          <option value="inactive">موقوف</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-border bg-slate-50">
              <tr>
                {[
                  'المعلم',
                  'المادة',
                  'المجموعات',
                  'الاختبارات',
                  'التوثيق',
                  'الحالة',
                  'إجراءات',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          t.profiles?.avatar_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${t.profiles?.full_name || 'T'}`
                        }
                        className="h-10 w-10 rounded-xl border border-slate-100 object-cover"
                        alt=""
                      />
                      <div>
                        <p className="text-sm font-bold">
                          {t.profiles?.full_name || 'معلم'}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span dir="ltr">{t.profiles?.email}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(t.created_at).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {(t.subjects as any)?.icon}{' '}
                    {(t.subjects as any)?.name_ar || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-black text-blue-700">
                      {t.groups_count}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-black text-indigo-700">
                      {t.exams_count}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleVerified(t.id, t.is_verified)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${t.is_verified ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                    >
                      {t.is_verified ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          موثّق
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          بانتظار
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleActive(t.id, t.is_active)}
                      className={`relative h-5 w-10 rounded-full transition-colors ${t.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${t.is_active ? 'translate-x-5' : 'translate-x-0.5'}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/teachers/${t.id}`}
                      className="flex w-fit items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      التفاصيل
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-16 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-bold">
            {search || subjectFilter || statusFilter
              ? 'لا توجد نتائج'
              : 'لا يوجد معلمون بعد'}
          </h3>
          {!search && !subjectFilter && !statusFilter && (
            <Link
              href="/admin/teachers/new"
              className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              إضافة أول معلم
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
