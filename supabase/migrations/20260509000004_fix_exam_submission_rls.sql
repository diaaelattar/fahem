-- إصلاح مشكلة تسليم الاختبار (تعديل سياسة RLS)

-- 1. حذف السياسة القديمة التي كانت تمنع تحديث الحقل completed_at
DROP POLICY IF EXISTS "Students update own attempts" ON public.exam_attempts;

-- 2. إنشاء السياسة الصحيحة التي تسمح للطالب بتحديث المحاولة لتصبح مكتملة
CREATE POLICY "Students update own attempts" ON public.exam_attempts
    FOR UPDATE 
    USING (
        student_id = auth.uid() 
        AND completed_at IS NULL -- الشرط يطبق على السجل القديم (يجب أن يكون غير مكتمل)
    )
    WITH CHECK (
        student_id = auth.uid() -- الشرط يطبق على السجل الجديد (يُسمح بأن يكون مكتملات الآن)
    );
