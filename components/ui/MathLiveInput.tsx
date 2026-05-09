'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Calculator } from 'lucide-react'

interface Props {
  value: string
  onChange: (val: string) => void
  className?: string
  placeholder?: string
}

export function MathLiveInput({ value, onChange, className = '', placeholder = '' }: Props) {
  const ref = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!window.customElements.get('math-field')) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/mathlive'
      script.defer = true
      script.onload = () => {
        setLoaded(true)
        // Force Arabic virtual keyboard or default layout if needed
      }
      script.onerror = () => setError(true)
      document.head.appendChild(script)
    } else {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (el) {
      const handler = (e: any) => {
        onChange(e.target.value)
      }
      el.addEventListener('input', handler)
      return () => el.removeEventListener('input', handler)
    }
  }, [loaded, onChange])

  useEffect(() => {
    if (ref.current && ref.current.value !== value) {
      ref.current.setValue(value, { suppressChangeNotifications: true })
    }
  }, [value, loaded])

  if (error) {
    return <div className="text-red-500 text-sm">فشل تحميل لوحة الرياضيات. يرجى التحقق من اتصال الإنترنت.</div>
  }

  if (!loaded) {
    return (
      <div className={`p-4 bg-slate-100 rounded-xl animate-pulse flex items-center gap-2 text-muted-foreground ${className}`}>
        <Calculator className="w-5 h-5" /> جاري تحميل لوحة المعادلات...
      </div>
    )
  }

  return (
    <div dir="ltr" className="w-full">
      {React.createElement('math-field', {
        ref,
        class: `w-full px-4 py-3 border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all bg-white min-h-[50px] shadow-sm ${className}`,
        style: { fontSize: '1.25rem', fontFamily: 'math' },
      }, value)}
    </div>
  )
}
