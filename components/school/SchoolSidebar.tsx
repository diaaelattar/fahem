'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  Settings,
  LogOut,
  Bell,
  School,
  FileText
} from 'lucide-react'

interface SchoolSidebarProps {
  profile: any
  school: any
}

export function SchoolSidebar({ profile, school }: SchoolSidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/school/login'
  }

  const menuItems = [
    {
      name: 'لوحة التحكم',
      href: '/school/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'المعلمون',
      href: '/school/teachers',
      icon: Users
    },
    {
      name: 'الطلاب',
      href: '/school/students',
      icon: GraduationCap
    },
    {
      name: 'الفصول الدراسية',
      href: '/school/classes',
      icon: BookOpen
    },
    {
      name: 'الامتحانات المدرسية',
      href: '/school/exams',
      icon: FileSpreadsheet
    },
    {
      name: 'التقارير والإحصائيات',
      href: '/school/reports',
      icon: FileText
    },
    {
      name: 'الإعدادات العامة',
      href: '/school/settings',
      icon: Settings
    }
  ]

  return (
    <aside
      className="w-64 bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full z-30 transition-transform duration-300"
      dir="rtl"
      role="navigation"
      aria-label="القائمة الجانبية الرئيسية"
    >
      {/* رابط Skip للوصول المباشر للمحتوى — مخفي بصرياً ويظهر عند التنقل بلوحة المفاتيح */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:bg-cyan-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:text-sm"
      >
        تخطى للمحتوى الرئيسي
      </a>
      {/* رأس الشريط الجانبي - اسم المدرسة وشعارها */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        {school?.logo_url ? (
          <img
            src={school.logo_url}
            alt={school.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-700"
          />
        ) : (
          <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-800/40 rounded-xl flex items-center justify-center">
            <School className="h-5 w-5 text-cyan-400" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm text-white truncate">{school?.name || 'مدرستنا المتميزة'}</span>
          <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase mt-0.5">
            بوابة الإدارة
          </span>
        </div>
      </div>

      {/* روابط الملاحة */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="قائمة صفحات بوابة المدارس">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                }`}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* تذييل الشريط الجانبي - معلومات الحساب وتسجيل الخروج */}
      <div className="p-4 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center gap-3 px-2">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center font-bold text-sm text-cyan-400 border border-slate-700">
              {profile?.full_name?.charAt(0) || 'م'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-200 truncate">{profile?.full_name}</span>
            <span className="text-[10px] text-slate-500 truncate">{profile?.email}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-900/30"
          aria-label="تسجيل الخروج من بوابة المدارس"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
