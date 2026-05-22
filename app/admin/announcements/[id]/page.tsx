'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateAnnouncementAction, deleteAnnouncementAction } from '../actions'
import { Megaphone, ArrowRight, Save, Trash2, Loader2, Link2, Image, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditAnnouncementPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    imageUrl: '',
    isActive: true,
    displayOrder: 0
  })

  useEffect(() => {
    async function loadAnnouncement() {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from('platform_announcements')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          setFormData({
            title: data.title,
            body: data.body,
            ctaLabel: data.cta_label || '',
            ctaUrl: data.cta_url || '',
            imageUrl: data.image_url || '',
            isActive: data.is_active ?? true,
            displayOrder: data.display_order ?? 0
          })
        }
      } catch (err: any) {
        toast.error('خطأ في تحميل بيانات الإعلان')
        console.error(err)
      } finally {
        setFetching(false)
      }
    }

    loadAnnouncement()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان الإعلان')
      return
    }
    if (!formData.body.trim()) {
      toast.error('يرجى إدخال محتوى الإعلان')
      return
    }

    setLoading(true)
    try {
      const res = await updateAnnouncementAction(id as string, {
        title: formData.title,
        body: formData.body,
        ctaLabel: formData.ctaLabel || null,
        ctaUrl: formData.ctaUrl || null,
        imageUrl: formData.imageUrl || null,
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder)
      })

      if (res.success) {
        toast.success('تم تحديث الإعلان بنجاح!')
        router.push('/admin/announcements')
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحديث الإعلان')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟')) return

    setDeleting(true)
    try {
      const res = await deleteAnnouncementAction(id as string)
      if (res.success) {
        toast.success('تم حذف الإعلان بنجاح')
        router.push('/admin/announcements')
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حذف الإعلان')
    } finally {
      setDeleting(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right animate-fade-in" dir="rtl">
      {/* Breadcrumb / Top Row */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/announcements"
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-800">تعديل الإعلان</h1>
            <p className="text-xs text-slate-500 mt-0.5">تعديل محتوى إعلان المنصة وتفاصيل الإجراء.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-3 rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 text-sm"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          حذف الإعلان
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-bold text-slate-700">
            عنوان الإعلان <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: احصل على خصم 50% على باقة VIP المميزة 🚀"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary transition-colors text-sm"
            required
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label htmlFor="body" className="block text-sm font-bold text-slate-700">
            محتوى الإعلان (الوصف) <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="اكتب وصف الإعلان وتفاصيله هنا..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary transition-colors text-sm resize-none"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* CTA Label */}
          <div className="space-y-2">
            <label htmlFor="ctaLabel" className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              نص زر الإجراء (CTA Label)
            </label>
            <input
              type="text"
              id="ctaLabel"
              value={formData.ctaLabel}
              onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
              placeholder="مثال: اشترك الآن"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* CTA URL */}
          <div className="space-y-2">
            <label htmlFor="ctaUrl" className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-500" />
              رابط زر الإجراء (CTA URL)
            </label>
            <input
              type="text"
              id="ctaUrl"
              value={formData.ctaUrl}
              onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
              placeholder="مثال: /student/premium"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary transition-colors text-sm text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image URL */}
          <div className="space-y-2">
            <label htmlFor="imageUrl" className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-emerald-500" />
              رابط صورة الإعلان (اختياري)
            </label>
            <input
              type="text"
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="مثال: https://example.com/ad.jpg"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary transition-colors text-sm text-left"
              dir="ltr"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <label htmlFor="displayOrder" className="block text-sm font-bold text-slate-700">
              ترتيب العرض
            </label>
            <input
              type="number"
              id="displayOrder"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary transition-colors text-sm"
              min={0}
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-primary rounded focus:ring-primary border-slate-300"
          />
          <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
            تفعيل الإعلان ونشره للطلاب المنتسبين للمجموعات
          </label>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-base shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري حفظ التعديلات...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              حفظ التعديلات
            </>
          )}
        </button>
      </form>
    </div>
  )
}
