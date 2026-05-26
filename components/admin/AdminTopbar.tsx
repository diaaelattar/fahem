'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, User, Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import type { Profile } from '@/types/supabase'

export function AdminTopbar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const { toggle } = useSidebar()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/80 px-4 backdrop-blur-md md:px-6">
      {/* Left side: hamburger (mobile) + greeting */}
      <div className="flex items-center gap-3">
        {/* Hamburger — only on small screens */}
        <button
          onClick={toggle}
          className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-muted lg:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden text-sm text-muted-foreground sm:block">
          مرحباً،{' '}
          <span className="font-semibold text-foreground">
            {profile?.full_name || 'المدير'}
          </span>
        </div>
      </div>

      {/* Right side: bells + avatar + logout */}
      <div className="flex items-center gap-2">
        <button className="relative rounded-lg p-2 transition-colors hover:bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="hidden text-sm font-medium sm:inline">
            {profile?.full_name?.split(' ')[0] || 'مدير'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
          title="تسجيل الخروج"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
