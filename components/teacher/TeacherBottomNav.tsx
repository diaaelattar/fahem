'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart
} from 'lucide-react'

const MENU_ITEMS = [
  { href: '/teacher/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/teacher/groups', label: 'مجموعاتي', icon: Users },
  { href: '/teacher/exams', label: 'الاختبارات', icon: FileText },
  { href: '/teacher/reports', label: 'التقارير', icon: BarChart },
]

export function TeacherBottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border pb-safe z-40">
      <div className="flex items-center justify-around h-16">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
                ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-indigo-100' : ''}`} />
              <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
