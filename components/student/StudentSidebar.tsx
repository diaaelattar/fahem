'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Award,
  Dumbbell,
  Swords,
  Trophy,
  User,
  Flame,
  Crown,
  BookOpen,
  Users,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   NAV STRUCTURE
───────────────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'التعلم',
    items: [
      { href: '/student/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
      { href: '/student/lessons',   icon: BookOpen,        label: 'دروسي' },
      { href: '/student/practice',  icon: Dumbbell,        label: 'مركز التدريب' },
      { href: '/student/exams',     icon: ClipboardList,   label: 'اختباراتي' },
    ],
  },
  {
    label: 'المنافسة',
    items: [
      {
        href: '/student/challenges',
        icon: Swords,
        label: 'التحديات',
        badge: 'جديد',
        badgeClass: 'bg-indigo-500 text-white',
      },
      { href: '/student/groups',     icon: Users,  label: 'مجموعاتي' },
      {
        href: '/student/leaderboard',
        icon: Trophy,
        label: 'لوحة الشرف',
        badge: '🔥',
        badgeClass: 'bg-amber-100 text-amber-700',
      },
    ],
  },
  {
    label: 'أدائي',
    items: [
      { href: '/student/results',      icon: BarChart3, label: 'نتائجي'    },
      { href: '/student/achievements', icon: Award,     label: 'إنجازاتي'  },
      { href: '/student/profile',      icon: User,      label: 'حسابي'     },
    ],
  },
]

const VIP_ITEM = {
  href: '/student/vip',
  icon: Crown,
  label: 'ترقية VIP',
  badge: '👑',
  badgeClass: 'bg-yellow-100 text-yellow-700',
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */
export function StudentSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/student/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="sidebar-root" aria-label="القائمة الجانبية للطالب">
      {/* ── Logo ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-4">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-md">
            <img
              src="/logo.png"
              alt="استباق فاهم"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-black text-slate-800">
              استباق مصر
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              بوابة الطالب
            </div>
          </div>
        </Link>
      </div>

      {/* ── Nav Sections ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" role="navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section Label */}
            <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map(({ href, icon: Icon, label, badge, badgeClass }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`sidebar-link group ${active ? 'active' : ''}`}
                  >
                    {/* Icon container */}
                    <span className="sidebar-icon">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="flex-1 text-[13.5px]">{label}</span>

                    {/* Badge */}
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

        {/* ── VIP Upgrade ── */}
        <div className="pt-1">
          <Link
            href={VIP_ITEM.href}
            className={`sidebar-link group ${isActive(VIP_ITEM.href) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">
              <VIP_ITEM.icon className="h-4 w-4" />
            </span>
            <span className="flex-1 text-[13.5px]">{VIP_ITEM.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${VIP_ITEM.badgeClass}`}>
              {VIP_ITEM.badge}
            </span>
          </Link>
        </div>
      </nav>

      {/* ── Footer — Daily Motivation ── */}
      <div className="shrink-0 border-t border-slate-100 p-4">
        <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 px-3.5 py-3">
          <Flame className="h-4 w-4 shrink-0 text-orange-500 animate-glow-pulse" />
          <p className="text-[11.5px] font-bold text-amber-800 leading-snug">
            واصل تدريبك يومياً للتفوق والوصول للقمة! 🎯
          </p>
        </div>
      </div>
    </aside>
  )
}
