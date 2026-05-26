'use client'

import { useState } from 'react'
import {
  Users,
  PlusCircle,
  Copy,
  CheckCheck,
  Edit2,
  MoreVertical,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Group {
  id: string
  name_ar: string
  invite_code: string
  is_active: boolean
  group_students: { count: number }[]
  grades: { name_ar: string } | null
}

export function GroupsClient({ groups }: { groups: Group[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyCode = async (code: string, groupId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(groupId)
      toast.success(`تم نسخ الكود: ${code}`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('فشل النسخ — يرجى نسخ الكود يدوياً')
    }
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-white p-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
          <Users className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-800">
          لا يوجد لديك أي مجموعات
        </h3>
        <p className="mx-auto mb-6 max-w-md text-slate-500">
          قم بإنشاء مجموعة دراسية جديدة (مثل: سنتر المستقبل - الصف الثالث)
          لتتمكن من إضافة طلابك وإرسال الاختبارات لهم.
        </p>
        <Link
          href="/teacher/groups/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700"
        >
          <PlusCircle className="h-5 w-5" />
          أنشئ مجموعتك الأولى
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const studentCount = group.group_students[0]?.count || 0
        const isCopied = copiedId === group.id

        return (
          <div
            key={group.id}
            className="group/card flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:shadow-md"
          >
            {/* Header */}
            <div className="border-b border-border bg-slate-50/50 p-5">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-lg font-bold leading-tight text-slate-800">
                  {group.name_ar}
                </h3>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                  <Link
                    href={`/teacher/groups/${group.id}/edit`}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    title="تعديل المجموعة"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {group.grades?.name_ar || 'كل المراحل'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {group.is_active ? 'نشطة' : 'موقوفة'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-4 p-5">
              {/* Student Count */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      عدد الطلاب
                    </p>
                    <p className="text-lg font-black text-slate-800">
                      {studentCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invite Code */}
              <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  كود الدعوة
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black tracking-[0.25em] text-indigo-700">
                    {group.invite_code}
                  </span>
                  <button
                    onClick={() => copyCode(group.invite_code, group.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                    title="نسخ الكود"
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5" /> تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> نسخ
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-border bg-slate-50 p-4">
              <Link
                href={`/teacher/groups/${group.id}`}
                className="block py-1 text-center text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600"
              >
                إدارة الطلاب والنتائج ←
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
