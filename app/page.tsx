import Link from 'next/link'
import {
  Brain, Swords, Trophy, Zap, BookOpen,
  TrendingUp, Star, Users, CheckCircle, ArrowLeft, Flame, GraduationCap, ChevronLeft
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-primary/20 selection:text-primary" dir="rtl">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo variant="horizontal" size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login"
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              بوابة الدخول
            </Link>
            <Link href="/auth/register"
              className="bg-primary hover:bg-primary/95 text-white font-black px-6 py-3 rounded-2xl text-sm transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
              إنشاء حساب جديد
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-hero-pattern pt-36 pb-24 px-4 sm:px-6 text-white relative overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Platform Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 text-sm mb-8 shadow-inner animate-pulse">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-blue-50">مخصص بالكامل للمرحلة الإعدادية المصرية</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-black leading-tight mb-8 text-balance drop-shadow-sm">
            تدرّب، تحدَّ،
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-amber-200 to-yellow-300 drop-shadow-[0_2px_8px_rgba(240,192,64,0.2)]">
              وتفوّق في لغتك العربية
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-blue-100/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            المنصة التعليمية الأذكى في مصر! نقدم لك أسئلة تفاعلية مكيّفة بالذكاء الاصطناعي للطلاب، 
            مع أدوات احترافية متقدمة للمعلمين لإدارة المجموعات وبناء الاختبارات بسهولة وبشكل مجاني تماماً.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register"
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-900 font-black px-10 py-5 rounded-2xl text-lg transition-all hover:scale-105 inline-flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30">
              أنشئ حسابك مجاناً
              <ArrowLeft className="w-5 h-5 shrink-0" />
            </Link>
            <a href="#features"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold px-10 py-5 rounded-2xl text-lg transition-all flex items-center justify-center gap-1">
              اكتشف المميزات
            </a>
          </div>

          {/* Core Stats */}
          <div className="max-w-3xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: '٣', label: 'صفوف إعدادية' },
              { value: '٨+', label: 'وحدات عربية' },
              { value: '١٠٠٪', label: 'مجاني بالكامل' },
              { value: 'AI', label: 'أسئلة ذكية' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 backdrop-blur-md rounded-3xl p-5 text-center border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300">
                <div className="text-3xl font-black text-amber-300 mb-1">{s.value}</div>
                <div className="text-xs text-blue-200/80 font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-black mb-4">
              لماذا استباق مصر؟
            </h2>
            <div className="w-16 h-1.5 bg-primary mx-auto rounded-full mb-4" />
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              ليست مجرد اختبارات تقليدية — بل منظومة تعليمية تفاعلية تجعل التعلم تجربة تنافسية ممتعة.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Swords,
                title: 'تحديات 1 vs 1 مباشرة',
                description: 'تحدَّ زملاءك في حلبة اللغة العربية. ١٠ أسئلة، ١٥ ثانية لكل سؤال، وتصدّر قائمة الأبطال!',
                color: 'text-rose-600 bg-rose-50',
                border: 'hover:border-rose-200 hover:shadow-rose-500/5',
              },
              {
                icon: Trophy,
                title: 'لوحة الشرف الوطنية',
                description: 'ترتيب أسبوعي محدّث على مستوى الجمهورية. تنافس مع آلاف الطلاب وأثبت تفوقك الدراسي!',
                color: 'text-amber-600 bg-amber-50',
                border: 'hover:border-amber-200 hover:shadow-amber-500/5',
              },
              {
                icon: Brain,
                title: 'أسئلة بالذكاء الاصطناعي',
                description: 'محرك Gemini AI يولّد أسئلة تفاعلية مطابقة تماماً للمنهج المصري ومن مختلف المستويات الفكرية.',
                color: 'text-blue-600 bg-blue-50',
                border: 'hover:border-blue-200 hover:shadow-blue-500/5',
              },
              {
                icon: TrendingUp,
                title: 'تتبع تقدمك بدقة',
                description: 'تقارير تفصيلية ورسوم بيانية توضح نقاط قوتك وضعفك في كل فرع من فروع المنهج الدراسي.',
                color: 'text-emerald-600 bg-emerald-50',
                border: 'hover:border-emerald-200 hover:shadow-emerald-500/5',
              },
              {
                icon: Star,
                title: 'نظام XP والمستويات',
                description: 'اكسب نقاط الخبرة مع كل إجابة صحيحة، وارتقِ بمستواك من مبتدئ إلى ملك اللغة العربية!',
                color: 'text-violet-600 bg-violet-50',
                border: 'hover:border-violet-200 hover:shadow-violet-500/5',
              },
              {
                icon: BookOpen,
                title: 'محتوى المنهج الرسمي',
                description: 'وحدات ودروس منظمة ومحدثة بحسب وزارة التربية والتعليم المصرية لصفوف المرحلة الإعدادية الثلاثة.',
                color: 'text-teal-600 bg-teal-50',
                border: 'hover:border-teal-200 hover:shadow-teal-500/5',
              },
            ].map(f => (
              <div key={f.title}
                className={`p-8 rounded-3xl border border-slate-100 bg-white ${f.border} card-hover group transition-all duration-300 flex flex-col`}>
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1 font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teachers Section ────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        {/* Background visual graphics */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-5 py-2 text-sm font-bold text-indigo-300">
                <GraduationCap className="w-4 h-4" />
                <span>مساحة المعلم الذكية</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-black leading-tight">
                هل أنت معلم؟ <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 via-indigo-100 to-amber-200">
                  أدر فصولك بذكاء وسهولة
                </span>
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed font-medium">
                انضم الآن لمئات المعلمين الذين يعتمدون على استباق. أنشئ مجموعاتك الافتراضية الخاصة، واسحب اختبارات جاهزة لطلابك، وتابع تقارير أدائهم بدقة تامة.
              </p>
              
              <ul className="space-y-4">
                {[
                  'إنشاء مجموعات دراسية مغلقة ومحمية بكلمة مرور لطلابك فقط',
                  'بناء اختبارات مخصصة تسحب الأسئلة تلقائياً من بنك الأسئلة للمنصة',
                  'تقارير تحليلية متكاملة توضح نسب نجاح وضعف كل طالب',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200 font-bold text-sm sm:text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link href="/auth/register?role=teacher" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4.5 rounded-2xl text-lg transition-all hover:-translate-y-1 inline-flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 active:translate-y-0">
                  سجل الآن كمعلم مجاناً
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Dashboard Mockup Representation */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl relative bg-slate-800/80 backdrop-blur p-1">
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-indigo-950/80 flex items-center justify-center flex-col gap-6 p-6">
                   <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                     <Users className="w-10 h-10 text-indigo-400 animate-pulse" />
                   </div>
                   <div className="text-center">
                     <h3 className="text-2xl font-bold text-white mb-2">لوحة تحكم المعلم</h3>
                     <p className="text-indigo-200/70 text-sm font-medium">إدارة تفاعلية متكاملة للمجموعات، الاختبارات والتقارير</p>
                   </div>
                   <div className="w-4/5 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                     <div className="w-3/4 h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full"></div>
                   </div>
                   <div className="grid grid-cols-3 gap-4 w-full mt-4">
                     {['مجموعات نشطة', 'اختبارات منشورة', 'طلاب متفاعلون'].map((lbl, idx) => (
                       <div key={lbl} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                         <div className="text-amber-400 font-black text-lg">{['١٢', '٤٢', '٣٥٠+'][idx]}</div>
                         <div className="text-[10px] text-slate-300 font-semibold">{lbl}</div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-black mb-4">ابدأ في ٣ خطوات بسيطة</h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full mb-3" />
            <p className="text-slate-500 font-medium">خطوات سريعة للبدء والتدريب الفوري</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '١', icon: '🔑', title: 'سجّل حسابك', desc: 'سجل فوراً بحساب جوجل أو بريدك الإلكتروني في ثوانٍ معدودة' },
              { step: '٢', icon: '📚', title: 'حدد صفك الدراسي', desc: 'اختر الصف الدراسي (الأول، الثاني، أو الثالث الإعدادي)' },
              { step: '٣', icon: '⚔️', title: 'تدرّب وتحدَّ زملائك', desc: 'ابدأ حل الاختبارات، وتحدَّ رفاقك وارتقِ في لوحة الأبطال' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 shadow-lg shadow-primary/10 text-white">
                  {s.icon}
                </div>
                <div className="text-[10px] font-black text-primary bg-primary/10 rounded-full px-3 py-1.5 inline-block mb-4">
                  الخطوة {s.step}
                </div>
                <h3 className="text-lg font-bold mb-2.5 text-slate-800">{s.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dual CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-display font-black mb-4">
            انضم الآن للمنصة التعليمية الأذكى في مصر
          </h2>
          <p className="text-slate-500 text-lg mb-16 max-w-xl mx-auto font-medium">
            سواء كنت طالباً يسعى للتفوق الدراسي أو معلماً يطمح للتميز وإدارة طلابه بذكاء، استباق مصر هي بيئتك المثالية.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student CTA */}
            <div className="bg-slate-50 border border-slate-200/70 p-8 rounded-3xl text-center flex flex-col items-center hover:border-primary/30 hover:shadow-xl hover:bg-white transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">أنا طالب</h3>
              <p className="text-slate-500 text-sm mb-8 flex-1 leading-relaxed font-medium">
                تحدى زملائك في منافسات حية، اجمع نقاط الخبرة، وتصدّر لوحة الشرف الوطنية في بيئة ممتعة وجذابة.
              </p>
              <Link href="/auth/register" className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5">
                إنشاء حساب طالب
              </Link>
            </div>

            {/* Teacher CTA */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-3xl text-center flex flex-col items-center hover:border-indigo-300 hover:shadow-xl hover:bg-white transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-indigo-50 flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-indigo-900 mb-3">أنا معلم</h3>
              <p className="text-indigo-800/70 text-sm mb-8 flex-1 leading-relaxed font-medium">
                أدر مجموعات طلابك، صمم اختبارات ذكية، وتابع درجات ونسب تحصيل طلابك بأدق التفاصيل والتقارير.
              </p>
              <Link href="/auth/register?role=teacher" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5">
                إنشاء بوابة معلم
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-4 sm:px-6 text-center border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <Logo variant="vertical" size="lg" light />
          </Link>
          <p className="text-sm max-w-sm leading-relaxed text-slate-400 font-medium">
            منصة التدريب والتحديات الذكية المجانية لطلاب المرحلة الإعدادية بجمهورية مصر العربية.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm font-semibold border-y border-slate-800 py-4 w-full max-w-md my-4">
            <Link href="/auth/login" className="hover:text-white transition-colors">تسجيل الدخول</Link>
            <span className="text-slate-800">|</span>
            <Link href="/auth/register" className="hover:text-white transition-colors">حساب جديد</Link>
            <span className="text-slate-800">|</span>
            <Link href="/auth/admin-login" className="hover:text-white transition-colors">بوابة الإدارة</Link>
          </div>
          
          <p className="text-xs text-slate-500 mt-2 font-medium">
            جميع الحقوق محفوظة © {new Date().getFullYear()} استباق مصر
          </p>
        </div>
      </footer>
    </div>
  )
}

