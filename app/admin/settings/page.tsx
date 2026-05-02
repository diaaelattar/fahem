'use client'

// app/admin/settings/page.tsx
// إعدادات المنصة، الذكاء الاصطناعي، والملف الشخصي

import { useState } from 'react'
import { User, Settings, Sparkles, Save, CheckCircle, Upload } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'platform' | 'ai'>('platform')
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
    allowStudentRegistration: false,
    // AI
    aiProvider: 'gemini',
    defaultQuestionCount: 5,
    defaultDifficulty: 'medium',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // هنا يجب إضافة كود التحديث الفعلي عبر Supabase
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const TABS = [
    { id: 'platform', label: 'المنصة', icon: Settings },
    { id: 'ai', label: 'الذكاء الاصطناعي', icon: Sparkles },
    { id: 'profile', label: 'حسابي', icon: User },
  ] as const

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات العامة</h1>
        <p className="text-muted-foreground mt-0.5">إدارة تفضيلات المنصة وحسابك الشخصي</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 items-start">
        {/* التبويبات */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-border p-2 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* النماذج */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* إعدادات المنصة */}
            {activeTab === 'platform' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold border-b border-border pb-4">إعدادات المنصة الأساسية</h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اسم المنصة</label>
                    <input
                      type="text"
                      value={formData.platformName}
                      onChange={e => setFormData({ ...formData, platformName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">البريد الإلكتروني للدعم</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowStudentRegistration}
                        onChange={e => setFormData({ ...formData, allowStudentRegistration: e.target.checked })}
                        className="w-5 h-5 text-primary rounded"
                      />
                      <span className="text-sm font-medium">السماح بتسجيل الطلاب بأنفسهم (Self-Registration)</span>
                    </label>
                    <p className="text-xs text-muted-foreground pr-8">
                      إذا تم التعطيل، يمكن للمديرين فقط إضافة الطلاب.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* إعدادات الذكاء الاصطناعي */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  محرك توليد الأسئلة
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">المزود (AI Provider)</label>
                    <select
                      value={formData.aiProvider}
                      onChange={e => setFormData({ ...formData, aiProvider: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30"
                    >
                      <option value="gemini">Google Gemini Pro (الأساسي)</option>
                      <option value="openai">OpenAI GPT-4o</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">عدد الأسئلة الافتراضي (لكل عملية توليد)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.defaultQuestionCount}
                        onChange={e => setFormData({ ...formData, defaultQuestionCount: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">الصعوبة الافتراضية</label>
                      <select
                        value={formData.defaultDifficulty}
                        onChange={e => setFormData({ ...formData, defaultDifficulty: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
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
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold border-b border-border pb-4">الملف الشخصي</h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold">
                    {formData.fullName.charAt(0)}
                  </div>
                  <button type="button" className="flex items-center gap-2 border border-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted">
                    <Upload className="w-4 h-4" /> تغيير الصورة
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الاسم الكامل</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">البريد الإلكتروني للإدارة</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 cursor-not-allowed outline-none"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">لا يمكن تغيير بريد الإدارة الرئيسي من هنا.</p>
                  </div>
                </div>
              </div>
            )}

            {/* أزرار الحفظ المشتركة */}
            <div className="pt-6 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`min-w-[140px] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90 shadow-md'
                } disabled:opacity-50`}
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
                ) : saved ? (
                  <><CheckCircle className="w-4 h-4" /> تم الحفظ</>
                ) : (
                  <><Save className="w-4 h-4" /> حفظ التعديلات</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
