'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, LayoutDashboard, ClipboardList, BarChart3, Award, UserCircle } from 'lucide-react'

const navItems = [
  { href: '/student/dashboard',     icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/student/exams',         icon: ClipboardList,   label: 'اختباراتي' },
  { href: '/student/results',       icon: BarChart3,       label: 'نتائجي' },
  { href: '/student/certificates',  icon: Award,           label: 'شهاداتي' },
]

export function StudentSidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-border flex flex-col shadow-sm z-40">
      <div className="p-5 border-b border-border">
        <Link href="/student/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-green-700 leading-none">استباق مصر</div>
            <div className="text-xs text-muted-foreground mt-0.5">بوابة الطالب</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/student/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={"sidebar-link" + (active ? " active" : "")}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <Link href="/student/profile" className={"sidebar-link" + (pathname.startsWith('/student/profile') ? " active" : "")}>
          <UserCircle className="w-4 h-4 shrink-0" />
          ملفي الشخصي
        </Link>
      </div>
    </aside>
  )
}
