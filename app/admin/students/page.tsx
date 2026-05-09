import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { Users, Plus, Search, UserCheck, UserX } from 'lucide-react'
import { PremiumToggle } from '@/components/admin/PremiumToggle'

export default async function AdminStudentsPage() {
  await requireAdmin()
  const supabase = createClient()

  const { data: students } = await supabase
    .from('students')
    .select(`
      id, class_section, student_code, enrollment_date, xp_points, level,
      profiles(id, full_name, email, is_active, is_premium, created_at, avatar_url),
      grades(name_ar)
    `)
    .order('xp_points', { ascending: false })

  const { data: grades } = await supabase.from('grades').select('id, name_ar').order('grade_number')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">إدارة الطلاب</h1>
          <p className="text-muted-foreground mt-1">{students?.length || 0} طالب مسجل</p>
        </div>
        <a href="/admin/students/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          إضافة طالب
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input placeholder="بحث بالاسم أو الكود..." className="flex-1 text-sm outline-none bg-transparent" />
        </div>
        <select className="bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">كل الصفوف</option>
          {(grades as any[])?.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
        </select>
      </div>

      {students && students.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
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
              {students.map((student: any) => (
                <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {student.profiles?.full_name?.[0] || '؟'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{student.grades?.name_ar || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-md">LVL {student.level || 1}</span>
                      {student.profiles?.id && (
                        <PremiumToggle profileId={student.profiles.id} initialIsPremium={student.profiles.is_premium || false} />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">{student.xp_points || 0}</td>
                  <td className="px-5 py-4">
                    {student.profiles?.is_active
                      ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit"><UserCheck className="w-3 h-3" /> نشط</span>
                      : <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit"><UserX className="w-3 h-3" /> موقوف</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <a href={`/admin/students/${student.id}`} className="text-xs text-primary hover:underline font-bold">تعديل</a>
                      <a href={`/admin/reports?student=${student.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors underline decoration-dotted">النتائج</a>
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
          <h3 className="font-bold text-lg mb-2">لا يوجد طلاب بعد</h3>
          <p className="text-muted-foreground text-sm mb-6">أضف طلاباً وأرسل لهم بيانات الدخول</p>
          <a href="/admin/students/new" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 inline-block">
            إضافة أول طالب
          </a>
        </div>
      )}
    </div>
  )
}
