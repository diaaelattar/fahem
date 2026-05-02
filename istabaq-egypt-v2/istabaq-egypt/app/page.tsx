import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Brain, BookOpen, BarChart3, Shield, Zap, Users, CheckCircle, ArrowLeft } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') redirect('/admin/dashboard')
    if (profile?.role === 'student') redirect('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-egypt-gradient flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-primary">استباق مصر</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-hero-pattern pt-32 pb-24 px-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span>مدعوم بأحدث نماذج الذكاء الاصطناعي GPT-4o</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight mb-6 text-balance">
            حوّل محتواك التعليمي
            <br />
            <span className="text-yellow-300">إلى اختبارات تفاعلية</span>
            <br />
            في ثوانٍ
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            منصة ذكية مخصصة للمنهج المصري. ارفع ملف PDF أو Word أو فيديو يوتيوب،
            وسيقوم الذكاء الاصطناعي بتوليد أسئلة احترافية لطلابك فوراً.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 inline-flex items-center gap-2 shadow-lg">
              ابدأ مجاناً الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <a href="#features"
              className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all">
              اكتشف المزايا
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '١٢', label: 'صف دراسي مدعوم' },
            { value: '١٩+', label: 'مادة دراسية' },
            { value: '٧', label: 'صيغ ملفات مدعومة' },
            { value: '٩٩٪', label: 'دقة توليد الأسئلة' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20">
              <div className="text-3xl font-display font-bold text-yellow-300 mb-1">{stat.value}</div>
              <div className="text-sm text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">كل ما تحتاجه في منصة واحدة</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              صُمّمت خصيصاً للمعلمين والمديرين في المدارس المصرية
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'توليد أسئلة ذكي',
                description: 'حمّل أي محتوى تعليمي وسيقوم GPT-4o بتوليد أسئلة متعددة الأنواع (MCQ، صح/خطأ، ملء فراغات) تلقائياً',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: BookOpen,
                title: 'متوافق مع المنهج المصري',
                description: 'هيكل كامل للمناهج المصرية: 12 صف دراسي، فصلان دراسيان، وجميع المواد من الابتدائي حتى الثانوي',
                color: 'text-green-600 bg-green-50',
              },
              {
                icon: Zap,
                title: 'دعم صيغ متعددة',
                description: 'PDF، Word، PowerPoint، صوت MP3، فيديو MP4، صور، ونص مباشر أو رابط يوتيوب - كل شيء مدعوم',
                color: 'text-yellow-600 bg-yellow-50',
              },
              {
                icon: Shield,
                title: 'أمان بمستوى المؤسسات',
                description: 'فصل صارم للصلاحيات: المدير يدير كل شيء، والطالب يرى اختباراته فقط. حماية RLS على مستوى قاعدة البيانات',
                color: 'text-red-600 bg-red-50',
              },
              {
                icon: BarChart3,
                title: 'تقارير تفصيلية',
                description: 'تتبع أداء كل طالب، إحصائيات الاختبارات، معدلات النجاح، وتوزيع الدرجات بمخططات تفاعلية',
                color: 'text-purple-600 bg-purple-50',
              },
              {
                icon: Users,
                title: 'إدارة الطلاب بسهولة',
                description: 'أنشئ حسابات الطلاب، صنّفهم حسب الصف والفصل، وأرسل لهم الاختبارات المناسبة لمستواهم مباشرة',
                color: 'text-cyan-600 bg-cyan-50',
              },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl border border-border card-hover group">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">كيف يعمل؟</h2>
            <p className="text-muted-foreground text-lg">ثلاث خطوات بسيطة من المحتوى إلى الاختبار</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '١', title: 'ارفع المحتوى', desc: 'ارفع ملف PDF أو Word أو PPT أو الصق رابط يوتيوب أو اكتب النص مباشرة', icon: '📄' },
              { step: '٢', title: 'الذكاء الاصطناعي يعمل', desc: 'يقوم GPT-4o بتحليل المحتوى وتوليد أسئلة دقيقة ومتنوعة خلال دقيقة', icon: '🤖' },
              { step: '٣', title: 'انشر الاختبار', desc: 'راجع الأسئلة وعدّلها، ثم أنشئ اختباراً وانشره لطلابك بضغطة زر', icon: '🚀' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-3">الخطوة {item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-egypt-gradient text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-display font-bold mb-4">جاهز لتحويل طريقة التدريس؟</h2>
          <p className="text-blue-100 text-lg mb-8">ابدأ اليوم مجاناً - لا تحتاج بطاقة ائتمان</p>
          <Link href="/auth/login"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105 inline-flex items-center gap-2 shadow-xl">
            ابدأ الآن مجاناً
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-white">استباق مصر</span>
        </div>
        <p className="text-sm">منصة تعليمية ذكية مخصصة للمنهج المصري • {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
