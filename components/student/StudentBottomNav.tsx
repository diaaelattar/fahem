'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Swords, Trophy, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/student/dashboard',   icon: Home,   label: 'الرئيسية' },
  { href: '/student/practice',    icon: Target, label: 'تدريب'    },
  { href: '/student/challenges',  icon: Swords, label: 'تحدي'     },
  { href: '/student/leaderboard', icon: Trophy, label: 'الشرف'    },
  { href: '/student/profile',     icon: User,   label: 'حسابي'    },
]

export function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Spacer so content isn't hidden under fixed nav */}
      <div className="h-24 md:hidden" aria-hidden="true" />

      <nav
        className="bottom-nav-root"
        dir="rtl"
        aria-label="التنقل السفلي"
      >
        <div className="safe-area-bottom flex items-center justify-around px-1 pt-1.5 pb-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === '/student/dashboard'
                ? pathname === href
                : pathname === href || pathname.startsWith(href + '/')
            const isCenter = href.includes('challenges')

            return (
              <Link
                key={href}
                href={href}
                className={`bottom-nav-item ${isActive ? 'active' : ''} ${isCenter ? '-mt-6' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isCenter ? (
                  /* ── Centre FAB-style button for Challenges ── */
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 ${
                      isActive
                        ? 'scale-110 bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-300 glow-primary'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-indigo-200 hover:scale-105 hover:from-indigo-400 hover:to-violet-400'
                    }`}
                  >
                    <Icon className="h-7 w-7 text-white" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="nav-icon-wrap">
                    <Icon
                      className={`h-5 w-5 transition-all duration-200 ${
                        isActive ? 'scale-110' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                )}

                <span
                  className={`nav-label mt-0.5 transition-colors duration-200 ${
                    isActive && !isCenter
                      ? 'text-primary font-black'
                      : isCenter && isActive
                      ? 'text-indigo-600 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>

                {/* Active indicator dot (non-center items) */}
                {isActive && !isCenter && (
                  <span className="absolute top-1 h-1 w-1 rounded-full bg-primary animate-pop" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
