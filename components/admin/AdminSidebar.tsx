'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Brain, LayoutDashboard, Upload, HelpCircle,
  ClipboardList, BarChart3, Users, Settings, BookOpen
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/admin/content', icon: Upload, label: 'رفع المحتوى' },
  { href: '/admin/questions', icon: HelpCircle, label: 'بنك الأسئلة' },
  { href: '/admin/exams', icon: ClipboardList, label: 'الاختبارات' },
  { href: '/admin/students', icon: Users, label: 'الطلاب' },
  { href: '/admin/reports', icon: BarChart3, label: 'التقارير' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-border flex flex-col shadow-sm z-40">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-primary leading-none">استباق مصر</div>
            <div className="text-xs text-muted-foreground mt-0.5">لوحة المدير</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-1">القائمة الرئيسية</div>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}

        <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-4">المناهج</div>
        <Link href="/admin/curriculum" className={`sidebar-link ${pathname.startsWith('/admin/curriculum') ? 'active' : ''}`}>
          <BookOpen className="w-4 h-4 shrink-0" />
          هيكل المناهج
        </Link>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border">
        <Link href="/admin/settings" className={`sidebar-link ${pathname.startsWith('/admin/settings') ? 'active' : ''}`}>
          <Settings className="w-4 h-4 shrink-0" />
          الإعدادات
        </Link>
      </div>
    </aside>
  )
}
