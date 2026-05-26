# 🎓 استباق مصر - منصة التعليم الذكي

<div align="center">

![استباق مصر](https://img.shields.io/badge/استباق_مصر-منصة_تعليمية-1B4F72?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)
![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=for-the-badge&logo=openai)

**منصة تعليمية ذكية مخصصة للمنهج المصري • مدعومة بـ GPT-4o**

</div>

---

## 🌟 نظرة عامة

منصة **استباق مصر** هي نسخة مخصصة من [app.istabaq.com](https://app.istabaq.com) للنظام التعليمي المصري.  
تُمكّن المعلمين والمديرين من رفع المحتوى التعليمي وتحويله تلقائياً إلى اختبارات تفاعلية عبر الذكاء الاصطناعي.

## ✨ المزايا الرئيسية

| الميزة                | الوصف                                           |
| --------------------- | ----------------------------------------------- |
| 🤖 **ذكاء اصطناعي**   | توليد أسئلة MCQ / صح-خطأ / ملء فراغات بـ GPT-4o |
| 📁 **صيغ متعددة**     | PDF، Word، PowerPoint، MP3، MP4، صور، يوتيوب    |
| 🇪🇬 **المنهج المصري**  | 12 صف × 2 فصل × 19+ مادة دراسية                 |
| 🔒 **أمان RLS**       | فصل صارم: المدير ≠ الطالب على مستوى DB          |
| 📊 **تقارير تفصيلية** | إحصائيات الأداء، معدلات النجاح، توزيع الدرجات   |
| 🚀 **نشر تلقائي**     | GitHub Actions → Vercel في كل push              |

## 🏗️ التكنولوجيا المستخدمة

```
Frontend:   Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend:    Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
AI:         OpenAI GPT-4o (أسئلة) + Whisper (تفريغ صوت) + Google Gemini (المهام العامة والتكلفة المنخفضة)
Parsing:    Unstructured.io (PDF/Word/PPT)
Deploy:     Vercel (Frontend) + Supabase Cloud (Backend)
CI/CD:      GitHub Actions
```

### 🤖 معمارية الذكاء الاصطناعي الموحدة (AI Architecture)

تعتمد المنصة على نظام هجين يجمع بين مزودي الذكاء الاصطناعي **OpenAI** و **Google Gemini** لضمان الموازنة المثالية بين الجودة والتكلفة المادية:

- **OpenAI (GPT-4o / Whisper):** يُستخدم في المهام الحرجة عالية الدقة مثل توليد الأسئلة وبنك الأسئلة وتفريغ الصوت للدروس الطويلة بدقة فائقة.
- **Google Gemini (Gemini 1.5):** يُستخدم كحل بديل (Fallback) وتوليد الملخصات والشروحات والمهام التفاعلية البسيطة التي تتطلب نافذة سياق ضخمة وتكلفة تشغيلية منخفضة جداً.

تُدار هذه المعمارية بالكامل عبر طبقة تجريد موحدة (Abstraction Layer) في `lib/ai/provider.ts` و `lib/ai/config.ts`.

## 🚀 الإعداد والتشغيل

### المتطلبات الأساسية

- Node.js 20+
- حساب [Supabase](https://supabase.com)
- حساب [Vercel](https://vercel.com)
- مفتاح [OpenAI API](https://platform.openai.com)
- مفتاح [Unstructured.io](https://unstructured.io) (اختياري)

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-org/istabaq-egypt.git
cd istabaq-egypt
npm install
```

### 2. إعداد Supabase

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع (استبدل YOUR_PROJECT_ID)
supabase link --project-ref YOUR_PROJECT_ID

# تطبيق قاعدة البيانات
supabase db push

# تشغيل بيانات المناهج المصرية
supabase db execute --file supabase/seeds/egyptian_curriculum.sql
```

### 3. إعداد متغيرات البيئة

```bash
cp .env.local.example .env.local
```

عدّل `.env.local` وأضف بياناتك:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-proj-...
UNSTRUCTURED_API_KEY=...   # اختياري
```

### 4. إعداد Supabase Storage

في لوحة تحكم Supabase > Storage، أنشئ الـ Buckets التالية:

| Bucket            | النوع | الوصف                       |
| ----------------- | ----- | --------------------------- |
| `documents`       | خاص   | ملفات PDF/Word/PPT المرفوعة |
| `question-images` | عام   | صور الأسئلة                 |
| `avatars`         | خاص   | صور المستخدمين              |

### 5. تشغيل المشروع محلياً

```bash
npm run dev
# افتح http://localhost:3000
```

### 6. إنشاء أول مدير

في Supabase Dashboard > Authentication > Users:

1. أنشئ مستخدماً جديداً
2. في جدول `profiles`، غيّر `role` من `student` إلى `admin`
3. أضف سجلاً في جدول `admins` بنفس الـ `id`

## 📁 هيكل المشروع

```
istabaq-egypt/
├── app/
│   ├── (admin)/          # لوحة تحكم المدير (محمية)
│   │   ├── dashboard/    # الإحصائيات العامة
│   │   ├── content/      # رفع المحتوى وتوليد الأسئلة
│   │   ├── questions/    # بنك الأسئلة
│   │   ├── exams/        # إنشاء وإدارة الاختبارات
│   │   ├── students/     # إدارة الطلاب
│   │   └── reports/      # التقارير والتحليلات
│   ├── (student)/        # بوابة الطالب (محمية)
│   │   ├── dashboard/    # الصفحة الرئيسية
│   │   ├── exams/        # الاختبارات المتاحة
│   │   └── results/      # النتائج والأداء
│   ├── api/ai/           # API Routes للذكاء الاصطناعي
│   └── auth/             # صفحات المصادقة
├── components/
│   ├── admin/            # ContentUploader، QuestionPreviewGrid، ...
│   └── student/          # ExamInterface، StudentSidebar، ...
├── lib/
│   ├── supabase/         # client.ts، server.ts، admin.ts
│   ├── ai/               # prompts.ts، openai-client.ts
│   └── auth/             # permissions.ts
├── supabase/
│   ├── migrations/       # هيكل DB، RLS، Functions
│   ├── seeds/            # بيانات المناهج المصرية
│   └── functions/        # Edge Functions
└── types/supabase.ts     # TypeScript types
```

## 🔒 نموذج الأمان

```
┌─────────────────────────────────────┐
│          طبقة المصادقة (Auth)        │
│     Supabase Auth + JWT Tokens      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Middleware (Next.js)          │
│   التحقق من الدور قبل الصفحة        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         API Routes                   │
│   التحقق من الدور قبل كل عملية     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    قاعدة البيانات + RLS              │
│  الطبقة الأقوى - لا يمكن تجاوزها  │
└─────────────────────────────────────┘
```

## 🗂️ هيكل المنهج المصري

```
مراحل دراسية (3)
├── الابتدائية (الصف 1-6)
├── الإعدادية (الصف 7-9)
└── الثانوية (الصف 10-12)

مواد دراسية (19+)
├── لغة عربية، إنجليزية، رياضيات
├── علوم، دراسات اجتماعية (ابتدائي/إعدادي)
├── فيزياء، كيمياء، أحياء، جيولوجيا (ثانوي)
└── فلسفة، علم نفس، تاريخ، جغرافيا (ثانوي)
```

## 🚢 النشر على الإنتاج

### Vercel

```bash
# ربط المشروع بـ Vercel
vercel link

# النشر
vercel deploy --prod
```

أضف متغيرات البيئة في لوحة Vercel > Settings > Environment Variables.

### GitHub Secrets المطلوبة

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

## 📈 خارطة طريق التطوير

- [ ] نظام الشهادات (PDF تلقائي)
- [ ] إشعارات Realtime للطلاب
- [ ] تطبيق موبايل (React Native)
- [ ] دعم اختبارات الأسئلة المقالية (AI تصحيح)
- [ ] نظام الفصول الافتراضية
- [ ] تكامل مع منصات التعليم الحكومية المصرية
- [ ] تقارير PDF قابلة للتنزيل
- [ ] دعم متعدد اللغات (عربي + إنجليزي)

## 📄 الترخيص

MIT License - أنشئ بـ ❤️ للتعليم المصري
