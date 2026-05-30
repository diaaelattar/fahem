'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Settings,
  School,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface SchoolSettingsClientProps {
  school: any
}

export function SchoolSettingsClient({ school }: SchoolSettingsClientProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // حقول الإعدادات
  const [name, setName] = useState(school?.name || '')
  const [type, setType] = useState(school?.type || 'private')
  const [stage, setStage] = useState(school?.stage || 'all')
  const [governorate, setGovernorate] = useState(school?.governorate || '')
  const [district, setDistrict] = useState(school?.district || '')
  const [logoUrl, setLogoUrl] = useState(school?.logo_url || '')

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('schools')
        .update({
          name,
          type,
          stage,
          governorate,
          district,
          logo_url: logoUrl
        })
        .eq('id', school.id)

      if (updateError) throw new Error(updateError.message)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإعدادات.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الترويسة */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white">إعدادات المدرسة العامة</h2>
        <p className="text-xs text-slate-400 mt-1">تحديث الهوية والمعلومات الجغرافية للمؤسسة التعليمية.</p>
      </div>

      <div className="max-w-2xl mx-auto rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-900 pb-5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-800"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center">
                <School className="h-7 w-7 text-cyan-400" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white">شعار المؤسسة التعليمية</h3>
              <p className="text-xs text-slate-500 mt-1">تحديد رابط الصورة لشعار المدرسة لعرضه في الترويسات واللوحة.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                اسم المدرسة بالكامل
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مدرسة الأوائل الخاصة"
                className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                نوع المدرسة
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950/80 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="public">حكومي (Public)</option>
                <option value="private">خاص (Private)</option>
                <option value="language">تجريبي/لغات (Language)</option>
                <option value="azhar">أزهري (Azhar)</option>
                <option value="technical">فني (Technical)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                المرحلة الدراسية المشمولة
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-slate-950/80 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="primary">ابتدائي فقط</option>
                <option value="preparatory">إعدادي فقط</option>
                <option value="secondary">ثانوي فقط</option>
                <option value="all">كل المراحل</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                المحافظة
              </label>
              <input
                type="text"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                required
                placeholder="القاهرة"
                className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                الإدارة التعليمية (المنطقة)
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="إدارة مصر الجديدة"
                className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                رابط شعار المدرسة (Logo URL)
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-3.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>تم حفظ وتحديث الإعدادات بنجاح.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                حفظ الإعدادات والتعديلات
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
