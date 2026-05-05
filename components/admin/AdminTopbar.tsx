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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border px-4 md:px-6 h-16 flex items-center justify-between gap-3">
      {/* Left side: hamburger (mobile) + greeting */}
      <div className="flex items-center gap-3">
        {/* Hamburger — only on small screens */}
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors text-slate-600"
          aria-label="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="text-sm text-muted-foreground hidden sm:block">
          مرحباً، <span className="font-semibold text-foreground">{profile?.full_name || 'المدير'}</span>
        </div>
      </div>

      {/* Right side: bells + avatar + logout */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">
            {profile?.full_name?.split(' ')[0] || 'مدير'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
