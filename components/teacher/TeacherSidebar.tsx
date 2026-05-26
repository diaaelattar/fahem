'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart,
  Settings,
  BrainCircuit,
  HelpCircle,
} from 'lucide-react'

const MENU_ITEMS = [
  { href: '/teacher/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/teacher/groups', label: 'مجموعاتي', icon: Users },
  { href: '/teacher/exams', label: 'الاختبارات', icon: FileText },
  { href: '/teacher/questions', label: 'بنك الأسئلة', icon: HelpCircle },
  { href: '/teacher/reports', label: 'تقارير الأداء', icon: BarChart },
  { href: '/teacher/settings', label: 'الإعدادات', icon: Settings },
]

export function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed right-0 top-0 flex h-screen w-64 flex-col border-l border-slate-800 bg-slate-900 text-slate-300">
      <div className="flex h-16 shrink-0 items-center justify-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg">
          <img
            src="/logo.png"
            alt="استباق مصر فاهم"
            className="h-full w-full object-contain"
          />
        </div>
        <span className="font-display text-lg font-bold text-white">
          بوابة المعلم
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-1.5">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 font-bold text-indigo-400'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
          <div className="mb-2 text-xs text-slate-400">اشتراك المعلم</div>
          <div className="text-sm font-bold text-emerald-400">مفعل (VIP)</div>
        </div>
      </div>
    </div>
  )
}
