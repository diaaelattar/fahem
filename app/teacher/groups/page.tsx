import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { Users, PlusCircle, UserX, Copy, Edit2 } from 'lucide-react'
import Link from 'next/link'

export default async function TeacherGroupsPage() {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  // Fetch groups and their student count
  const { data: groups } = await supabase
    .from('student_groups')
    .select('*, group_students(count), grades(name_ar)')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            مجموعات الطلاب
          </h1>
          <p className="text-sm text-slate-500 mt-1">أدر مجموعاتك الخاصة وشارك أكواد الانضمام مع طلابك.</p>
        </div>
        <Link 
          href="/teacher/groups/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          مجموعة جديدة
        </Link>
      </div>

      {/* Groups List */}
      {groups && groups.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group: any) => (
            <div key={group.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden relative group/card">
              {/* Header */}
              <div className="p-5 border-b border-border bg-slate-50/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{group.name_ar}</h3>
                  <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  المرحلة: {group.grades?.name_ar || 'غير محدد'}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">عدد الطلاب</p>
                      <p className="font-black text-slate-800">{group.group_students[0]?.count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 relative overflow-hidden">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">كود الدعوة الخاص</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-black text-indigo-700 tracking-[0.2em]">{group.invite_code}</span>
                    <button className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 p-2 rounded-lg transition-colors active:scale-95" title="نسخ الكود">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-border mt-auto">
                <Link 
                  href={`/teacher/groups/${group.id}`} 
                  className="block text-center text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  إدارة الطلاب والنتائج
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  )
}
