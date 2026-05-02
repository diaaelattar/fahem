'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  title: string
  description?: string
  type?: ToastType
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <Toaster>')
  return ctx
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const COLORS = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error:   'border-red-200 bg-red-50 text-red-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info:    'border-blue-200 bg-blue-50 text-blue-800',
}

const ICON_COLORS = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-yellow-500',
  info:    'text-blue-500',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const type = toast.type || 'info'
  const Icon = ICONS[type]

  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration ?? 4000)
    return () => clearTimeout(t)
  }, [toast.duration, onDismiss])

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-md min-w-[280px] max-w-sm animate-fade-in ${COLORS[type]}`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${ICON_COLORS[type]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug">{toast.title}</p>
        {toast.description && <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>}
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

let _toast: ((t: Omit<Toast, 'id'>) => void) | null = null
export function toast(t: Omit<Toast, 'id'>) { _toast?.(t) }

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...t, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => { _toast = addToast; return () => { _toast = null } }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, dismiss }}>
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
