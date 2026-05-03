import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Brain, Swords, Trophy, Zap, BookOpen,
  TrendingUp, Star, Users, CheckCircle, ArrowLeft, Flame
} from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const profile = profileRaw as any
    if (profile?.role === 'admin') redirect('/admin/dashboard')
    if (profile?.role === 'student') redirect('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-md shadow-primary/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-primary">استباق مصر</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/admin-login"
              className="hidden sm:block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              دخول المعلمين
            </Link>
            <Link href="/auth/login"
              className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2">
              ابدأ مجاناً
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-hero-pattern pt-28 pb-20 px-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>مخصص للمرحلة الإعدادية المصرية</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black leading-tight mb-6 text-balance">
            تدرّب، تحدَّ،
            <br />
            <span className="text-yellow-300">وتفوّق في لغتك العربية</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            منصة تعليمية ذكية مجانية بالكامل. أسئلة مكيّفة بالذكاء الاصطناعي،
            تحديات مباشرة مع زملائك، ولوحة شرف وطنية.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 inline-flex items-center gap-2 shadow-xl shadow-yellow-400/30">
              ابدأ الآن — مجاناً!
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <a href="#features"
              className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all">
              اكتشف المميزات
            </a>
          </div>

          {/* Stats */}
          <div className="max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '٣', label: 'صفوف إعدادية' },
              { value: '٨+', label: 'وحدة عربية' },
              { value: '١٠٠٪', label: 'مجاني تماماً' },
              { value: 'AI', label: 'أسئلة ذكية' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black text-yellow-300 mb-1">{s.value}</div>
                <div className="text-xs text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              لماذا استباق مصر؟
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              ليس مجرد اختبارات — بل منظومة تعليمية متكاملة تجعل الدراسة ممتعة وتنافسية
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Swords,
                title: 'تحديات 1 vs 1 مباشرة',
                description: 'تحدَّ زميلك في أسئلة اللغة العربية. ١٠ أسئلة، ١٥ ثانية لكل سؤال، والفوز يجلب نقاط XP!',
                color: 'text-rose-600 bg-rose-50',
                border: 'hover:border-rose-200',
              },
              {
                icon: Trophy,
                title: 'لوحة الشرف الوطنية',
                description: 'ترتيب أسبوعي على مستوى الجمهورية. تنافس مع آلاف الطلاب وأثبت أنك الأفضل!',
                color: 'text-amber-600 bg-amber-50',
                border: 'hover:border-amber-200',
              },
              {
                icon: Brain,
                title: 'أسئلة بالذكاء الاصطناعي',
                description: 'محرك Gemini AI يولّد أسئلة من كتب المنهج المصري الرسمي بكل أنواع التفكير.',
                color: 'text-blue-600 bg-blue-50',
                border: 'hover:border-blue-200',
              },
              {
                icon: TrendingUp,
                title: 'تتبع تقدمك بدقة',
                description: 'تقارير تفصيلية توضح نقاط قوتك وضعفك في كل وحدة من وحدات المنهج.',
                color: 'text-emerald-600 bg-emerald-50',
                border: 'hover:border-emerald-200',
              },
              {
                icon: Star,
                title: 'نظام XP والمستويات',
                description: 'اكسب نقاط كل ما أجبت صح أو فزت بتحدي، وارتقِ من مبتدئ حتى ملك!',
                color: 'text-violet-600 bg-violet-50',
                border: 'hover:border-violet-200',
              },
              {
                icon: BookOpen,
                title: 'محتوى المنهج الرسمي',
                description: 'وحدات منظمة بحسب المنهج المصري الحكومي للصفوف الإعدادية الثلاثة.',
                color: 'text-teal-600 bg-teal-50',
                border: 'hover:border-teal-200',
              },
            ].map(f => (
              <div key={f.title}
                className={`p-6 rounded-2xl border border-border ${f.border} card-hover group transition-all`}>
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-bold mb-3">ابدأ في ٣ خطوات</h2>
            <p className="text-muted-foreground">بدون تسجيل معقد — جوجل وخلصت!</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '١', icon: '🔑', title: 'سجّل بجوجل', desc: 'تسجيل في ثانية واحدة بحسابك على Google' },
              { step: '٢', icon: '📚', title: 'اختر صفك', desc: 'اختر صفك الدراسي وتبدأ على طول' },
              { step: '٣', icon: '⚔️', title: 'تدرّب وتحدَّ', desc: 'ادرس، تحدى زملاءك، واصعد لوحة الشرف' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-primary/20">
                  {s.icon}
                </div>
                <div className="text-xs font-black text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-3">
                  الخطوة {s.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-white border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-6">المادة المتاحة الآن</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['📖 اللغة العربية', '📐 الرياضيات', '🔬 العلوم', '🌍 الدراسات', '🇬🇧 اللغة الإنجليزية', '💻 الحاسب الآلي'].map(s => (
              <div key={s} className="flex items-center gap-2 bg-muted/50 rounded-full px-5 py-2.5 text-sm font-bold border border-border">
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-hero-pattern text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-5xl mb-4 animate-bounce">🏆</div>
          <h2 className="text-3xl sm:text-4xl font-display font-black mb-4">
            جاهز تتصدر لوحة الشرف؟
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            انضم لآلاف الطلاب المصريين — مجاني تماماً، لا بطاقة ائتمان
          </p>
          <Link href="/auth/login"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black px-10 py-4 rounded-2xl text-xl transition-all hover:scale-105 inline-flex items-center gap-3 shadow-xl shadow-yellow-400/30">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            سجّل بـ Google — مجاناً
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-yellow-400" />
          <span className="font-display font-bold text-white text-lg">استباق مصر</span>
        </div>
        <p className="text-sm mb-4">منصة تعليمية مجانية للمرحلة الإعدادية المصرية</p>
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <Link href="/auth/login" className="hover:text-white transition-colors">دخول الطلاب</Link>
          <Link href="/auth/admin-login" className="hover:text-white transition-colors">دخول المعلمين</Link>
        </div>
        <p className="text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} استباق مصر — جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}
