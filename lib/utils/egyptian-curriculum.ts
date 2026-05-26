// lib/utils/egyptian-curriculum.ts

export const EDUCATIONAL_STAGES = [
  { id: 1, name_ar: 'المرحلة الابتدائية', grades: [1, 2, 3, 4, 5, 6] },
  { id: 2, name_ar: 'المرحلة الإعدادية', grades: [7, 8, 9] },
  { id: 3, name_ar: 'المرحلة الثانوية', grades: [10, 11, 12] },
] as const

export const GRADE_NAMES: Record<number, string> = {
  1: 'الصف الأول الابتدائي',
  2: 'الصف الثاني الابتدائي',
  3: 'الصف الثالث الابتدائي',
  4: 'الصف الرابع الابتدائي',
  5: 'الصف الخامس الابتدائي',
  6: 'الصف السادس الابتدائي',
  7: 'الصف الأول الإعدادي',
  8: 'الصف الثاني الإعدادي',
  9: 'الصف الثالث الإعدادي',
  10: 'الصف الأول الثانوي',
  11: 'الصف الثاني الثانوي',
  12: 'الصف الثالث الثانوي',
}

export const SUBJECTS_BY_STAGE = {
  primary: [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الرياضيات',
    'العلوم',
    'الدراسات الاجتماعية',
    'التربية الدينية الإسلامية',
  ],
  preparatory: [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الرياضيات',
    'العلوم',
    'الدراسات الاجتماعية',
    'التربية الدينية الإسلامية',
    'الحاسوب',
  ],
  secondary: [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الرياضيات',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'الجيولوجيا',
    'الفلسفة والمنطق',
    'علم النفس والاجتماع',
    'التاريخ',
    'الجغرافيا',
    'الحاسوب',
  ],
}

export function getStageByGrade(
  gradeNumber: number
): 'primary' | 'preparatory' | 'secondary' {
  if (gradeNumber <= 6) return 'primary'
  if (gradeNumber <= 9) return 'preparatory'
  return 'secondary'
}

export function getGradeLabel(gradeNumber: number): string {
  return GRADE_NAMES[gradeNumber] || `الصف ${gradeNumber}`
}

export function formatScore(score: number, total: number): string {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  return `${score}/${total} (${percentage}٪)`
}

export function getScoreColor(percentage: number): string {
  if (percentage >= 85) return 'text-green-600'
  if (percentage >= 70) return 'text-blue-600'
  if (percentage >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

export function getScoreBadge(percentage: number): string {
  if (percentage >= 90) return '🌟 ممتاز'
  if (percentage >= 80) return '✨ جيد جداً'
  if (percentage >= 70) return '👍 جيد'
  if (percentage >= 60) return '✅ مقبول'
  if (percentage >= 50) return '⚠️ ضعيف'
  return '❌ راسب'
}

export const DIFFICULTY_LABELS = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
} as const

export const QUESTION_TYPE_LABELS = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح / خطأ',
  fill_blank: 'ملء الفراغات',
} as const
