import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, ArrowRight, BookOpen, Lock, Trash2, Mail, Clock, Database } from 'lucide-react'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | استبق - مصر ( فاهم )',
  description: 'سياسة الخصوصية وحماية البيانات الشخصية لمنصة استبق - مصر ( فاهم ) وفقاً لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020.',
}

const sections = [
  {
    icon: Database,
    title: 'البيانات التي نجمعها',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-900/30',
    bgColor: 'from-cyan-950/20',
    items: [
      'الاسم الكامل والبريد الإلكتروني لدى التسجيل',
      'بيانات الصف الدراسي والمرحلة التعليمية للطلاب',
      'نتائج الاختبارات ودرجات الأسئلة',
      'سجلات استخدام المنصة (الصفحات المزارة، الأجهزة المستخدمة)',
      'المحتوى التعليمي المرفوع من المعلمين (مستندات، فيديوهات)',
    ],
  },
  {
    icon: BookOpen,
    title: 'كيف نستخدم بياناتك',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-900/30',
    bgColor: 'from-indigo-950/20',
    items: [
      'تقديم الخدمة التعليمية وتخصيص تجربة التعلم',
      'توليد الاختبارات التفاعلية بالذكاء الاصطناعي',
      'إرسال تقارير الأداء للمعلمين ومديري المدارس',
      'تحسين جودة المنصة وتطوير ميزاتها',
      'الامتثال للمتطلبات القانونية والتنظيمية',
    ],
  },
  {
    icon: Shield,
    title: 'حماية البيانات والأمان',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-900/30',
    bgColor: 'from-emerald-950/20',
    items: [
      'تشفير كامل للبيانات أثناء النقل والتخزين (TLS 1.3 + AES-256)',
      'سياسات Row Level Security (RLS) تمنع أي وصول مشترك بين المدارس',
      'تسجيل شامل لجميع العمليات الحساسة (Audit Logs)',
      'انتهاء جلسات مديري المدارس تلقائياً بعد 30 دقيقة من الخمول',
      'نسخ احتياطية يومية مشفرة على البنية التحتية لـ Supabase',
    ],
  },
  {
    icon: Clock,
    title: 'مدة الاحتفاظ بالبيانات',
    color: 'text-amber-400',
    borderColor: 'border-amber-900/30',
    bgColor: 'from-amber-950/20',
    items: [
      'السجلات الأكاديمية (نتائج الاختبارات): 5 سنوات من انتهاء الاشتراك',
      'سجلات التدقيق الأمني (Audit Logs): سنة واحدة',
      'بيانات الجلسات والنشاط: 90 يوماً',
      'المحتوى التعليمي المرفوع: طوال مدة الاشتراك + 3 أشهر',
      'بيانات الطلاب المحذوفة: تُحذف فوراً من جميع الأنظمة',
    ],
  },
  {
    icon: Lock,
    title: 'حقوقك كمستخدم',
    color: 'text-violet-400',
    borderColor: 'border-violet-900/30',
    bgColor: 'from-violet-950/20',
    items: [
      '🔍 حق الوصول: طلب نسخة من بياناتك الشخصية المخزنة',
      '✏️ حق التصحيح: تحديث بياناتك غير الدقيقة في أي وقت',
      '🗑️ حق الحذف: طلب حذف حسابك وجميع بياناته نهائياً',
      '📦 حق نقل البيانات: استلام بياناتك بصيغة CSV قابلة للنقل',
      '🚫 حق الاعتراض: رفض معالجة بياناتك لأغراض التسويق',
    ],
  },
  {
    icon: Trash2,
    title: 'مشاركة البيانات مع أطراف ثالثة',
    color: 'text-rose-400',
    borderColor: 'border-rose-900/30',
    bgColor: 'from-rose-950/20',
    items: [
      'لا نبيع بياناتك الشخصية لأي طرف ثالث',
      'OpenAI (GPT-4o) — لتوليد الأسئلة فقط، بدون تخزين دائم',
      'Supabase — مزود البنية التحتية (بيانات مشفرة)',
      'Vercel — منصة الاستضافة (بدون وصول للمحتوى)',
      'مشاركة البيانات مع الجهات الحكومية عند الطلب القانوني فقط',
    ],
  },
]

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date('2026-06-11').toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-indigo-950/20" aria-hidden="true" />
        <div className="absolute top-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" aria-hidden="true" />
        
        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-8"
            aria-label="العودة للصفحة الرئيسية"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            العودة للرئيسية
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-cyan-950/60 border border-cyan-800/40 rounded-2xl flex items-center justify-center">
              <Shield className="h-7 w-7 text-cyan-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                سياسة الخصوصية
              </h1>
              <p className="text-slate-400 text-sm mt-1">وحماية البيانات الشخصية</p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed max-w-2xl text-sm md:text-base">
            نلتزم في منصة <span className="text-cyan-400 font-bold">استبق - مصر ( فاهم )</span> بحماية خصوصية جميع مستخدمينا من طلاب ومعلمين ومديري مدارس. 
            تُطبَّق هذه السياسة وفقاً لـ
            <span className="text-white font-semibold"> قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020</span>
            {' '}واللائحة الأوروبية لحماية البيانات (GDPR).
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              آخر تحديث: {lastUpdated}
            </span>
            <span className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-3 py-1.5 rounded-full">
              ✓ متوافق مع القانون المصري 151/2020
            </span>
            <span className="text-xs text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-3 py-1.5 rounded-full">
              ✓ متوافق مع GDPR
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <section
              key={section.title}
              className={`rounded-2xl border ${section.borderColor} bg-gradient-to-br ${section.bgColor} to-slate-950/20 p-6 md:p-8`}
              aria-labelledby={`section-${section.title}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-center ${section.color}`}>
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <h2 id={`section-${section.title}`} className={`text-lg font-bold ${section.color}`}>
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3" role="list">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                    <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${section.color.replace('text-', 'bg-')}`} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        {/* Cookies */}
        <section className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 md:p-8" aria-labelledby="section-cookies">
          <h2 id="section-cookies" className="text-lg font-bold text-white mb-4">ملفات تعريف الارتباط (Cookies)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right" role="table" aria-label="جدول ملفات تعريف الارتباط">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="py-2 pl-4 font-semibold" scope="col">الاسم</th>
                  <th className="py-2 pl-4 font-semibold" scope="col">الغرض</th>
                  <th className="py-2 font-semibold" scope="col">المدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-slate-300">
                {[
                  { name: 'sb-*', purpose: 'جلسة المستخدم (Supabase Auth)', duration: 'جلسة المتصفح' },
                  { name: 'school_last_activity', purpose: 'تتبع آخر نشاط لمدير المدرسة (Session Timeout)', duration: '30 دقيقة' },
                  { name: '_vercel_jwt', purpose: 'التحقق من الاستضافة (Vercel)', duration: '24 ساعة' },
                ].map((row) => (
                  <tr key={row.name}>
                    <td className="py-3 pl-4 font-mono text-xs text-cyan-400">{row.name}</td>
                    <td className="py-3 pl-4 text-xs">{row.purpose}</td>
                    <td className="py-3 text-xs text-slate-500">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5" aria-labelledby="section-contact">
          <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-cyan-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="section-contact" className="text-base font-bold text-white mb-1">تواصل مع مسؤول حماية البيانات</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              لممارسة أي من حقوقك المذكورة أعلاه أو لأي استفسار يخص خصوصيتك، يُرجى التواصل معنا عبر:
            </p>
            <a
              href="mailto:privacy@istabaq.com"
              className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              aria-label="إرسال بريد إلكتروني لمسؤول الخصوصية"
            >
              privacy@istabaq.com
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="text-xs text-slate-600 text-left">
            <p>نلتزم بالرد</p>
            <p className="font-bold text-slate-500">خلال 72 ساعة</p>
          </div>
        </section>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 pb-6">
          تحتفظ منصة فاهم بحق تعديل سياسة الخصوصية هذه. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني قبل 30 يوماً من التطبيق.
        </p>
      </main>
    </div>
  )
}
