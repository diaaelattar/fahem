'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart,
  Settings,
} from 'lucide-react'

const MENU_ITEMS = [
  { href: '/teacher/dashboard',  label: 'الرئيسية',  icon: LayoutDashboard },
  { href: '/teacher/groups',     label: 'مجموعاتي',  icon: Users           },
  { href: '/teacher/exams',      label: 'الاختبارات', icon: FileText        },
  { href: '/teacher/reports',    label: 'التقارير',   icon: BarChart        },
  { href: '/teacher/settings',   label: 'الإعدادات', icon: Settings        },
]

export function TeacherBottomNav() {
  const pathname = usePathname()

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        style={{
          background: 'rgba(10, 18, 32, 0.96)',
          borderTop: '1px solid rgba(99, 133, 190, 0.14)',
          backdropFilter: 'blur(20px) saturate(200%)',
          WebkitBackdropFilter: 'blur(20px) saturate(200%)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="التنقل السفلي للمعلم"
        dir="rtl"
      >
        <div className="flex h-16 items-center justify-around px-1">
          {MENU_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {/* Active background glow */}
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-indigo-500/10" />
                )}

                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500/20 scale-110'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : ''}`} />
                </span>

                <span
                  className={`relative text-[9px] font-bold leading-none ${
                    isActive ? 'text-indigo-400' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>

                {isActive && (
                  <span className="absolute top-1 h-1 w-1 rounded-full bg-indigo-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
