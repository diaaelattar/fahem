'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User, Bell } from 'lucide-react'
import { NotificationsDropdown } from '@/components/shared/NotificationsDropdown'

interface Props {
  profile: any
}

export function TeacherTopbar({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 md:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <span className="font-display text-lg font-bold text-primary">
          بوابة المعلم
        </span>
      </div>

      {/* Placeholder for left side on desktop */}
      <div className="hidden md:block">
        <h2 className="font-bold text-slate-800">
          مرحباً أستاذ {profile.full_name.split(' ')[0]}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <NotificationsDropdown userId={profile.id} />

        <div className="flex items-center gap-2 rounded-full border border-border bg-slate-50 p-1 pr-3">
          <span className="hidden text-sm font-bold text-slate-700 sm:block">
            {profile.full_name.split(' ')[0]}
          </span>
          <img
            src={
              profile.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`
            }
            alt={profile.full_name}
            className="h-8 w-8 rounded-full border border-slate-200"
          />
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title="تسجيل الخروج"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
