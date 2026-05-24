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
      className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg ${className}`}
      animate={shimmer.animate}
      transition={shimmer.transition}
    />
  )
}

export function SkeletonExamCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-5 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
        </div>
        <SkeletonBox className="h-6 w-6 rounded-full shrink-0" />
      </div>
      <div className="p-5 flex gap-4">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="h-4 w-20" />
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
        <SkeletonBox className="h-8" />
        <SkeletonBox className="h-8" />
        <SkeletonBox className="h-8" />
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
      <SkeletonBox className="w-14 h-14 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-8 w-16" />
      </div>
    </div>
  )
}

export function SkeletonExamsList() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1,2,3,4,5,6].map(i => <SkeletonExamCard key={i} />)}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-40 bg-gradient-to-l from-indigo-100 to-purple-100 rounded-3xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[0,1,2].map(i => <SkeletonStatCard key={i} />)}
      </div>
    </div>
  )
}
