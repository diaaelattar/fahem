'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Swords, Trophy, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/student/dashboard',   icon: Home,   label: 'الرئيسية' },
  { href: '/student/practice',    icon: Target, label: 'تدريب' },
  { href: '/student/challenges',  icon: Swords, label: 'تحدي' },
  { href: '/student/leaderboard', icon: Trophy, label: 'الشرف' },
  { href: '/student/profile',     icon: User,   label: 'حسابي' },
]

export function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Spacer so content doesn't hide under nav */}
      <div className="h-20 md:hidden" />

      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-border shadow-2xl shadow-black/10" dir="rtl">
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            const isChallenge = href.includes('challenges')
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all relative
                  ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {isChallenge ? (
                  // Special styling for Challenges button
                  <div className={`relative -mt-5 flex flex-col items-center`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all
                      ${isActive
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-indigo-300 scale-110'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-200 hover:scale-105'
                      }`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : ''}`}>
                      {label}
                    </span>
                    {isActive && (
                      <div className="absolute top-0.5 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
