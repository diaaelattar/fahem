'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User, Bell } from 'lucide-react'

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
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 shrink-0 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 md:hidden">
        <span className="font-display font-bold text-lg text-primary">بوابة المعلم</span>
      </div>

      {/* Placeholder for left side on desktop */}
      <div className="hidden md:block">
        <h2 className="font-bold text-slate-800">مرحباً أستاذ {profile.full_name.split(' ')[0]}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors relative">
          <Bell className="w-5 h-5" />
          {/* Notification dot */}
        </button>

        <div className="flex items-center gap-2 bg-slate-50 border border-border p-1 pr-3 rounded-full">
          <span className="text-sm font-bold text-slate-700 hidden sm:block">
            {profile.full_name.split(' ')[0]}
          </span>
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
            alt={profile.full_name}
            className="w-8 h-8 rounded-full border border-slate-200"
          />
        </div>
        
        <button 
          onClick={handleSignOut}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
