'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart,
  HelpCircle,
} from 'lucide-react'

const MENU_ITEMS = [
  { href: '/teacher/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/teacher/groups', label: 'مجموعاتي', icon: Users },
  { href: '/teacher/exams', label: 'الاختبارات', icon: FileText },
  { href: '/teacher/questions', label: 'الأسئلة', icon: HelpCircle },
  { href: '/teacher/reports', label: 'التقارير', icon: BarChart },
]

export function TeacherBottomNav() {
  const pathname = usePathname()

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white md:hidden">
      <div className="flex h-16 items-center justify-around">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? 'fill-indigo-100' : ''}`}
              />
              <span
                className={`text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
