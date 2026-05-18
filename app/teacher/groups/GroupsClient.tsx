'use client'

import { useState } from 'react'
import { Users, PlusCircle, Copy, CheckCheck, Edit2, MoreVertical } from 'lucide-react'
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
      <div className="bg-white rounded-3xl border border-dashed border-border p-12 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">لا يوجد لديك أي مجموعات</h3>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          قم بإنشاء مجموعة دراسية جديدة (مثل: سنتر المستقبل - الصف الثالث) لتتمكن من إضافة طلابك وإرسال الاختبارات لهم.
        </p>
        <Link
          href="/teacher/groups/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          <PlusCircle className="w-5 h-5" />
          أنشئ مجموعتك الأولى
        </Link>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => {
        const studentCount = group.group_students[0]?.count || 0
        const isCopied = copiedId === group.id

        return (
          <div
            key={group.id}
            className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group/card"
          >
            {/* Header */}
            <div className="p-5 border-b border-border bg-slate-50/50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800 leading-tight">{group.name_ar}</h3>
                <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <Link
                    href={`/teacher/groups/${group.id}/edit`}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="تعديل المجموعة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {group.grades?.name_ar || 'كل المراحل'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {group.is_active ? 'نشطة' : 'موقوفة'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col gap-4">
              {/* Student Count */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">عدد الطلاب</p>
                    <p className="font-black text-slate-800 text-lg">{studentCount}</p>
                  </div>
                </div>
              </div>

              {/* Invite Code */}
              <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-100 relative overflow-hidden">
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1.5 tracking-wider">كود الدعوة</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-indigo-700 tracking-[0.25em]">
                    {group.invite_code}
                  </span>
                  <button
                    onClick={() => copyCode(group.invite_code, group.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                    title="نسخ الكود"
                  >
                    {isCopied ? (
                      <><CheckCheck className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-border mt-auto">
              <Link
                href={`/teacher/groups/${group.id}`}
                className="block text-center text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors py-1"
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
