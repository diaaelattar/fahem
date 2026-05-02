'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Zap, Flame, Brain } from 'lucide-react'
import type { Profile } from '@/types/supabase'
import Link from 'next/link'

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
        {/* Avatar */}
        <img
          src={(profile as any).avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
          alt={profile.full_name}
          className="w-8 h-8 rounded-xl object-cover border-2 border-border"
        />

        {/* Name - mobile only compact */}
        <span className="text-sm font-bold md:hidden line-clamp-1 max-w-[100px]">
          {profile.full_name.split(' ')[0]}
        </span>

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
