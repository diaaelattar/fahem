'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Save, Loader2, RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  lessonId: number
  initialSummary?: string | null
}

export function GenerateSummaryClient({ lessonId, initialSummary }: Props) {
  const [summary, setSummary] = useState(initialSummary || '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient() as any
  const router = useRouter()

  const generateSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل توليد الملخص')
      setSummary(data.summary)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveSummary = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ summary })
        .eq('id', lessonId)
      if (error) throw error
      alert('تم حفظ الملخص بنجاح')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-blue-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          الملخص الذكي للدرس
        </h3>
        <button 
          onClick={generateSummary} 
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (summary ? <RefreshCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
          {summary ? 'إعادة التوليد بالذكاء الاصطناعي' : 'توليد بالذكاء الاصطناعي'}
        </button>
      </div>

      <div className="space-y-3">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="سيظهر الملخص الذكي هنا، أو يمكنك كتابة الملخص يدوياً..."
          rows={6}
          dir="rtl"
          className="w-full p-4 rounded-xl border border-blue-200 focus:outline-none focus:border-blue-500 font-mono text-sm leading-relaxed"
        />
        
        {summary !== initialSummary && (
          <div className="flex justify-end">
            <button
              onClick={saveSummary}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الملخص
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
