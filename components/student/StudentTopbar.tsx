'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Zap, Flame, Brain, Star } from 'lucide-react'
import type { Profile } from '@/types/supabase'
import Link from 'next/link'
import { InstallAppButton } from '@/components/shared/InstallAppButton'
import { NotificationsDropdown } from '@/components/shared/NotificationsDropdown'

export function StudentTopbar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border px-4 md:px-6 h-16 flex items-center justify-between gap-3">
      {/* Mobile: Logo (hidden on desktop since sidebar shows it) */}
      <Link href="/student/dashboard" className="flex items-center gap-2 md:hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-primary text-base">استباق</span>
      </Link>

      {/* Desktop: greeting */}
      <div className="hidden md:block text-sm text-muted-foreground">
        مرحباً، <span className="font-semibold text-foreground">{profile.full_name.split(' ')[0]}</span> 👋
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <NotificationsDropdown userId={profile.id} />
        <InstallAppButton />

        {/* Avatar */}
        <img
          src={(profile as any).avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
          alt={profile.full_name}
          className="w-8 h-8 rounded-xl object-cover border-2 border-border shrink-0"
        />

        {/* Name - mobile only compact */}
        <div className="flex flex-col md:hidden">
          <span className="text-sm font-bold line-clamp-1 max-w-[90px]">
            {profile.full_name.split(' ')[0]}
          </span>
          {(profile as any).is_premium && (
            <span className="text-[9px] font-black text-amber-600 flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-amber-500" /> VIP
            </span>
          )}
        </div>
        
        {/* VIP Desktop Badge */}
        {(profile as any).is_premium && (
          <div className="hidden md:flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-black border border-amber-200" title="حساب اشتراك مدفوع">
            <Star className="w-3 h-3 fill-amber-500" />
            VIP
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="تسجيل خروج"
          className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors tap-target flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
