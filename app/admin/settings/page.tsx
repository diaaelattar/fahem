'use client'

// app/admin/settings/page.tsx
// إعدادات المنصة، الذكاء الاصطناعي، والملف الشخصي

import { useState, useEffect } from 'react'
import {
  User,
  Settings,
  Sparkles,
  Save,
  CheckCircle,
  Upload,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'platform' | 'ai'>(
    'platform'
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // بيانات افتراضية للنموذج (في التطبيق الحقيقي تجلب من Supabase)
  const [formData, setFormData] = useState({
    // Profile
    fullName: 'مدير النظام',
    email: 'admin@istabaq.com',
    // Platform
    platformName: 'استباق مصر',
    contactEmail: 'support@istabaq.com',
    primaryColor: '#1B4F72',
    allowStudentRegistration: true,
    enableExamLimit: true,
    freeExamLimit: 3,
    // AI
    aiProvider: 'gemini',
    defaultQuestionCount: 5,
    defaultDifficulty: 'medium',
  })

  const supabase = createClient()

  useEffect(() => {
    async function loadSettings() {
      // 1. جلب إعدادات التقييد من قاعدة البيانات
      const { data: sysSettings } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single()
      if (sysSettings) {
        setFormData((prev) => ({
          ...prev,
          enableExamLimit: sysSettings.enable_exam_limit,
          freeExamLimit: sysSettings.free_exam_limit,
        }))
      }

      // 2. جلب بيانات المدير الحالي
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()
        if (profile) {
          setFormData((prev) => ({
            ...prev,
            fullName: profile.full_name || 'مدير النظام',
            email: profile.email || user.email || 'admin@istabaq.com',
          }))
        }
      }
    }
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // حفظ إعدادات النظام في Supabase
    await supabase.from('system_settings').upsert({
      id: 1,
      enable_exam_limit: formData.enableExamLimit,
      free_exam_limit: formData.freeExamLimit,
      updated_at: new Date().toISOString(),
    })

    // (باقي الإعدادات الوهمية يمكن ربطها لاحقاً إذا أردت)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const TABS = [
    { id: 'platform', label: 'المنصة', icon: Settings },
    { id: 'ai', label: 'الذكاء الاصطناعي', icon: Sparkles },
    { id: 'profile', label: 'حسابي', icon: User },
  ] as const

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات العامة</h1>
        <p className="mt-0.5 text-muted-foreground">
          إدارة تفضيلات المنصة وحسابك الشخصي
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-4">
        {/* التبويبات */}
        <div className="space-y-1 rounded-2xl border border-border bg-white p-2 md:col-span-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* النماذج */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:col-span-3 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* إعدادات المنصة */}
            {activeTab === 'platform' && (
              <div className="animate-fade-in space-y-6">
                <h2 className="border-b border-border pb-4 text-xl font-bold">
                  إعدادات المنصة الأساسية
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اسم المنصة</label>
                    <input
                      type="text"
                      value={formData.platformName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          platformName: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      البريد الإلكتروني للدعم
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactEmail: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.allowStudentRegistration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            allowStudentRegistration: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded text-primary"
                      />
                      <span className="text-sm font-medium">
                        السماح بتسجيل الطلاب بأنفسهم (Self-Registration)
                      </span>
                    </label>
                    <p className="pr-8 text-xs text-muted-foreground">
                      إذا تم التعطيل، يمكن للمديرين فقط إضافة الطلاب.
                    </p>
                  </div>

                  {/* إعدادات الاشتراكات (Premium) */}
                  <div className="mt-6 space-y-4 border-t border-border pt-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <Star className="h-5 w-5 text-amber-500" />
                      نظام الاشتراكات والحد الأقصى (Premium)
                    </h3>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <input
                        type="checkbox"
                        checked={formData.enableExamLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enableExamLimit: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded text-amber-600"
                      />
                      <div>
                        <span className="block text-sm font-bold text-amber-900">
                          تفعيل تقييد الاختبارات اليومية للحسابات المجانية
                        </span>
                        <span className="text-xs text-amber-700">
                          عند تفعيل هذا الخيار، سيتم تقييد الطلاب العاديين،
                          بينما الطلاب المشتركين (VIP) يمكنهم إجراء اختبارات بلا
                          حدود.
                        </span>
                      </div>
                    </label>

                    {formData.enableExamLimit && (
                      <div className="space-y-2 pr-2">
                        <label className="text-sm font-medium">
                          الحد الأقصى اليومي للاختبارات (لكل مادة) للحساب
                          المجاني
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={formData.freeExamLimit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              freeExamLimit: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full max-w-xs rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <p className="text-xs text-muted-foreground">
                          افتراضياً 3 اختبارات في اليوم لكل مادة للحفاظ على
                          الباقات.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* إعدادات الذكاء الاصطناعي */}
            {activeTab === 'ai' && (
              <div className="animate-fade-in space-y-6">
                <h2 className="flex items-center gap-2 border-b border-border pb-4 text-xl font-bold">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  محرك توليد الأسئلة
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      المزود (AI Provider)
                    </label>
                    <select
                      value={formData.aiProvider}
                      onChange={(e) =>
                        setFormData({ ...formData, aiProvider: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="gemini">
                        Google Gemini Pro (الأساسي)
                      </option>
                      <option value="openai">OpenAI GPT-4o</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        عدد الأسئلة الافتراضي (لكل عملية توليد)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.defaultQuestionCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultQuestionCount: parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        الصعوبة الافتراضية
                      </label>
                      <select
                        value={formData.defaultDifficulty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultDifficulty: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="easy">التركيز على السهل</option>
                        <option value="medium">توزيع متوازن (متوسط)</option>
                        <option value="hard">التركيز على الصعب</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* حسابي */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in space-y-6">
                <h2 className="border-b border-border pb-4 text-xl font-bold">
                  الملف الشخصي
                </h2>

                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                    {formData.fullName.charAt(0)}
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" /> تغيير الصورة
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الاسم الكامل</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      البريد الإلكتروني للإدارة
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/50 px-4 py-2.5 outline-none"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      لا يمكن تغيير بريد الإدارة الرئيسي من هنا.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* أزرار الحفظ المشتركة */}
            <div className="flex justify-end border-t border-border pt-6">
              <button
                type="submit"
                disabled={saving}
                className={`flex min-w-[140px] items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-white shadow-md hover:bg-primary/90'
                } disabled:opacity-50`}
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{' '}
                    جاري الحفظ...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> تم الحفظ
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> حفظ التعديلات
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
