'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Swords, Trophy, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/student/dashboard', icon: Home, label: 'الرئيسية' },
  { href: '/student/practice', icon: Target, label: 'تدريب' },
  { href: '/student/challenges', icon: Swords, label: 'تحدي' },
  { href: '/student/leaderboard', icon: Trophy, label: 'الشرف' },
  { href: '/student/profile', icon: User, label: 'حسابي' },
]

export function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Spacer so content doesn't hide under nav */}
      <div className="h-20 md:hidden" />

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl md:hidden"
        dir="rtl"
      >
        <div className="safe-area-bottom flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/')
            const isChallenge = href.includes('challenges')
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 transition-all ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {isChallenge ? (
                  // Special styling for Challenges button
                  <div className={`relative -mt-5 flex flex-col items-center`}>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all ${
                        isActive
                          ? 'scale-110 bg-gradient-to-br from-indigo-600 to-purple-600 shadow-indigo-300'
                          : 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-200 hover:scale-105'
                      }`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span
                      className={`mt-1 text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-muted-foreground'}`}
                    >
                      {label}
                    </span>
                  </div>
                ) : (
                  <>
                    <div
                      className={`rounded-xl p-2 transition-all ${isActive ? 'bg-primary/10' : ''}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold ${isActive ? 'text-primary' : ''}`}
                    >
                      {label}
                    </span>
                    {isActive && (
                      <div className="absolute top-0.5 h-1 w-1 rounded-full bg-primary" />
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
