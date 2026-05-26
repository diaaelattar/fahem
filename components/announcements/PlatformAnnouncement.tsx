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
  imageUrl,
}: PlatformAnnouncementProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl transition-all duration-300 hover:border-slate-700/50 hover:shadow-indigo-900/30 md:p-8">
      {/* Glow Effects */}
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-500 opacity-25 mix-blend-screen blur-[64px] filter transition-opacity duration-500 group-hover:opacity-40" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-fuchsia-500 opacity-25 mix-blend-screen blur-[64px] filter transition-opacity duration-500 group-hover:opacity-40" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.05]" />

      <div className="relative flex flex-col items-center gap-6 md:flex-row">
        {imageUrl ? (
          <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 md:w-48">
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-lg shadow-indigo-500/20">
            <Megaphone className="h-8 w-8 animate-pulse text-white" />
          </div>
        )}

        <div className="flex-1 space-y-2 text-center md:text-right">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            إعلان هام من استباق
          </div>
          <h3 className="bg-gradient-to-b from-white to-slate-200 bg-clip-text text-xl font-black text-transparent md:text-2xl">
            {title}
          </h3>
          <p className="text-sm font-medium leading-relaxed text-slate-400 md:text-base">
            {body}
          </p>
        </div>

        {ctaUrl && ctaLabel && (
          <div className="mt-4 w-full shrink-0 md:mt-0 md:w-auto">
            <Link
              href={ctaUrl}
              className="group/btn relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.03] hover:from-indigo-600 hover:to-fuchsia-700 active:scale-95 md:w-auto"
            >
              <span>{ctaLabel}</span>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover/btn:-translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
