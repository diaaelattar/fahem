// lib/ai/prompts.ts

export interface PromptParams {
  subject: string
  grade: string
  unitLesson?: string
  extractedText: string
  questionCount?: number
}

export const QUESTION_GENERATION_PROMPT = (params: PromptParams): string => `
أنت خبير في تطوير المناهج التعليمية المصرية ومتخصص في إعداد الأسئلة التقييمية.
مهمتك تحليل النص التعليمي التالي وتوليد أسئلة تقييمية عالية الجودة.

**المادة الدراسية:** ${params.subject}
**الصف الدراسي:** ${params.grade}
${params.unitLesson ? `**الوحدة/الدرس:** ${params.unitLesson}` : ''}

**النص المراد تحليله:**
"""
${params.extractedText.slice(0, 8000)}
"""

**المطلوب:**
قم بتوليد ${params.questionCount || 12} سؤالاً تغطي المستويات المعرفية المختلفة (تذكر، فهم، تطبيق، تحليل) موزعة كالتالي:
- 50% اختيار من متعدد (MCQ) - 4 خيارات لكل سؤال
- 25% صح أو خطأ (True/False)
- 25% ملء الفراغات (Fill in the Blank)

**معايير الجودة الإلزامية:**
1. دقة علمية تامة ومتوافقة مع المنهج المصري
2. الإجابات الخاطئة في MCQ يجب أن تكون منطقية ومشتتة فعلياً
3. أضف شرحاً موجزاً ومفيداً للإجابة الصحيحة
4. توزيع متوازن على مستويات الصعوبة: 30% سهل، 50% متوسط، 20% صعب
5. تنوع في صياغة الأسئلة (لا تكرار لنفس النمط)
6. اللغة العربية الفصحى السليمة

**صيغة المخرجات (JSON فقط، بدون أي نص إضافي قبله أو بعده):**
{
  "questions": [
    {
      "type": "mcq",
      "question_text": "نص السؤال هنا",
      "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "correct_answer": "الخيار ب",
      "explanation": "شرح مختصر سبب صحة الإجابة",
      "difficulty": "medium",
      "points": 2
    },
    {
      "type": "true_false",
      "question_text": "عبارة يحكم عليها بصح أو خطأ",
      "options": ["صح", "خطأ"],
      "correct_answer": "صح",
      "explanation": "شرح سبب صحة العبارة",
      "difficulty": "easy",
      "points": 1
    },
    {
      "type": "fill_blank",
      "question_text": "أكمل: _______ هو ...",
      "options": null,
      "correct_answer": "الإجابة",
      "explanation": "شرح مختصر",
      "difficulty": "easy",
      "points": 1
    }
  ],
  "metadata": {
    "total_questions": 12,
    "estimated_time_minutes": 15,
    "topics_covered": ["الموضوع الأول", "الموضوع الثاني"],
    "cognitive_levels": {
      "recall": 30,
      "understanding": 40,
      "application": 20,
      "analysis": 10
    }
  }
}`

export const YOUTUBE_ANALYSIS_PROMPT = (transcript: string, title: string): string => `
أنت محلل محتوى تعليمي متخصص. تم تفريغ النص التالي من فيديو تعليمي على يوتيوب.

**عنوان الفيديو:** ${title}

**النص المفرّغ:**
"""
${transcript.slice(0, 6000)}
"""

**المطلوب:**
1. استخرج النقاط التعليمية الرئيسية (5-7 نقاط)
2. وضّح المصطلحات العلمية الواردة في الفيديو
3. قم بتوليد أسئلة تقييمية بنفس المعايير المذكورة

**المخرجات (JSON فقط):**
{
  "summary": {
    "main_points": ["النقطة الأولى", "النقطة الثانية"],
    "key_terms": [{"term": "المصطلح", "definition": "التعريف"}],
    "learning_objectives": ["هدف 1", "هدف 2"]
  },
  "questions": [...]
}`

export const TEXT_IMPROVEMENT_PROMPT = (questionText: string, subject: string): string => `
أنت خبير في صياغة الأسئلة التعليمية. قم بتحسين صياغة السؤال التالي ليكون أكثر وضوحاً ودقة:

المادة: ${subject}
السؤال الأصلي: "${questionText}"

أعد صياغة السؤال فقط، بدون أي شرح أو تعليق. الناتج يجب أن يكون نص السؤال المحسّن فقط.`
