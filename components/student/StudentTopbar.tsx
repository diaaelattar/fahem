'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Star } from 'lucide-react'
import type { Profile } from '@/types/supabase'
import Link from 'next/link'
import { InstallAppButton } from '@/components/shared/InstallAppButton'
import { NotificationsDropdown } from '@/components/shared/NotificationsDropdown'

export function StudentTopbar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const studentProfile = profile as Profile & {
    avatar_url?: string
    is_premium?: boolean
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/90 px-4 backdrop-blur-md md:px-6">
      {/* Mobile: Logo (hidden on desktop since sidebar shows it) */}
      <Link
        href="/student/dashboard"
        className="flex items-center gap-2 md:hidden"
      >
        <img
          src="/logo.png"
          alt="استباق مصر فاهم"
          className="h-10 w-10 object-contain"
        />
        <span className="font-display text-base font-bold text-primary">
          استباق
        </span>
      </Link>

      {/* Desktop: greeting */}
      <div className="hidden text-sm text-muted-foreground md:block">
        مرحباً،{' '}
        <span className="font-semibold text-foreground">
          {studentProfile.full_name.split(' ')[0]}
        </span>{' '}
        👋
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <NotificationsDropdown userId={studentProfile.id} />
        <InstallAppButton />

        {/* Avatar */}
        <img
          src={
            studentProfile.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${studentProfile.full_name}`
          }
          alt={studentProfile.full_name}
          className="h-8 w-8 shrink-0 rounded-xl border-2 border-border object-cover"
        />

        {/* Name - mobile only compact */}
        <div className="flex flex-col md:hidden">
          <span className="line-clamp-1 max-w-[90px] text-sm font-bold">
            {studentProfile.full_name.split(' ')[0]}
          </span>
          {studentProfile.is_premium && (
            <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600">
              <Star className="h-2 w-2 fill-amber-500" /> VIP
            </span>
          )}
        </div>

        {/* VIP Desktop Badge */}
        {studentProfile.is_premium && (
          <div
            className="hidden items-center gap-1 rounded-lg border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-black text-amber-700 md:flex"
            title="حساب اشتراك مدفوع"
          >
            <Star className="h-3 w-3 fill-amber-500" />
            VIP
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="تسجيل خروج"
          className="tap-target flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
