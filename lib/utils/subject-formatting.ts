export function getSubjectDirection(
  subjectName: string | null | undefined
): 'rtl' | 'ltr' {
  if (!subjectName) return 'rtl'

  const normalized = subjectName.toLowerCase().trim()

  const ltrKeywords = [
    'english',
    'french',
    'german',
    'math',
    'science',
    'physics',
    'chemistry',
    'biology',
    'انجليزي',
    'إنجليزي',
    'لغة إنجليزية',
    'لغة انجليزية',
    'فرنساوي',
    'لغة فرنسية',
    'ألماني',
    'لغة ألمانية',
    'ماث',
    'ساينس',
    'فيزياء لغات',
    'كيمياء لغات',
    'أحياء لغات',
    'جيولوجيا لغات',
  ]

  for (const keyword of ltrKeywords) {
    if (normalized.includes(keyword)) {
      return 'ltr'
    }
  }

  return 'rtl'
}

export function getSubjectTextAlignClass(
  subjectName: string | null | undefined
): string {
  return getSubjectDirection(subjectName) === 'rtl' ? 'text-right' : 'text-left'
}
