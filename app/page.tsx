import Link from 'next/link'
import {
  Brain,
  Swords,
  Trophy,
  Zap,
  BookOpen,
  TrendingUp,
  Star,
  Users,
  CheckCircle,
  ArrowLeft,
  Flame,
  GraduationCap,
  ChevronLeft,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-primary/20 selection:text-primary"
      dir="rtl"
    >
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <Logo variant="horizontal" size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:text-primary"
            >
              <Users className="h-4 w-4 text-slate-400" />
              بوابة الدخول
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0"
            >
              إنشاء حساب جديد
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-hero-pattern relative overflow-hidden px-4 pb-24 pt-36 text-white sm:px-6">
        {/* Background Decorative Circles */}
        <div className="pointer-events-none absolute left-10 top-20 h-96 w-96 rounded-full bg-amber-400/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-20 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Platform Badge */}
          <div className="mb-8 inline-flex animate-pulse items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm shadow-inner backdrop-blur-md">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-blue-50">
              مخصص بالكامل للمرحلة الإعدادية المصرية
            </span>
          </div>

          <h1 className="mb-8 text-balance font-display text-4xl font-black leading-tight drop-shadow-sm sm:text-6xl">
            تدرّب، تحدَّ،
            <br />
            <span className="bg-gradient-to-l from-amber-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(240,192,64,0.2)]">
              وتفوّق في لغتك العربية
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-blue-100/90 sm:text-xl">
            المنصة التعليمية الأذكى في مصر! نقدم لك أسئلة تفاعلية مكيّفة بالذكاء
            الاصطناعي للطلاب، مع أدوات احترافية متقدمة للمعلمين لإدارة المجموعات
            وبناء الاختبارات بسهولة وبشكل مجاني تماماً.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-10 py-5 text-lg font-black text-slate-900 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 hover:from-amber-400 hover:to-yellow-300 hover:shadow-amber-500/30 sm:w-auto"
            >
              أنشئ حسابك مجاناً
              <ArrowLeft className="h-5 w-5 shrink-0" />
            </Link>
            <a
              href="#features"
              className="flex w-full items-center justify-center gap-1 rounded-2xl border border-white/25 bg-white/10 px-10 py-5 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/15 sm:w-auto"
            >
              اكتشف المميزات
            </a>
          </div>

          {/* Core Stats */}
          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: '٣', label: 'صفوف إعدادية' },
              { value: '٨+', label: 'وحدات عربية' },
              { value: '١٠٠٪', label: 'مجاني بالكامل' },
              { value: 'AI', label: 'أسئلة ذكية' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center shadow-lg backdrop-blur-md transition-all duration-300 hover:border-white/20"
              >
                <div className="mb-1 text-3xl font-black text-amber-300">
                  {s.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-200/80">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="relative bg-white px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-3xl font-black sm:text-4xl">
              لماذا استباق مصر؟
            </h2>
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-primary" />
            <p className="mx-auto max-w-2xl text-lg font-medium text-slate-500">
              ليست مجرد اختبارات تقليدية — بل منظومة تعليمية تفاعلية تجعل التعلم
              تجربة تنافسية ممتعة.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Swords,
                title: 'تحديات 1 vs 1 مباشرة',
                description:
                  'تحدَّ زملاءك في حلبة اللغة العربية. ١٠ أسئلة، ١٥ ثانية لكل سؤال، وتصدّر قائمة الأبطال!',
                color: 'text-rose-600 bg-rose-50',
                border: 'hover:border-rose-200 hover:shadow-rose-500/5',
              },
              {
                icon: Trophy,
                title: 'لوحة الشرف الوطنية',
                description:
                  'ترتيب أسبوعي محدّث على مستوى الجمهورية. تنافس مع آلاف الطلاب وأثبت تفوقك الدراسي!',
                color: 'text-amber-600 bg-amber-50',
                border: 'hover:border-amber-200 hover:shadow-amber-500/5',
              },
              {
                icon: Brain,
                title: 'أسئلة بالذكاء الاصطناعي',
                description:
                  'محرك Gemini AI يولّد أسئلة تفاعلية مطابقة تماماً للمنهج المصري ومن مختلف المستويات الفكرية.',
                color: 'text-blue-600 bg-blue-50',
                border: 'hover:border-blue-200 hover:shadow-blue-500/5',
              },
              {
                icon: TrendingUp,
                title: 'تتبع تقدمك بدقة',
                description:
                  'تقارير تفصيلية ورسوم بيانية توضح نقاط قوتك وضعفك في كل فرع من فروع المنهج الدراسي.',
                color: 'text-emerald-600 bg-emerald-50',
                border: 'hover:border-emerald-200 hover:shadow-emerald-500/5',
              },
              {
                icon: Star,
                title: 'نظام XP والمستويات',
                description:
                  'اكسب نقاط الخبرة مع كل إجابة صحيحة، وارتقِ بمستواك من مبتدئ إلى ملك اللغة العربية!',
                color: 'text-violet-600 bg-violet-50',
                border: 'hover:border-violet-200 hover:shadow-violet-500/5',
              },
              {
                icon: BookOpen,
                title: 'محتوى المنهج الرسمي',
                description:
                  'وحدات ودروس منظمة ومحدثة بحسب وزارة التربية والتعليم المصرية لصفوف المرحلة الإعدادية الثلاثة.',
                color: 'text-teal-600 bg-teal-50',
                border: 'hover:border-teal-200 hover:shadow-teal-500/5',
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`rounded-3xl border border-slate-100 bg-white p-8 ${f.border} card-hover group flex flex-col transition-all duration-300`}
              >
                <div
                  className={`h-14 w-14 rounded-2xl ${f.color} mb-6 flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110`}
                >
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-800">
                  {f.title}
                </h3>
                <p className="flex-1 text-sm font-medium leading-relaxed text-slate-500">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teachers Section ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-24 text-white sm:px-6">
        {/* Background visual graphics */}
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-16 lg:flex-row">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-5 py-2 text-sm font-bold text-indigo-300">
                <GraduationCap className="h-4 w-4" />
                <span>مساحة المعلم الذكية</span>
              </div>
              <h2 className="font-display text-3xl font-black leading-tight sm:text-5xl">
                هل أنت معلم؟ <br />
                <span className="bg-gradient-to-l from-indigo-300 via-indigo-100 to-amber-200 bg-clip-text text-transparent">
                  أدر فصولك بذكاء وسهولة
                </span>
              </h2>
              <p className="text-lg font-medium leading-relaxed text-slate-300">
                انضم الآن لمئات المعلمين الذين يعتمدون على استباق. أنشئ مجموعاتك
                الافتراضية الخاصة، واسحب اختبارات جاهزة لطلابك، وتابع تقارير
                أدائهم بدقة تامة.
              </p>

              <ul className="space-y-4">
                {[
                  'إنشاء مجموعات دراسية مغلقة ومحمية بكلمة مرور لطلابك فقط',
                  'بناء اختبارات مخصصة تسحب الأسئلة تلقائياً من بنك الأسئلة للمنصة',
                  'تقارير تحليلية متكاملة توضح نسب نجاح وضعف كل طالب',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
                    <span className="text-sm font-bold leading-relaxed text-slate-200 sm:text-base">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link
                  href="/auth/register?role=teacher"
                  className="py-4.5 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 text-lg font-black text-white shadow-xl shadow-indigo-600/25 transition-all hover:-translate-y-1 hover:bg-indigo-500 hover:shadow-indigo-600/35 active:translate-y-0 sm:w-auto"
                >
                  سجل الآن كمعلم مجاناً
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Dashboard Mockup Representation */}
            <div className="relative w-full max-w-lg flex-1 lg:max-w-none">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-800/80 p-1 shadow-2xl backdrop-blur">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-900 to-indigo-950/80 p-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/20 bg-indigo-500/10 shadow-inner">
                    <Users className="h-10 w-10 animate-pulse text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-2xl font-bold text-white">
                      لوحة تحكم المعلم
                    </h3>
                    <p className="text-sm font-medium text-indigo-200/70">
                      إدارة تفاعلية متكاملة للمجموعات، الاختبارات والتقارير
                    </p>
                  </div>
                  <div className="h-2.5 w-4/5 overflow-hidden rounded-full border border-slate-700 bg-slate-800 p-0.5">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-indigo-500 to-amber-400"></div>
                  </div>
                  <div className="mt-4 grid w-full grid-cols-3 gap-4">
                    {['مجموعات نشطة', 'اختبارات منشورة', 'طلاب متفاعلون'].map(
                      (lbl, idx) => (
                        <div
                          key={lbl}
                          className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center"
                        >
                          <div className="text-lg font-black text-amber-400">
                            {['١٢', '٤٢', '٣٥٠+'][idx]}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-300">
                            {lbl}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-3xl font-black">
              ابدأ في ٣ خطوات بسيطة
            </h2>
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-primary" />
            <p className="font-medium text-slate-500">
              خطوات سريعة للبدء والتدريب الفوري
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '١',
                icon: '🔑',
                title: 'سجّل حسابك',
                desc: 'سجل فوراً بحساب جوجل أو بريدك الإلكتروني في ثوانٍ معدودة',
              },
              {
                step: '٢',
                icon: '📚',
                title: 'حدد صفك الدراسي',
                desc: 'اختر الصف الدراسي (الأول، الثاني، أو الثالث الإعدادي)',
              },
              {
                step: '٣',
                icon: '⚔️',
                title: 'تدرّب وتحدَّ زملائك',
                desc: 'ابدأ حل الاختبارات، وتحدَّ رفاقك وارتقِ في لوحة الأبطال',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl text-white shadow-lg shadow-primary/10">
                  {s.icon}
                </div>
                <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black text-primary">
                  الخطوة {s.step}
                </div>
                <h3 className="mb-2.5 text-lg font-bold text-slate-800">
                  {s.title}
                </h3>
                <p className="text-xs font-medium leading-relaxed text-slate-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dual CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-4 py-24 sm:px-6">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h2 className="mb-4 font-display text-3xl font-black sm:text-5xl">
            انضم الآن للمنصة التعليمية الأذكى في مصر
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-lg font-medium text-slate-500">
            سواء كنت طالباً يسعى للتفوق الدراسي أو معلماً يطمح للتميز وإدارة
            طلابه بذكاء، استباق مصر هي بيئتك المثالية.
          </p>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Student CTA */}
            <div className="flex flex-col items-center rounded-3xl border border-slate-200/70 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-primary/30 hover:bg-white hover:shadow-xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
                <Trophy className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="mb-3 text-2xl font-black text-slate-800">
                أنا طالب
              </h3>
              <p className="mb-8 flex-1 text-sm font-medium leading-relaxed text-slate-500">
                تحدى زملائك في منافسات حية، اجمع نقاط الخبرة، وتصدّر لوحة الشرف
                الوطنية في بيئة ممتعة وجذابة.
              </p>
              <Link
                href="/auth/register"
                className="w-full rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-primary/20"
              >
                إنشاء حساب طالب
              </Link>
            </div>

            {/* Teacher CTA */}
            <div className="flex flex-col items-center rounded-3xl border border-indigo-100 bg-indigo-50/50 p-8 text-center transition-all duration-300 hover:border-indigo-300 hover:bg-white hover:shadow-xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-50 bg-white shadow-sm">
                <Brain className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mb-3 text-2xl font-black text-indigo-900">
                أنا معلم
              </h3>
              <p className="mb-8 flex-1 text-sm font-medium leading-relaxed text-indigo-800/70">
                أدر مجموعات طلابك، صمم اختبارات ذكية، وتابع درجات ونسب تحصيل
                طلابك بأدق التفاصيل والتقارير.
              </p>
              <Link
                href="/auth/register?role=teacher"
                className="w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-600/20"
              >
                إنشاء بوابة معلم
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-900 px-4 py-16 text-center text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
          <Link href="/" className="transition-opacity hover:opacity-95">
            <Logo variant="vertical" size="lg" light />
          </Link>
          <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-400">
            منصة التدريب والتحديات الذكية المجانية لطلاب المرحلة الإعدادية
            بجمهورية مصر العربية.
          </p>

          <div className="my-4 flex w-full max-w-md items-center justify-center gap-6 border-y border-slate-800 py-4 text-sm font-semibold">
            <Link
              href="/auth/login"
              className="transition-colors hover:text-white"
            >
              تسجيل الدخول
            </Link>
            <span className="text-slate-800">|</span>
            <Link
              href="/auth/register"
              className="transition-colors hover:text-white"
            >
              حساب جديد
            </Link>
            <span className="text-slate-800">|</span>
            <Link
              href="/auth/admin-login"
              className="transition-colors hover:text-white"
            >
              بوابة الإدارة
            </Link>
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} استباق مصر
          </p>
        </div>
      </footer>
    </div>
  )
}
