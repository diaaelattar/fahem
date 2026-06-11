import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SchoolSidebar } from '@/components/school/SchoolSidebar'
import { School, LogOut, LayoutDashboard, Users, GraduationCap, BookOpen, FileSpreadsheet, Settings } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SchoolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  // التحقق من صلاحيات مدير المدرسة
  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const supabase = await createClient()
  
  // جلب بيانات المدرسة المرتبطة بالمدير
  let school = null
  if (profile.school_id) {
    const { data: schoolData } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .maybeSingle()
    school = schoolData
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden" dir="rtl">
      {/* الشريط الجانبي في الشاشات الكبيرة */}
      <div className="hidden lg:block h-full">
        <SchoolSidebar profile={profile} school={school} />
      </div>

      {/* منطقة المحتوى الرئيسية */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* شريط علوي بسيط ومتجاوب */}
        <header className="h-16 border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3 lg:hidden">
            {school?.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-cyan-950/60 border border-cyan-800/40 rounded-lg flex items-center justify-center">
                <School className="h-4 w-4 text-cyan-400" />
              </div>
            )}
            <span className="font-bold text-sm text-white truncate max-w-[150px]">
              {school?.name || 'بوابة المدارس'}
            </span>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-white" id="school-portal-title">بوابة الإدارة المدرسية الذكية</h1>
          </div>

          {/* تفاصيل الحساب الحالي للتأكيد */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 hidden sm:inline-block">
              {school?.name || 'مدرسة غير مرتبطة'}
            </span>
            <div className="text-xs text-slate-300 font-semibold">
              مرحباً، {profile.full_name}
            </div>
          </div>
        </header>

        {/* جسم الصفحة الرئيسي للمحتوى */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 relative" tabIndex={-1}>
          {/* تأثيرات تدرج خفيفة في الخلفية لجمالية الواجهات */}
          <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-900/5 blur-[100px] pointer-events-none z-0" />
          <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-900/5 blur-[100px] pointer-events-none z-0" />
          
          <div className="relative z-10 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>

        {/* الملاحة السفلية للهواتف المحمولة */}
        <nav
          className="lg:hidden h-16 border-t border-slate-900 bg-slate-900/80 backdrop-blur-md flex items-center justify-around px-2 py-1 z-20 shrink-0"
          role="navigation"
          aria-label="التنقل السريع"
        >
          <Link
            href="/school/dashboard"
            className="flex flex-col items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="الصفحة الرئيسية — لوحة القيادة"
          >
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] mt-1">الرئيسية</span>
          </Link>
          <Link
            href="/school/teachers"
            className="flex flex-col items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="إدارة أعضاء هيئة التدريس"
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] mt-1">المعلمون</span>
          </Link>
          <Link
            href="/school/students"
            className="flex flex-col items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="إدارة شؤون الطلاب"
          >
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] mt-1">الطلاب</span>
          </Link>
          <Link
            href="/school/classes"
            className="flex flex-col items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="إدارة الفصول الدراسية"
          >
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] mt-1">الفصول</span>
          </Link>
          <Link
            href="/school/settings"
            className="flex flex-col items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="إعدادات المدرسة"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] mt-1">الإعدادات</span>
          </Link>
        </nav>
        {/* شريط الخصوصية السفلي — مخفي في الهواتف، ظاهر في سطح المكتب */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2 border-t border-slate-900/60 bg-slate-950/30 text-[10px] text-slate-600 shrink-0">
          <span>جلستك تنتهي تلقائياً بعد 30 دقيقة من الخمول للحفاظ على أمان بياناتك.</span>
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors underline-offset-2 hover:underline"
            aria-label="قراءة سياسة الخصوصية"
          >
            سياسة الخصوصية
          </Link>
        </div>
      </div>
    </div>
  )
}
