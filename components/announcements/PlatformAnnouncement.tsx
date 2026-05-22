'use client'

import { ArrowLeft, Sparkles, Megaphone } from 'lucide-react'
import Link from 'next/link'

interface PlatformAnnouncementProps {
  id: string
  title: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  imageUrl?: string | null
}

export default function PlatformAnnouncement({
  title,
  body,
  ctaLabel,
  ctaUrl,
  imageUrl
}: PlatformAnnouncementProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-indigo-900/30 hover:border-slate-700/50 group">
      {/* Glow Effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 rounded-full mix-blend-screen filter blur-[64px] opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[64px] opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500" />

      <div className="relative flex flex-col md:flex-row gap-6 items-center">
        {imageUrl ? (
          <div className="w-full md:w-48 h-32 shrink-0 rounded-2xl overflow-hidden border border-white/10 relative">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Megaphone className="w-8 h-8 text-white animate-pulse" />
          </div>
        )}

        <div className="flex-1 text-center md:text-right space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            إعلان هام من استباق
          </div>
          <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200">
            {title}
          </h3>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
            {body}
          </p>
        </div>

        {ctaUrl && ctaLabel && (
          <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0">
            <Link
              href={ctaUrl}
              className="relative group/btn flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:from-indigo-600 hover:to-fuchsia-700 transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.03] active:scale-95"
            >
              <span>{ctaLabel}</span>
              <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
