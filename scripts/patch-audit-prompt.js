const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'lib', 'ai', 'prompts.ts')
let content = fs.readFileSync(filePath, 'utf8')

const marker = '\nexport const QUESTION_AUDIT_PROMPT'
const idx = content.indexOf(marker)
if (idx === -1) {
  console.error('Marker not found!')
  process.exit(1)
}

const base = content.slice(0, idx)

const newExport = `
export const QUESTION_AUDIT_PROMPT = (q: {
  question_type: string
  question_text: string
  options?: any
  correct_answer: string
  explanation?: string | null
  difficulty_level?: string
  bloom_level?: string
  subject_name?: string
  grade_name?: string
}): string => {
  const optText = q.options ? JSON.stringify(q.options, null, 2) : 'null'
  const lines = [
    '# دورك: خبير تدقيق أسئلة المناهج المصرية',
    'أنت محكّم أكاديمي متخصص في المناهج المصرية. افحص السؤال التالي وأصدر تقريراً دقيقاً.',
    '',
    '## بيانات السؤال',
    \`- المادة: \${q.subject_name || 'غير محدد'}\`,
    \`- الصف: \${q.grade_name || 'غير محدد'}\`,
    \`- نوع السؤال: \${q.question_type}\`,
    \`- نص السؤال: \${q.question_text}\`,
    \`- الخيارات: \${optText}\`,
    \`- الإجابة الصحيحة: \${q.correct_answer}\`,
    \`- التفسير: \${q.explanation || 'لا يوجد'}\`,
    \`- الصعوبة: \${q.difficulty_level || 'غير محدد'}\`,
    \`- مستوى بلوم: \${q.bloom_level || 'غير محدد'}\`,
    '',
    '## معايير التدقيق الإلزامية',
    '1. الصحة العلمية: هل الإجابة صحيحة علمياً؟ في MCQ هل هناك إجابة واحدة فقط؟',
    '2. جودة الصياغة: هل اللغة فصيحة؟',
    '3. تدقيق LaTeX (هام جداً للرياضيات):',
    '   - كل رمز أو كسر أو متغير يجب أن يوضع داخل $...$',
    '   - في مخرجات JSON، يجب مضاعفة الشرطة المائلة (Backslash) للرموز:',
    '     * صحيح: $\\\\\\\\frac{a}{b}$، $\\\\\\\\sqrt{9}$، $x^{2}$',
    '     * خاطئ: $\\\\frac{a}{b}$، $\\\\sqrt{9}$ (ستسبب مشكلة في الـ Parse)',
    '4. التفسير (Explanation):',
    '   - يجب أن يكون خطوة بخطوة (Step-by-step).',
    '   - استخدم علامات السطر الجديد (\\\\n) لتنسيق الخطوات بشكل مقروء.',
    '   - لا تضع التفسير كله في فقرة واحدة متكدسة.',
    '',
    '## المخرجات: كائن JSON صارم فقط، لا تكتب أي نص خارجه:',
    '{',
    '  "audit_status": "perfect",',
    '  "issues_found": [],',
    '  "suggestions": {',
    '    "question_text": "النص المحسّن أو نفس النص إذا كان سليماً",',
    '    "options": ["خيار1","خيار2","خيار3","خيار4"],',
    '    "correct_answer": "الإجابة الصحيحة",',
    '    "explanation": "شرح تفصيلي للإجابة منسق بخطوات مع \\\\n",',
    '    "difficulty_level": "easy",',
    '    "bloom_level": "remember",',
    '    "tags": ["وسم1","وسم2","وسم3"]',
    '  },',
    '  "scientific_accuracy_score": 95,',
    '  "latex_compliance_score": 90',
    '}',
    'قواعد: audit_status = perfect/needs_fix/critical_error. options = null لغير MCQ.',
  ]
  return lines.join('\\n')
}
`

const finalContent = base + newExport
fs.writeFileSync(filePath, finalContent, 'utf8')
console.log('DONE. File length:', finalContent.length)
