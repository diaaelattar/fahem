// lib/schemas/ai-generation.ts
// Zod Schemas للتحقق من مدخلات توليد الأسئلة
// تمنع Prompt Injection وتضمن سلامة البيانات قبل إرسالها للـ AI

import { z } from 'zod'

// ─── قائمة الكلمات المحظورة في Prompt Injection ──────────────────────────────
const INJECTION_PATTERNS =
  /(ignore\s+(all\s+)?(previous|above)|forget\s+(all\s+)?instructions|disregard|override\s+instructions|system\s*:|<\/s>|SYSTEM\s*PROMPT|jailbreak|DAN\s+mode)/i

// ─── Schema الأساسي المشترك بين Admin و Teacher ──────────────────────────────
const BaseGenerateSchema = z.object({
  subjectId: z.coerce
    .number({ invalid_type_error: 'subjectId يجب أن يكون رقماً' })
    .int('subjectId يجب أن يكون عدداً صحيحاً')
    .positive('subjectId يجب أن يكون موجباً'),

  gradeId: z.coerce
    .number({ invalid_type_error: 'gradeId يجب أن يكون رقماً' })
    .int('gradeId يجب أن يكون عدداً صحيحاً')
    .positive('gradeId يجب أن يكون موجباً'),

  questionCount: z
    .number()
    .int('عدد الأسئلة يجب أن يكون عدداً صحيحاً')
    .min(1, 'الحد الأدنى لعدد الأسئلة هو 1')
    .max(30, 'الحد الأقصى لعدد الأسئلة هو 30')
    .default(5),

  requestedTypes: z
    .array(z.enum(['mcq', 'true_false', 'fill_blank', 'essay', 'correction']))
    .max(5, 'لا يمكن تحديد أكثر من 5 أنواع')
    .optional(),

  targetCognitiveLevel: z
    .enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'])
    .optional(),

  customInstructions: z
    .string()
    .max(500, 'التعليمات يجب ألا تتجاوز 500 حرف')
    .refine((v) => !INJECTION_PATTERNS.test(v), {
      message: 'التعليمات تحتوي على محتوى غير مسموح به',
    })
    .optional(),

  passageBased: z.boolean().optional(),
})

// ─── Schema لـ Admin Generate Questions ──────────────────────────────────────
export const AdminGenerateQuestionsSchema = BaseGenerateSchema.extend({
  documentId: z.string().uuid('documentId يجب أن يكون UUID صحيحاً'),

  fileType: z.enum(
    ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'docx', 'text', 'youtube'],
    { errorMap: () => ({ message: 'نوع الملف غير مدعوم' }) }
  ),

  pastedText: z
    .string()
    .max(20000, 'النص أطول من المسموح (20,000 حرف)')
    .optional(),

  youtubeUrl: z
    .string()
    .url('رابط يوتيوب غير صحيح')
    .startsWith('https://www.youtube.com', 'يجب أن يكون رابط يوتيوب')
    .optional(),

  fileData: z
    .string()
    .max(10_000_000, 'حجم الملف كبير جداً')
    .optional(), // base64

  chunkIndex: z.number().int().min(0).optional(),
  totalChunks: z.number().int().min(1).optional(),

  generationMode: z.enum(['SMART_GEN', 'EXACT_EXTRACT']).default('SMART_GEN'),
})

export type AdminGenerateQuestionsInput = z.infer<
  typeof AdminGenerateQuestionsSchema
>

// ─── Schema لـ Teacher Generate Questions ────────────────────────────────────
export const TeacherGenerateQuestionsSchema = BaseGenerateSchema.extend({
  pastedText: z
    .string()
    .max(15000, 'النص أطول من المسموح (15,000 حرف)')
    .optional(),

  fileData: z
    .string()
    .max(8_000_000, 'حجم الملف كبير جداً (الحد 6MB)')
    .optional(), // base64

  fileExtension: z
    .enum(['pdf', 'jpg', 'jpeg', 'png', 'webp'])
    .optional(),
}).refine(
  (data) => data.pastedText || data.fileData,
  'يجب تقديم نص الدرس أو رفع ملف تعليمي'
)

export type TeacherGenerateQuestionsInput = z.infer<
  typeof TeacherGenerateQuestionsSchema
>

// ─── دالة مساعدة لإرجاع خطأ Zod بتنسيق عربي ─────────────────────────────────
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `[${issue.path.join('.')}] ` : ''
    return `${path}${issue.message}`
  })
  return issues.join(' | ')
}
