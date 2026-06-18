'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, GraduationCap, Sparkles, BookOpen } from 'lucide-react'
import { NotificationsDropdown } from '@/components/shared/NotificationsDropdown'
import Link from 'next/link'

interface Props {
  profile: {
    id: string
    full_name: string
    email?: string
    avatar_url?: string
  }
}

export function TeacherTopbar({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const firstName = profile.full_name?.split(' ')[0] ?? 'أستاذ'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between px-4 md:px-6"
      style={{
        background: 'rgba(7, 14, 28, 0.92)',
        borderBottom: '1px solid rgba(99, 133, 190, 0.12)',
        backdropFilter: 'blur(14px) saturate(180%)',
        WebkitBackdropFilter: 'blur(14px) saturate(180%)',
      }}
      aria-label="شريط تنقل المعلم"
    >
      {/* ── Mobile: Brand ── */}
      <Link
        href="/teacher/dashboard"
        className="flex items-center gap-2.5 md:hidden"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10">
          <img src="/logo.png" alt="استباق" className="h-5 w-5 object-contain" />
        </div>
        <span className="font-display text-[15px] font-black text-white">
          بوابة المعلم
        </span>
      </Link>

      {/* ── Desktop: Welcome + Quick Actions ── */}
      <div className="hidden items-center gap-4 md:flex">
        {/* Greeting */}
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-200">
            مرحباً أستاذ {firstName}
          </span>
        </div>

        {/* Quick action pill */}
        <Link
          href="/teacher/exams/create"
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-500/20 hover:text-indigo-200"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          إنشاء اختبار AI
        </Link>

        <Link
          href="/teacher/lessons/create"
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:text-emerald-200"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          درس جديد
        </Link>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-2.5">
        <NotificationsDropdown userId={profile.id} />

        {/* Avatar pill */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 transition-all hover:bg-white/10">
          <span className="hidden text-[13px] font-bold text-slate-300 sm:block">
            {firstName}
          </span>
          <img
            src={
              profile.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name)}`
            }
            alt={profile.full_name}
            className="h-7 w-7 rounded-lg border border-white/10 object-cover"
          />
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
          className="tap-target flex items-center justify-center rounded-xl p-2 text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
