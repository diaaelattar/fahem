import Link from 'next/link'
import {
  Brain, Swords, Trophy, Zap, BookOpen,
  TrendingUp, Star, Users, CheckCircle, ArrowLeft, Flame
} from 'lucide-react'

export default function HomePage() {

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="استباق مصر فاهم" className="w-12 h-12 object-contain" />
            <span className="font-display font-bold text-xl text-primary">استباق مصر</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="hidden sm:block px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              بوابة المعلمين
            </Link>
            <Link href="/auth/register"
              className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2">
              إنشاء حساب
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
            المنصة التعليمية الأذكى في مصر! أسئلة مكيّفة بالذكاء الاصطناعي للطلاب،
            وأدوات متقدمة للمعلمين لإدارة الفصول وبناء الاختبارات بسهولة.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 inline-flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/30">
              أنشئ حسابك مجاناً
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

      {/* ── Teachers Section ────────────────────────────────────── */}
      <section className="py-24 px-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 rounded-full px-4 py-1.5 text-sm font-bold text-indigo-200">
                <Brain className="w-4 h-4" />
                <span>مساحة المعلم الذكية</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-black leading-tight text-white">
                هل أنت معلم؟ <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 to-blue-300">
                  أدر فصولك بذكاء وسهولة
                </span>
              </h2>
              <p className="text-lg text-indigo-100/80 leading-relaxed max-w-lg">
                انضم الآن لمئات المعلمين الذين يعتمدون على استباق. أنشئ مجموعاتك الخاصة، واسحب أسئلة جاهزة من بنك المنصة، وتابع تقارير طلابك التفصيلية مجاناً.
              </p>
              
              <ul className="space-y-4">
                {[
                  'مجموعات افتراضية مغلقة لطلابك فقط بكلمة مرور',
                  'منشئ اختبارات يسحب الأسئلة آلياً حسب مادتك التخصصية',
                  'تقارير تفصيلية لدرجات ونسب نجاح كل طالب',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-indigo-400 shrink-0" />
                    <span className="text-indigo-50 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link href="/auth/register" className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:-translate-y-1 inline-flex items-center gap-3 shadow-xl shadow-indigo-500/25">
                  أنشئ بوابتك كمعلم
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md md:max-w-none relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                 <div className="absolute inset-0 bg-slate-800 flex items-center justify-center flex-col gap-4">
                   <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
                     <Users className="w-10 h-10 text-indigo-300" />
                   </div>
                   <div className="text-center">
                     <div className="text-xl font-bold text-white mb-2">لوحة تحكم المعلم</div>
                     <div className="text-indigo-200 text-sm">إدارة المجموعات، الاختبارات، والتقارير</div>
                   </div>
                   <div className="w-3/4 h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
                     <div className="w-2/3 h-full bg-gradient-to-r from-indigo-500 to-blue-400"></div>
                   </div>
                 </div>
              </div>
            </div>
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

      {/* ── Dual CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white relative overflow-hidden border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-display font-black mb-6">
            انضم الآن وابدأ رحلتك
          </h2>
          <p className="text-muted-foreground text-lg mb-16 max-w-xl mx-auto">
            سواء كنت طالباً يبحث عن التفوق أو معلماً يسعى للتميز، استباق مصر هي بيئتك المثالية.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student CTA */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl text-center flex flex-col items-center hover:border-primary/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">أنا طالب</h3>
              <p className="text-slate-600 mb-8 flex-1">
                تحدى زملاءك، اكسب النقاط، وتصدر لوحة الشرف الوطنية في بيئة ممتعة وتنافسية.
              </p>
              <Link href="/auth/register" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-colors">
                إنشاء حساب طالب
              </Link>
            </div>

            {/* Teacher CTA */}
            <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl text-center flex flex-col items-center hover:border-indigo-300 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-indigo-900 mb-3">أنا معلم</h3>
              <p className="text-indigo-700/80 mb-8 flex-1">
                أدر مجموعاتك، أنشئ اختباراتك بسهولة، وتابع أداء طلابك بأدق التفاصيل والتقارير.
              </p>
              <Link href="/auth/register" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors">
                إنشاء بوابة معلم
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="استباق مصر فاهم" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-white text-xl">استباق مصر</span>
        </div>
        <p className="text-sm mb-4">منصة تعليمية مجانية للمرحلة الإعدادية المصرية</p>
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <Link href="/auth/login" className="hover:text-white transition-colors">تسجيل الدخول</Link>
          <Link href="/auth/register" className="hover:text-white transition-colors">إنشاء حساب جديد</Link>
        </div>
        <p className="text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} استباق مصر — جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}
