import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { BookOpen, ChevronDown } from 'lucide-react'

export default async function CurriculumPage() {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: stages }, { data: subjects }] = await Promise.all([
    supabase.from('educational_stages').select('*, grades(*, units(*, lessons(*)))').order('sort_order'),
    supabase.from('subjects').select('id, name_ar, name_en, icon, color, category, applicable_stages').order('name_ar'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">هيكل المناهج المصرية</h1>
        <p className="text-muted-foreground mt-1">عرض هيكل المناهج الدراسية المدمج في المنصة</p>
      </div>

      {/* Stages & Grades */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />المراحل والصفوف الدراسية</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {stages?.map((stage: any) => (
            <div key={stage.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="bg-primary px-5 py-4">
                <h3 className="text-white font-bold text-base">{stage.name_ar}</h3>
                <p className="text-blue-100 text-xs mt-0.5">{stage.grades?.length} صفوف دراسية</p>
              </div>
              <div className="divide-y divide-border">
                {stage.grades?.map((grade: any) => (
                  <div key={grade.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/20">
                    <span className="text-sm">{grade.name_ar}</span>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{grade.units?.length || 0} وحدة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">المواد الدراسية</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {subjects?.map(subject => (
            <div key={subject.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="text-2xl">{subject.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{subject.name_ar}</p>
                <p className="text-xs text-muted-foreground">{subject.category}</p>
              </div>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-bold text-blue-800 mb-2">💡 ملاحظة</h3>
        <p className="text-sm text-blue-700">
          بيانات المناهج محمّلة مسبقاً من ملف <code className="bg-blue-100 px-1 rounded">supabase/seeds/egyptian_curriculum.sql</code>.
          لإضافة وحدات ودروس مخصصة، يمكنك التعديل مباشرة على قاعدة البيانات من لوحة تحكم Supabase.
        </p>
      </div>
    </div>
  )
}
