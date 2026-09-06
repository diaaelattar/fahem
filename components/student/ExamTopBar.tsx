'use client'

import React from 'react'
import { Clock, WifiOff, Cloud, CloudOff, Loader2, Check } from 'lucide-react'

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error'

interface ExamTopBarProps {
  title: string
  timeRemainingSeconds: number | null
  progress: number
  answeredCount: number
  totalQuestions: number
  syncStatus: SyncStatus
  isOnline: boolean
  formatTime: (secs: number | null) => string
  onSubmitClick?: () => void
  isSubmitting?: boolean
}

export function ExamTopBar({
  title,
  timeRemainingSeconds,
  progress,
  answeredCount,
  totalQuestions,
  syncStatus,
  isOnline,
  formatTime,
  onSubmitClick,
  isSubmitting = false,
}: ExamTopBarProps) {
  const isUrgentTime =
    timeRemainingSeconds !== null && timeRemainingSeconds < 300 // أقل من 5 دقائق

  return (
    <header className="sticky top-3 z-30 mb-5 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-md transition-all">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Exam Title & Subject */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          <h1 className="truncate text-base font-bold text-slate-800" title={title}>
            {title}
          </h1>
        </div>

        {/* Status Indicators: Sync status + Timer + Submit */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Sync & Network Badge */}
          {syncStatus === 'offline' || !isOnline ? (
            <div
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors"
              title="انقطع الاتصال بالإنترنت - إجاباتك محفوظة بأمان على جهازك"
            >
              <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-600 animate-pulse" />
              <span className="hidden sm:inline">أوفلاين (محفوظ محلياً)</span>
              <span className="sm:hidden">محلياً</span>
            </div>
          ) : syncStatus === 'saving' ? (
            <div
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700"
              title="جارِ حفظ الإجابات سحابياً..."
            >
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-600" />
              <span className="hidden sm:inline">جارِ المزامنة...</span>
            </div>
          ) : syncStatus === 'error' ? (
            <div
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
              title="تعذرت المزامنة السحابية مؤقتاً - الإجابات محفوظة محلياً"
            >
              <CloudOff className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              <span className="hidden sm:inline">محفوظ محلياً فقط</span>
              <span className="sm:hidden">محلياً</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
              title="جميع الإجابات متزامنة سحابياً ومحفوظة محلياً"
            >
              <Cloud className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <Check className="h-3 w-3 -mr-2 text-emerald-600" />
              <span className="hidden sm:inline">محفوظ سحابياً</span>
            </div>
          )}

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-sm font-bold tabular-nums transition-all ${
              isUrgentTime
                ? 'border border-red-300 bg-red-50 text-red-600 animate-pulse shadow-sm shadow-red-100'
                : 'border border-slate-200 bg-slate-100/80 text-slate-700'
            }`}
            title="الوقت المتبقي لانتهاء الاختبار"
          >
            <Clock
              className={`h-4 w-4 ${
                isUrgentTime ? 'text-red-500' : 'text-slate-500'
              }`}
            />
            <span>{formatTime(timeRemainingSeconds)}</span>
          </div>

          {/* Optional Quick Submit Button */}
          {onSubmitClick && (
            <button
              onClick={onSubmitClick}
              disabled={isSubmitting}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جارِ التسليم...
                </>
              ) : (
                'تسليم الآن'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-600 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-xs font-bold text-slate-600">
          {answeredCount} / {totalQuestions} مُجاب{' '}
          <span className="text-slate-400 font-normal">
            ({Math.round(progress)}%)
          </span>
        </span>
      </div>
    </header>
  )
}
