'use client'

import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, X } from 'lucide-react'

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // default true to avoid flash
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(isAppStandalone)

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Listen for beforeinstallprompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () =>
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
  }, [])

  if (isStandalone) return null

  // Don't show if neither Android prompt is ready NOR it is iOS
  if (!deferredPrompt && !isIOS) return null

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true)
    } else if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="sm:hidden">تثبيت</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in sm:items-center">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 sm:slide-in-from-bottom-0">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Download className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-center text-xl font-bold">
              تثبيت التطبيق على آيفون
            </h3>
            <p className="mb-6 text-center text-sm leading-relaxed text-slate-600">
              آبل لا تدعم التثبيت المباشر. لتثبيت استبق - مصر ( فاهم )، اتبع الخطوات
              التالية:
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  1
                </div>
                <div className="flex-1 text-sm font-medium">
                  اضغط على زر المشاركة أسفل الشاشة المتصفح
                </div>
                <Share className="h-5 w-5 text-blue-600" />
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  2
                </div>
                <div className="flex-1 text-sm font-medium">
                  اختر "إضافة إلى الصفحة الرئيسية"
                </div>
                <PlusSquare className="h-5 w-5 text-slate-600" />
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full rounded-xl bg-slate-800 py-3.5 font-bold text-white transition-colors hover:bg-slate-900"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  )
}
