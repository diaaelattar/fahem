# خطة التحسين والإتقان والتنظيف — مشروع فاهم

خطة شاملة لتنظيف المستودع (Repository)، توحيد الملفات التجريبية، وتحسين جودة الكود العام للمشروع.

---

## User Review Required

> [!IMPORTANT]
> يرجى مراجعة الخطوات التالية لـ **المرحلة صفر** و **المرحلة الأولى**:
> - سيتم حذف الملفات المؤقتة تماماً من الـ Git (`build_log.txt`, `tsc_output.txt`, إلخ).
> - سيتم حذف مجلد `scratch/` الذي يحتوي على 83 ملف تجريبي لتنظيف الـ Repo (أو نقله لـ Branch منفصل إن أردت الاحتفاظ به للتاريخ). سنقترح حذفه من `main` مباشرة.
> - سيتم نقل ملفات الاختبار والأدوات الفردية الموجودة في الـ root إلى مجلدي `scripts/tests/` و `scripts/tools/` لتوحيدها.

---

## Open Questions

> [!NOTE]
> هل تفضل الاحتفاظ ببعض السكربتات المعينة من مجلد `scratch/` أم نقوم بحذف المجلد بالكامل من الفرع الرئيسي `main`؟ (نحن نقترح حذف مجلد `scratch/` بالكامل لتنظيف الـ codebase).

---

## Proposed Changes

### Component 1: المرحلة صفر — التنظيف الفوري (Immediate Cleanup)

تنظيف الملفات المؤقتة والملفات التاريخية والمسودات من الفرع الرئيسي.

#### [DELETE] [build_log.txt](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/build_log.txt)
#### [DELETE] [build_execsync.txt](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/build_execsync.txt)
#### [DELETE] [build_output.txt](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/build_output.txt)
#### [DELETE] [tsc_output.txt](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/tsc_output.txt)
#### [DELETE] [tsc_output2.txt](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/tsc_output2.txt)
#### [DELETE] [capture_logs.js](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/capture_logs.js)
#### [DELETE] [New Text Document.html](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/New%20Text%20Document.html)
#### [DELETE] [scratch/](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/scratch)
#### [DELETE] [istabaq-egypt-v2/](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/istabaq-egypt-v2)
#### [DELETE] [istabaq-new-pages/](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/istabaq-new-pages)

#### [MODIFY] [.gitignore](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/.gitignore)
تحديث ملف التجاهل لمنع رفع الملفات المؤقتة مستقبلاً.

---

### Component 2: توحيد ملفات الاختبار والأدوات اليدوية (CLEANUP-4)

نقل الملفات الفردية المتفرقة في الـ root إلى مجلدات منظمة داخل `scripts/`.

#### [NEW] [scripts/tests/](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/scripts/tests)
#### [NEW] [scripts/tools/](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/scripts/tools)

سيتم نقل الملفات كالتالي:
- `test-*.mjs` -> `scripts/tests/test-*.mjs`
- `inspect-*.mjs` -> `scripts/tests/inspect-*.mjs`
- `fetch_page.mjs` -> `scripts/tests/fetch_page.mjs`
- `fix-*.mjs` -> `scripts/tools/fix-*.mjs`
- `approve-all.mjs` -> `scripts/tools/approve-all.mjs`
- `check-*.mjs` -> `scripts/tools/check-*.mjs`
- `create-bucket.mjs` / `create-bucket.ts` / `create-student-answers-bucket.mjs` -> `scripts/tools/`
- `storage-policy.mjs` / `review-truefalse.mjs` -> `scripts/tools/`

---

### Component 3: المرحلة الأولى — جودة الكود (Code Quality Setup)

تثبيت وإعداد أدوات جودة الكود للتأكد من خلوه من الأخطاء وثبات التنسيق.

#### [MODIFY] [package.json](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/package.json)
إضافة سكربتات التشغيل للـ Prettier و ESLint والـ TypeScript check.

#### [NEW] [.prettierrc](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/.prettierrc)
إنشاء ملف إعدادات Prettier لتنسيق الكود تلقائياً.

#### [MODIFY] [.eslintrc.json](file:///c:/Users/diaa_elattar/Downloads/istabaq-egypt-complete/istabaq-egypt/.eslintrc.json) أو ملف إعدادات ESLint لتفعيل القواعد الصارمة.

---

## Verification Plan

### Automated Tests
- تشغيل `git status` للتأكد من إزالة ونقل جميع الملفات المستهدفة بنجاح.
- تشغيل `npm run lint` للتأكد من عمل أدوات التفتيش بعد التعديل.

### Manual Verification
- التحقق من هيكل المجلدات الجديد وخلو الـ root من الفوضى الحالية.
