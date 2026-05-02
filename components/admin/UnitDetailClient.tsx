'use client'
// components/admin/UnitDetailClient.tsx
// زر إضافة درس مع modal

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UnitDetailClient({ unitId }: { unitId: number }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name_ar: '', sort_order: '1', duration_minutes: '45', objectives: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient() as any
  const router = useRouter()

  const handleSave = async () => {
    if (!form.name_ar.trim()) { setError('اسم الدرس مطلوب'); return }
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
    if (err) { setError(err.message); setLoading(false); return }
    setOpen(false)
    setForm({ name_ar: '', sort_order: '1', duration_minutes: '45', objectives: '' })
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
        <Plus className="w-4 h-4" /> إضافة درس
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">إضافة درس جديد</h2>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">❌ {error}</div>}

              <div>
                <label className="block text-sm font-bold mb-2">اسم الدرس *</label>
                <input type="text" value={form.name_ar}
                  onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                  placeholder="مثال: الدرس الأول — الاستماع والفهم"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                  autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">الترتيب</label>
                  <input type="number" min="1" value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">المدة (دقيقة)</label>
                  <input type="number" min="10" value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">أهداف الدرس (اختياري)</label>
                <textarea value={form.objectives}
                  onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))}
                  placeholder="ما الذي يتعلمه الطالب من هذا الدرس؟"
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary resize-none transition-colors" />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={handleSave} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? 'جاري الحفظ...' : 'حفظ الدرس'}
              </button>
              <button onClick={() => setOpen(false)} className="px-6 border border-border rounded-xl font-medium hover:bg-muted transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
