// lib/ai/question-filter.ts
// ═══════════════════════════════════════════════════════════════════════════════
// محرك التدقيق والتنقية البَعدي للأسئلة المولدة (Post-Generation Question Sanitizer)
// يضمن خلو الأسئلة من أسئلة الغلاف، الفهرس، والشكليات، ويتحقق من جودة الخيارات
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeneratedQuestionItem {
  type?: string
  question_type?: string
  question_text?: string
  text?: string
  options?: string[] | null
  correct_answer?: string
  answer?: string
  explanation?: string | null
  hint?: string | null
  difficulty?: string
  difficulty_level?: string
  bloom_level?: string
  context_passage?: string | null
  points?: number
  learning_outcome?: string | null
}

const FORBIDDEN_ADMIN_TERMS = [
  /فهرس\s*(الكتاب|المحتويات|الموضوعات)?/i,
  /قائمة\s*المحتويات/i,
  /غلاف\s*(الكتاب|المذكرة|المجلد)?/i,
  /دار\s*(ال)?نشر/i,
  /طُ?بع\s*(هذا\s*)?الكتاب/i,
  /سنة\s*(ال)?طبع/i,
  /المطبعة/i,
  /حقوق\s*(الطبع|النشر|التوزيع)/i,
  /رقم\s*(ال)?إيداع/i,
  /الترقيم\s*الدولي/i,
  /تصدير\s*الكتاب/i,
  /مقدمة\s*(الكتاب|الطبعة)/i,
  /مؤلف(ي|و)?\s*(هذا\s*)?الكتاب/i,
  /المشرف\s*على\s*(التعديل|التطوير|المراجعة)/i,
  /في\s*أي\s*صفحة\s*يقع/i,
  /الصفحة\s*رقم\s*\d+\s*في\s*الفهرس/i,
  /عنوان\s*الوحدة\s*الأولى\s*في\s*الفهرس/i,
  /أهداف\s*مقدمة\s*الكتاب/i,
]

export function isAdministrativeOrCoverQuestion(qText: string): boolean {
  if (!qText || typeof qText !== 'string') return true
  const trimmed = qText.trim()
  if (trimmed.length < 10) return true
  for (const regex of FORBIDDEN_ADMIN_TERMS) {
    if (regex.test(trimmed)) return true
  }
  return false
}

export function sanitizeQuestion(q: GeneratedQuestionItem): GeneratedQuestionItem | null {
  const text = (q.question_text || q.text || '').trim()
  if (!text) return null
  if (isAdministrativeOrCoverQuestion(text)) return null

  const rawType = (q.question_type || q.type || 'mcq').toLowerCase()
  const qType = rawType === 'multiple_choice' ? 'mcq' : rawType

  let cleanedOptions: string[] | null = null
  if (qType === 'mcq') {
    const rawOptions = Array.isArray(q.options) ? q.options : []
    const stringOptions = rawOptions
      .map((opt) => (typeof opt === 'string' ? opt.trim() : String(opt).trim()))
      .filter(Boolean)

    const invalidPhrases = [
      'كل ما سبق',
      'جميع ما سبق',
      'لا شيء مما سبق',
      'لا شيء مما ذكر',
      'جميع الإجابات صحيحة',
      'أ و ب معا',
      'أ وب معا',
      'جميع ما ذكر',
    ]

    const filtered = stringOptions.filter(
      (opt) => !invalidPhrases.some((phrase) => opt.includes(phrase))
    )
    const uniqueOptions = Array.from(new Set(filtered))
    if (uniqueOptions.length < 3) return null
    cleanedOptions = uniqueOptions
  }

  const correctAnswer = (q.correct_answer || q.answer || '').trim()
  if (!correctAnswer && qType !== 'essay') return null

  const difficulty = (q.difficulty_level || q.difficulty || 'medium').toLowerCase()
  const validDifficulties = ['easy', 'medium', 'hard']
  const finalDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium'

  const bloom = (q.bloom_level || 'understand').toLowerCase()
  const validBlooms = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
  const finalBloom = validBlooms.includes(bloom) ? bloom : 'understand'

  return {
    ...q,
    question_type: qType,
    type: qType,
    question_text: text,
    options: cleanedOptions,
    correct_answer: correctAnswer,
    difficulty_level: finalDifficulty,
    difficulty: finalDifficulty,
    bloom_level: finalBloom,
    explanation: q.explanation ? String(q.explanation).trim() : null,
    hint: q.hint ? String(q.hint).trim() : null,
    context_passage: q.context_passage ? String(q.context_passage).trim() : null,
    points: typeof q.points === 'number' && q.points > 0 ? q.points : 1,
    learning_outcome: q.learning_outcome ? String(q.learning_outcome).trim() : null,
  }
}

export function cleanAndValidateQuestions(
  rawQuestions: any[]
): { questions: GeneratedQuestionItem[]; filteredOutCount: number } {
  if (!Array.isArray(rawQuestions)) {
    return { questions: [], filteredOutCount: 0 }
  }

  const validQuestions: GeneratedQuestionItem[] = []
  const seenTexts = new Set<string>()
  let filteredOutCount = 0

  for (const raw of rawQuestions) {
    const sanitized = sanitizeQuestion(raw)
    if (!sanitized) {
      filteredOutCount++
      continue
    }

    const textToNormalize = sanitized.question_text || ''
    const normalizedKey = textToNormalize
      .replace(/[^\w\s\u0621-\u064A]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (seenTexts.has(normalizedKey)) {
      filteredOutCount++
      continue
    }

    seenTexts.add(normalizedKey)
    validQuestions.push(sanitized)
  }

  return { questions: validQuestions, filteredOutCount }
}
