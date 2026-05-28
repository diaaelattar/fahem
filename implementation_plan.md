# خطة تطوير وتطوير بوابة المعلم — منصة فاهم (المرحلة الأولى)

خطة شاملة ومفصلة لتطوير وتحسين بوابة المعلم في منصة فاهم (استباق مصر) استناداً إلى المرحلة الأولى من خريطة الطريق المعتمدة في تقرير التقييم.

---

## 👥 مراجعة المستخدم مطلوبة (User Review Required)

> [!IMPORTANT]
> يرجى مراجعة التفاصيل المقترحة للمرحلة الأولى:
> 1. **توحيد الثيم البصري (Theme Unification):** سيتم تحويل صفحات الدروس (`app/teacher/lessons/`) ومكون محرر الدروس (`LessonContentEditor.tsx`) بالكامل من الثيم الداكن (Dark Theme) إلى الثيم الفاتح (Light Theme) المتناسق تماماً مع باقي البوابة ولوحة التحكم الرئيسية لتوفير تجربة بصرية موحدة ومريحة للعين.
> 2. **حوارات تأكيد الحذف (Confirm Dialogs):** سنقوم بإضافة تأكيد حاسم وتفاعلي ناعم قبل حذف أي مجموعة، اختبار، أو سؤال لحماية بيانات المعلم.
> 3. **حماية الـ AI API (Rate Limiting):** سنقترح آلية للحد من الاستخدام المفرط لتوليد الأسئلة لحماية كوتا واستهلاك مفاتيح الذكاء الاصطناعي.

---

## ❓ أسئلة مفتوحة للنقاش (Open Questions)

> [!NOTE]
> - **تحديد هوية Rate Limiting:** هل تفضل فرض حد أقصى لعمليات التوليد بالذكاء الاصطناعي بناءً على رقم المعلم الفرعي المحفوظ في قاعدة البيانات (مثل حد أقصى 20 عملية توليد يومياً)، أم ترغب في فرض حد زمني عام (مثلاً 5 طلبات كحد أقصى في الساعة لكل معلم)؟ نحن نقترح تحديد سقف يومي لكل معلم للحفاظ على استهلاك الكوتا المالي بشكل دقيق ومحكم.

---

## 🛠️ التغييرات المقترحة (Proposed Changes)

### Component 1: توحيد الثيم البصري لشرح الدروس (Theme Unification)

تحويل كامل لواجهات الدروس لتتماشى مع الهوية الفاتحة النظيفة للمنصة (`bg-slate-50`).

#### [MODIFY] [page.tsx](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/app/teacher/lessons/page.tsx)
- تحويل ألوان الخطوط والعناصر من الداكنة (`text-white`, `text-slate-400`) إلى الفاتحة المتناسقة (`text-slate-800`, `text-slate-500`).
- تحويل بطاقات الإحصائيات إلى خلفية بيضاء وحواف فاتحة (`bg-white border-slate-200 shadow-sm`).
- تحويل فلاتر الصفوف والوحدات لتستخدم ألواناً رمادية مريحة مع تدرجات خفيفة للمجموعات غير النشطة.
- تحويل بطاقات قائمة الدروس بالكامل لتبدو كبطاقات تفاعلية أنيقة بخلفيات بيضاء وتظليل ناعم عند مرور المؤشر (`bg-white border-slate-100 hover:border-indigo-200 shadow-sm`).

#### [MODIFY] [page.tsx](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/app/teacher/lessons/[id]/page.tsx)
- تعديل شريط التوجيه (Breadcrumbs) ليكون متناسقاً باللون الرمادي بدلاً من الأبيض.
- تعديل بطاقة معلومات الدرس العلوية لتستخدم الخلفية البيضاء والحواف الناعمة (`bg-white border-slate-200 shadow-sm`).

#### [MODIFY] [LessonContentEditor.tsx](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/components/teacher/LessonContentEditor.tsx)
- تحويل واجهة محرر الأقسام والتدريبات بالكامل للثيم الفاتح.
- تعديل حقول النصوص والـ Textareas لتكون ناصعة البياض بحدود رمادية ناعمة وتتجاوب بلون تفاعلي أزرق عند التركيز (`bg-white text-slate-800 border-slate-200 focus:border-indigo-500`).
- تعديل شريط الإجراءات السفلي (Sticky Save Bar) ليكون بخلفية بيضاء مع تظليل خفيف مريح للعين بدلاً من الخلفية الداكنة المتكدرة (`bg-white/95 border-slate-200 shadow-lg text-slate-800`).

---

### Component 2: حوارات تأكيد الحذف وتجربة المستخدم (UX Protections & Dialogs)

تطبيق Confirm Dialogs احترافية تمنع الفقدان المفاجئ للبيانات.

#### [MODIFY] [TeacherExamBuilder.tsx](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/components/teacher/TeacherExamBuilder.tsx)
- إضافة تأكيد حاسم قبل حذف أي سؤال مضاف للاختبار أو إلغاء مسودة الاختبار الجاري إنشاؤها لضمان تجربة مستخدم آمنة ومريحة.

---

### Component 3: حماية الـ AI API والحد من الطلبات (AI Rate Limiting)

فرض سياج أمني لحماية استهلاك كوتا الذكاء الاصطناعي ومنع الإفراط.

#### [MODIFY] [route.ts](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/app/api/teacher/generate-questions/route.ts)
- إضافة نظام تتبع ذكي يحدد عدد طلبات التوليد لكل معلم خلال اليوم، مع رد بخطأ واضح ومهذب للمستخدم في حال تجاوز الحد المسموح به.

---

### Component 4: تنظيف جودة الكود والأنواع (TypeScript Cleanup)

استبدال الاستخدام المفرط للنوع `any` بواجهات برمجية صارمة.

#### [NEW] [teacher.ts](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/types/teacher.ts)
- إنشاء ملف واجهات مخصص يحتوي على تعريفات كاملة وصارمة للبيانات:
  - `TeacherLesson` و `LessonSection` و `LessonExercise`
  - `StudentGroup` و `Student`
  - `TeacherExam`

---

## 📈 خطة التحقق والضمان (Verification Plan)

### الاختبارات التلقائية (Automated Tests)
- تشغيل `npx tsc --noEmit` للتحقق من عدم وجود أي تعارضات أو مشاكل في الـ Typescript بعد إدخال الواجهات الجديدة.
- التحقق من بناء المشروع بنجاح باستخدام `npm run build`.

### التحقق اليدوي (Manual Verification)
- فتح بوابة المعلم واختبار الانتقال لصفحة الدروس للتأكد من المظهر الفاتح الجديد ومطابقته المطلقة لروح لوحة التحكم والـ Dashboard.
- تشغيل مودال التوليد ومحاولة تجاوز الحد الأقصى للتأكد من عمل الـ Rate Limiting وإرجاع رسالة خطأ صديقة للمستخدم.
- اختبار إضافة وحذف الطلاب وتأكيد حوارات الحذف في الاختبارات والمجموعات.
