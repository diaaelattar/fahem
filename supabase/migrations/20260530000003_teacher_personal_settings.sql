ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS print_header_type TEXT DEFAULT 'official',  -- 'official' (رسمي), 'personal' (شخصي), 'both' (دمج)
  ADD COLUMN IF NOT EXISTS teacher_display_name TEXT,                  -- الاسم الشخصي على الترويسة
  ADD COLUMN IF NOT EXISTS teacher_title TEXT,                         -- اللقب (مثال: معلم خبير الفيزياء)
  ADD COLUMN IF NOT EXISTS teacher_phone TEXT,                         -- رقم موبايل للتواصل على الترويسة
  ADD COLUMN IF NOT EXISTS teacher_social TEXT,                        -- يوتيوب / فيسبوك
  ADD COLUMN IF NOT EXISTS teacher_logo_url TEXT,                      -- رابط اللوجو الشخصي
  ADD COLUMN IF NOT EXISTS teacher_watermark_text TEXT,                -- نص العلامة المائية (الوسم)
  ADD COLUMN IF NOT EXISTS show_watermark BOOLEAN DEFAULT false;       -- تفعيل العلامة المائية
