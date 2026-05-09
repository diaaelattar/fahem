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
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || 
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

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
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
        className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="sm:hidden">تثبيت</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <button 
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 mx-auto">
              <Download className="w-6 h-6" />
            </div>
            
            <h3 className="text-xl font-bold text-center mb-2">تثبيت التطبيق على آيفون</h3>
            <p className="text-center text-slate-600 text-sm mb-6 leading-relaxed">
              آبل لا تدعم التثبيت المباشر. لتثبيت استباق مصر، اتبع الخطوات التالية:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">1</div>
                <div className="flex-1 text-sm font-medium">اضغط على زر المشاركة أسفل الشاشة المتصفح</div>
                <Share className="w-5 h-5 text-blue-600" />
              </div>
              
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">2</div>
                <div className="flex-1 text-sm font-medium">اختر "إضافة إلى الصفحة الرئيسية"</div>
                <PlusSquare className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  )
}
