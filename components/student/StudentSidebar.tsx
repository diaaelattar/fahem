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
  Users,
  BookOpen,
} from 'lucide-react'

const navItems = [
  { href: '/student/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/student/lessons', icon: BookOpen, label: 'دروسي' },
  { href: '/student/practice', icon: Dumbbell, label: 'مركز التدريب' },
  {
    href: '/student/challenges',
    icon: Swords,
    label: 'التحديات',
    badge: 'جديد',
    badgeColor: 'bg-indigo-500',
  },
  { href: '/student/groups', icon: Users, label: 'مجموعاتي' },
  {
    href: '/student/leaderboard',
    icon: Trophy,
    label: 'لوحة الشرف',
    badge: '🔥',
    badgeColor: 'bg-amber-500',
  },
  { href: '/student/exams', icon: ClipboardList, label: 'اختباراتي' },
  { href: '/student/results', icon: BarChart3, label: 'نتائجي' },
  { href: '/student/achievements', icon: Award, label: 'إنجازاتي' },
  { href: '/student/profile', icon: User, label: 'حسابي' },
  {
    href: '/student/vip',
    icon: Crown,
    label: 'ترقية VIP',
    badge: '👑',
    badgeColor: 'bg-yellow-500',
  },
]

export function StudentSidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed bottom-0 right-0 top-0 z-40 flex w-64 flex-col border-l border-border bg-white shadow-sm">
      {/* Logo */}
      <div className="border-b border-border p-5">
        <Link href="/student/dashboard" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="استباق مصر فاهم"
            className="h-12 w-12 object-contain"
          />
          <div>
            <div className="font-display text-base font-bold leading-none text-primary">
              استباق مصر
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              المرحلة الإعدادية
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {/* Section: التعلم والتدريب */}
        <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          التعلم
        </p>
        {navItems
          .slice(0, 3)
          .map(({ href, icon: Icon, label, badge, badgeColor }) => {
            const active =
              pathname === href ||
              (href !== '/student/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className={`text-[9px] font-black ${badgeColor || 'bg-primary'} rounded-full px-1.5 py-0.5 text-white`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}

        {/* Section: المنافسة */}
        <p className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          المنافسة
        </p>
        {navItems
          .slice(3, 5)
          .map(({ href, icon: Icon, label, badge, badgeColor }) => {
            const active = pathname === href || pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className={`text-[9px] font-black ${badgeColor || 'bg-primary'} rounded-full px-1.5 py-0.5 text-white`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}

        {/* Section: متابعة الأداء */}
        <p className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          أدائي
        </p>
        {navItems.slice(5).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span>واصل تدريبك يومياً للتفوق!</span>
        </div>
      </div>
    </aside>
  )
}
