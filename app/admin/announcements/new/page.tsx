'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncementAction } from '../actions'
import {
  Megaphone,
  ArrowRight,
  Save,
  Loader2,
  Link2,
  Image,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    imageUrl: '',
    isActive: true,
    displayOrder: 0,
  })

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
      const res = await createAnnouncementAction({
        title: formData.title,
        body: formData.body,
        ctaLabel: formData.ctaLabel || null,
        ctaUrl: formData.ctaUrl || null,
        imageUrl: formData.imageUrl || null,
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder),
      })

      if (res.success) {
        toast.success('تم إنشاء الإعلان بنجاح!')
        router.push('/admin/announcements')
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الإعلان')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="mx-auto max-w-3xl animate-fade-in space-y-6 text-right"
      dir="rtl"
    >
      {/* Breadcrumb / Top Row */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/announcements"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100"
            title="رجوع"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-800">إعلان جديد</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              إضافة إعلان منصة جديد وتوجيهه للمستهدفين.
            </p>
          </div>
        </div>
        <Megaphone className="h-8 w-8 text-primary/30" />
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8"
      >
        {/* Title */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-bold text-slate-700"
          >
            عنوان الإعلان <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="مثال: احصل على خصم 50% على باقة VIP المميزة 🚀"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none"
            required
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label
            htmlFor="body"
            className="block text-sm font-bold text-slate-700"
          >
            محتوى الإعلان (الوصف) <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="اكتب وصف الإعلان وتفاصيله هنا..."
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none"
            required
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* CTA Label */}
          <div className="space-y-2">
            <label
              htmlFor="ctaLabel"
              className="block flex items-center gap-1.5 text-sm font-bold text-slate-700"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              نص زر الإجراء (CTA Label)
            </label>
            <input
              type="text"
              id="ctaLabel"
              value={formData.ctaLabel}
              onChange={(e) =>
                setFormData({ ...formData, ctaLabel: e.target.value })
              }
              placeholder="مثال: اشترك الآن"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          {/* CTA URL */}
          <div className="space-y-2">
            <label
              htmlFor="ctaUrl"
              className="block flex items-center gap-1.5 text-sm font-bold text-slate-700"
            >
              <Link2 className="h-4 w-4 text-indigo-500" />
              رابط زر الإجراء (CTA URL)
            </label>
            <input
              type="text"
              id="ctaUrl"
              value={formData.ctaUrl}
              onChange={(e) =>
                setFormData({ ...formData, ctaUrl: e.target.value })
              }
              placeholder="مثال: /student/premium"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition-colors focus:border-primary focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image URL */}
          <div className="space-y-2">
            <label
              htmlFor="imageUrl"
              className="block flex items-center gap-1.5 text-sm font-bold text-slate-700"
            >
              <Image className="h-4 w-4 text-emerald-500" />
              رابط صورة الإعلان (اختياري)
            </label>
            <input
              type="text"
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              placeholder="مثال: https://example.com/ad.jpg"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition-colors focus:border-primary focus:outline-none"
              dir="ltr"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <label
              htmlFor="displayOrder"
              className="block text-sm font-bold text-slate-700"
            >
              ترتيب العرض
            </label>
            <input
              type="number"
              id="displayOrder"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayOrder: Number(e.target.value),
                })
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none"
              min={0}
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="isActive"
            className="cursor-pointer text-sm font-bold text-slate-700"
          >
            تفعيل الإعلان ونشره فوراً للطلاب المنتسبين للمجموعات
          </label>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري إنشاء الإعلان...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              حفظ ونشر الإعلان
            </>
          )}
        </button>
      </form>
    </div>
  )
}
