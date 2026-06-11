'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Save, Loader2, RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { toast } from 'sonner'

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
        body: JSON.stringify({ lessonId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل توليد الملخص')
      setSummary(data.summary)
      toast.success('تم توليد الملخص بنجاح!')
    } catch (err: any) {
      toast.error(err.message)
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
      toast.success('تم حفظ الملخص بنجاح')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-blue-900">
          <Sparkles className="h-5 w-5 text-blue-600" />
          الملخص الذكي للدرس
        </h3>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : summary ? (
            <RefreshCcw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {summary
            ? 'إعادة التوليد بالذكاء الاصطناعي'
            : 'توليد بالذكاء الاصطناعي'}
        </button>
      </div>

      <div className="space-y-3">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="سيظهر الملخص الذكي هنا، أو يمكنك كتابة الملخص يدوياً..."
          rows={6}
          dir="rtl"
          className="w-full rounded-xl border border-blue-200 p-4 font-mono text-sm leading-relaxed focus:border-blue-500 focus:outline-none"
        />

        {summary !== initialSummary && (
          <div className="flex justify-end">
            <button
              onClick={saveSummary}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ الملخص
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
