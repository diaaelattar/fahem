'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Brain, LayoutDashboard, ClipboardList, BarChart3,
  Award, Dumbbell, Swords, Trophy, User, Flame, Crown, Users
} from 'lucide-react'

const navItems = [
  { href: '/student/dashboard',   icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/student/practice',    icon: Dumbbell,        label: 'مركز التدريب' },
  { href: '/student/challenges',  icon: Swords,          label: 'التحديات',    badge: 'جديد', badgeColor: 'bg-indigo-500' },
  { href: '/student/groups',      icon: Users,           label: 'مجموعاتي' },
  { href: '/student/leaderboard', icon: Trophy,          label: 'لوحة الشرف',  badge: '🔥',   badgeColor: 'bg-amber-500' },
  { href: '/student/exams',       icon: ClipboardList,   label: 'اختباراتي' },
  { href: '/student/results',     icon: BarChart3,       label: 'نتائجي' },
  { href: '/student/achievements',icon: Award,           label: 'إنجازاتي' },
  { href: '/student/profile',     icon: User,            label: 'حسابي' },
  { href: '/student/vip',         icon: Crown,           label: 'ترقية VIP',   badge: '👑',   badgeColor: 'bg-yellow-500' },
]

export function StudentSidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-border flex flex-col shadow-sm z-40">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/student/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-md">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-primary leading-none">استباق مصر</div>
            <div className="text-xs text-muted-foreground mt-0.5">المرحلة الإعدادية</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Section: التعلم والتدريب */}
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 pt-2 pb-1">التعلم</p>
        {navItems.slice(0, 2).map(({ href, icon: Icon, label, badge, badgeColor }) => {
          const active = pathname === href || (href !== '/student/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className={`text-[9px] font-black ${badgeColor || 'bg-primary'} text-white px-1.5 py-0.5 rounded-full`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Section: المنافسة */}
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 pt-4 pb-1">المنافسة</p>
        {navItems.slice(2, 4).map(({ href, icon: Icon, label, badge, badgeColor }) => {
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className={`text-[9px] font-black ${badgeColor || 'bg-primary'} text-white px-1.5 py-0.5 rounded-full`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Section: متابعة الأداء */}
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 pt-4 pb-1">أدائي</p>
        {navItems.slice(4).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>واصل تدريبك يومياً للتفوق!</span>
        </div>
      </div>
    </aside>
  )
}
