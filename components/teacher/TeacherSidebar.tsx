'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart, 
  Settings,
  BrainCircuit
} from 'lucide-react'

const MENU_ITEMS = [
  { href: '/teacher/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/teacher/groups', label: 'مجموعاتي', icon: Users },
  { href: '/teacher/exams', label: 'الاختبارات', icon: FileText },
  { href: '/teacher/reports', label: 'تقارير الأداء', icon: BarChart },
  { href: '/teacher/settings', label: 'الإعدادات', icon: Settings },
]

export function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed right-0 top-0 border-l border-slate-800">
      <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0 px-6 gap-3">
        <img src="/logo.png" alt="استباق مصر فاهم" className="w-8 h-8 object-contain drop-shadow-md brightness-200" />
        <span className="font-display font-bold text-lg text-white">بوابة المعلم</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1.5">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 font-bold' 
                    : 'hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">اشتراك المعلم</div>
          <div className="text-sm font-bold text-emerald-400">مفعل (VIP)</div>
        </div>
      </div>
    </div>
  )
}
