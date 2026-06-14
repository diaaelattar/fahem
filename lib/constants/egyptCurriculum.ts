/**
 * المنهج المصري - تعريفات الصفوف والمواد
 * Egyptian Curriculum — Grade & Subject Definitions
 *
 * المراحل:
 *   primary      → الابتدائية  (الصفوف 1–6)
 *   preparatory  → الإعدادية   (الصفوف 1–3)
 *   secondary    → الثانوية    (الصفوف 1–3, مسارات متعددة)
 */

export type EducationalStage = 'primary' | 'preparatory' | 'secondary'
export type SecondaryTrack = 'bacc' | 'old' | 'coming_soon'

export interface EduGrade {
  /** must match the grades.name_ar in the database */
  name_ar: string
  name_en: string
  gradeNumber: number
  stage: EducationalStage
  /** secondary only */
  track?: SecondaryTrack
}

export interface EduSubject {
  name_ar: string
  icon: string
  /** stages where this subject appears */
  stages: EducationalStage[]
  /** grade numbers within each stage */
  gradeNumbers?: Partial<Record<EducationalStage, number[]>>
}

// ─── الصفوف الدراسية ────────────────────────────────────────────────────────

export const EGYPT_GRADES: EduGrade[] = [
  // الابتدائية
  { name_ar: 'الصف الأول الابتدائي',  name_en: 'Primary 1',  gradeNumber: 1, stage: 'primary' },
  { name_ar: 'الصف الثاني الابتدائي', name_en: 'Primary 2',  gradeNumber: 2, stage: 'primary' },
  { name_ar: 'الصف الثالث الابتدائي', name_en: 'Primary 3',  gradeNumber: 3, stage: 'primary' },
  { name_ar: 'الصف الرابع الابتدائي', name_en: 'Primary 4',  gradeNumber: 4, stage: 'primary' },
  { name_ar: 'الصف الخامس الابتدائي', name_en: 'Primary 5',  gradeNumber: 5, stage: 'primary' },
  { name_ar: 'الصف السادس الابتدائي', name_en: 'Primary 6',  gradeNumber: 6, stage: 'primary' },
  // الإعدادية
  { name_ar: 'الصف الأول الإعدادي',  name_en: 'Prep 1',  gradeNumber: 1, stage: 'preparatory' },
  { name_ar: 'الصف الثاني الإعدادي', name_en: 'Prep 2',  gradeNumber: 2, stage: 'preparatory' },
  { name_ar: 'الصف الثالث الإعدادي', name_en: 'Prep 3',  gradeNumber: 3, stage: 'preparatory' },
  // الثانوية
  { name_ar: 'الصف الأول الثانوي',  name_en: 'Secondary 1', gradeNumber: 1, stage: 'secondary', track: 'bacc' },
  { name_ar: 'الصف الثاني الثانوي', name_en: 'Secondary 2', gradeNumber: 2, stage: 'secondary', track: 'bacc' },
  { name_ar: 'الصف الثالث الثانوي', name_en: 'Secondary 3', gradeNumber: 3, stage: 'secondary', track: 'old'  },
]

// ─── المواد حسب المرحلة والصف ───────────────────────────────────────────────

/**
 * المواد الدراسية للمرحلة الابتدائية
 * الصفوف 1-3: عربي + ماث + إنجليزي
 * الصفوف 4-6: عربي + ماث + إنجليزي + علوم + دراسات
 */
export const SUBJECTS_PRIMARY_LOW: string[] = [
  'اللغة العربية',
  'الرياضيات',
  'اللغة الإنجليزية',
]

export const SUBJECTS_PRIMARY_HIGH: string[] = [
  'اللغة العربية',
  'الرياضيات',
  'اللغة الإنجليزية',
  'العلوم',
  'الدراسات الاجتماعية',
]

/**
 * المواد الدراسية للمرحلة الإعدادية
 */
export const SUBJECTS_PREPARATORY: string[] = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الرياضيات',
  'العلوم',
  'الدراسات الاجتماعية',
]

/**
 * المواد الدراسية للمرحلة الثانوية
 * يعتمد على المسار والمادة
 * (يتم تحميل المواد ديناميكياً من قاعدة البيانات)
 */
export const SUBJECTS_SECONDARY_COMMON: string[] = [
  'اللغة العربية',
  'اللغة الإنجليزية',
]

// ─── الدوال المساعدة ────────────────────────────────────────────────────────

/** أسماء المراحل بالعربي */
export const STAGE_LABELS: Record<EducationalStage, string> = {
  primary:      'المرحلة الابتدائية',
  preparatory:  'المرحلة الإعدادية',
  secondary:    'المرحلة الثانوية',
}

export const STAGE_ICONS: Record<EducationalStage, string> = {
  primary:      '🎒',
  preparatory:  '📖',
  secondary:    '🎓',
}

export const TRACK_LABELS: Record<SecondaryTrack, string> = {
  bacc:         'البكالوريا (نظام جديد)',
  old:          'النظام القديم (ثانوي 3)',
  coming_soon:  'قريباً',
}

/**
 * إرجاع قائمة المواد المقترحة حسب الصف الدراسي
 * based on Egyptian Ministry of Education curriculum
 */
export function getSubjectsForGrade(grade: EduGrade): string[] {
  if (grade.stage === 'primary') {
    return grade.gradeNumber <= 3 ? SUBJECTS_PRIMARY_LOW : SUBJECTS_PRIMARY_HIGH
  }
  if (grade.stage === 'preparatory') {
    return SUBJECTS_PREPARATORY
  }
  // secondary → subjects depend on track; return common ones
  return SUBJECTS_SECONDARY_COMMON
}

/**
 * تجميع الصفوف حسب المرحلة
 */
export function groupGradesByStage(grades: EduGrade[]): Record<EducationalStage, EduGrade[]> {
  return grades.reduce(
    (acc, g) => {
      acc[g.stage].push(g)
      return acc
    },
    { primary: [], preparatory: [], secondary: [] } as Record<EducationalStage, EduGrade[]>
  )
}
