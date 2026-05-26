'use client'
// components/admin/UnitDetailClient.tsx
// زر إضافة درس مع modal

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UnitDetailClient({ unitId }: { unitId: number }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name_ar: '',
    sort_order: '1',
    duration_minutes: '45',
    objectives: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient() as any
  const router = useRouter()

  const handleSave = async () => {
    if (!form.name_ar.trim()) {
      setError('اسم الدرس مطلوب')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('lessons').insert({
      name_ar: form.name_ar.trim(),
      unit_id: unitId,
      sort_order: parseInt(form.sort_order) || 1,
      duration_minutes: parseInt(form.duration_minutes) || 45,
      objectives: form.objectives.trim() || null,
      is_active: true,
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setOpen(false)
    setForm({
      name_ar: '',
      sort_order: '1',
      duration_minutes: '45',
      objectives: '',
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> إضافة درس
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-fade-in rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="text-xl font-bold">إضافة درس جديد</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  ❌ {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  اسم الدرس *
                </label>
                <input
                  type="text"
                  value={form.name_ar}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name_ar: e.target.value }))
                  }
                  placeholder="مثال: الدرس الأول — الاستماع والفهم"
                  className="w-full rounded-xl border-2 border-border px-4 py-3 transition-colors focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sort_order: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-border px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    المدة (دقيقة)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        duration_minutes: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-border px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  أهداف الدرس (اختياري)
                </label>
                <textarea
                  value={form.objectives}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, objectives: e.target.value }))
                  }
                  placeholder="ما الذي يتعلمه الطالب من هذا الدرس؟"
                  rows={2}
                  className="w-full resize-none rounded-xl border-2 border-border px-4 py-3 transition-colors focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-border p-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'جاري الحفظ...' : 'حفظ الدرس'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-6 font-medium transition-colors hover:bg-muted"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
