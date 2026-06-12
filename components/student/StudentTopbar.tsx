'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Star, Flame, Zap } from 'lucide-react'
import type { Profile } from '@/types/supabase'
import Link from 'next/link'
import { InstallAppButton } from '@/components/shared/InstallAppButton'
import { NotificationsDropdown } from '@/components/shared/NotificationsDropdown'

export function StudentTopbar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const p = profile as Profile & {
    avatar_url?: string
    is_premium?: boolean
    xp_points?: number
    streak_days?: number
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const firstName = p.full_name?.split(' ')[0] ?? 'طالب'

  return (
    <header className="topbar-root" aria-label="شريط التنقل العلوي">

      {/* ── Mobile: Logo ── */}
      <Link
        href="/student/dashboard"
        className="flex items-center gap-2.5 md:hidden"
        aria-label="الصفحة الرئيسية"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-md">
          <img
            src="/logo.png"
            alt="استباق"
            className="h-6 w-6 object-contain"
          />
        </div>
        <span className="font-display text-[15px] font-black text-slate-800">
          استباق
        </span>
      </Link>

      {/* ── Desktop: Welcome greeting ── */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="text-sm text-slate-500">
          مرحباً،{' '}
          <span className="font-bold text-slate-800">{firstName}</span>
          {' '}👋
        </div>

        {/* XP Chip — desktop only */}
        {p.xp_points !== undefined && (
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
            <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
            {p.xp_points} XP
          </div>
        )}

        {/* Streak chip */}
        {p.streak_days !== undefined && p.streak_days > 0 && (
          <div
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-black transition-all ${
              p.streak_days >= 3
                ? 'border-orange-200 bg-orange-50 text-orange-700 streak-glow'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 ${
                p.streak_days >= 3 ? 'text-orange-500' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            {p.streak_days} يوم
          </div>
        )}
      </div>

      {/* ── Right Side Actions ── */}
      <div className="flex items-center gap-2">
        <NotificationsDropdown userId={p.id} />
        <InstallAppButton />

        {/* VIP Badge — desktop */}
        {p.is_premium && (
          <div
            className="hidden items-center gap-1.5 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1 text-xs font-black text-amber-700 md:flex"
            title="مشترك VIP"
          >
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
            VIP
          </div>
        )}

        {/* Avatar + Name */}
        <div className="flex items-center gap-2">
          <img
            src={
              p.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name)}`
            }
            alt={p.full_name}
            className="h-9 w-9 shrink-0 rounded-xl border-2 border-slate-100 object-cover shadow-sm transition-transform hover:scale-105"
          />

          {/* Mobile: compact name */}
          <div className="flex flex-col md:hidden">
            <span className="line-clamp-1 max-w-[80px] text-[13px] font-bold text-slate-800">
              {firstName}
            </span>
            {p.is_premium && (
              <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600">
                <Star className="h-2 w-2 fill-amber-500" aria-hidden="true" /> VIP
              </span>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
          className="tap-target flex items-center justify-center rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
