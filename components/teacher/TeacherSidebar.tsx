'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart,
  Settings,
  HelpCircle,
  BookOpen,
  Sparkles,
  GraduationCap,
} from 'lucide-react'

const MENU_SECTIONS = [
  {
    label: 'الإدارة',
    items: [
      { href: '/teacher/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      { href: '/teacher/groups',    label: 'مجموعاتي',   icon: Users },
      { href: '/teacher/reports',   label: 'تقارير الأداء', icon: BarChart },
    ],
  },
  {
    label: 'المحتوى',
    items: [
      {
        href: '/teacher/exams',
        label: 'الاختبارات',
        icon: FileText,
        badge: 'AI',
        badgeClass: 'bg-violet-500 text-white',
      },
      { href: '/teacher/questions', label: 'بنك الأسئلة', icon: HelpCircle },
      {
        href: '/teacher/lessons',
        label: 'شرح الدروس',
        icon: BookOpen,
        badge: 'جديد',
        badgeClass: 'bg-emerald-500 text-white',
      },
    ],
  },
  {
    label: 'الحساب',
    items: [
      { href: '/teacher/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
]

export function TeacherSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className="fixed bottom-0 right-0 top-0 z-40 flex w-64 flex-col"
      style={{
        background: 'linear-gradient(180deg, #0f1e35 0%, #0a1628 60%, #070e1c 100%)',
        borderLeft: '1px solid rgba(99,133,190,0.12)',
        boxShadow: '-4px 0 32px -8px rgba(0,0,0,0.4)',
      }}
      aria-label="القائمة الجانبية للمعلم"
    >
      {/* ── Logo / Brand ── */}
      <div
        className="flex shrink-0 items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(99,133,190,0.12)' }}
      >
        <Link
          href="/teacher/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10 shadow-lg">
            <img
              src="/logo.png"
              alt="استباق فاهم"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-black text-white">
              استباق مصر
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <GraduationCap className="h-3 w-3 text-indigo-400" />
              <span className="text-[11px] font-bold text-indigo-300">
                بوابة المعلم
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" role="navigation">
        {MENU_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, badge, badgeClass }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-indigo-500/15 text-indigo-300 font-bold'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {/* Active left border indicator */}
                    {active && (
                      <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-indigo-400" />
                    )}

                    {/* Icon */}
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300'
                      }`}
                      style={active ? { boxShadow: '0 0 16px -4px rgba(99,102,241,0.6)' } : undefined}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="flex-1">{label}</span>

                    {badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${badgeClass}`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer — Subscription Status ── */}
      <div
        className="shrink-0 p-4"
        style={{ borderTop: '1px solid rgba(99,133,190,0.12)' }}
      >
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-0.5">
                اشتراك المعلم
              </div>
              <div className="text-[13px] font-black text-emerald-400">
                مفعّل ✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
