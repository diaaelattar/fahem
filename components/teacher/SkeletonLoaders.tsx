// Skeleton loader components for teacher portal
'use client'
import { motion } from 'framer-motion'

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
}

function SkeletonBox({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
      animate={shimmer.animate}
      transition={shimmer.transition}
    />
  )
}

export function SkeletonExamCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex justify-between border-b border-slate-100 p-5">
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-5 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
        </div>
        <SkeletonBox className="h-6 w-6 shrink-0 rounded-full" />
      </div>
      <div className="flex gap-4 p-5">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50 p-4">
        <SkeletonBox className="h-8" />
        <SkeletonBox className="h-8" />
        <SkeletonBox className="h-8" />
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <SkeletonBox className="h-14 w-14 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-8 w-16" />
      </div>
    </div>
  )
}

export function SkeletonExamsList() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonExamCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-gradient-to-l from-indigo-100 to-purple-100" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    </div>
  )
}
