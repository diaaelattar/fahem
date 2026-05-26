import type { ExamType } from '@/types/supabase'

export interface QuestionItem {
  id: string
  question_type: string
  context_passage?: string | null
  question_text: string
  difficulty_level: string
  points: number
  unit_id: number | null
  lesson_id: number | null
  semester_id: number | null
  subjects?: { name_ar: string; icon: string } | null
  grades?: { name_ar: string } | null
  units?: { name_ar: string } | null
  lessons?: { name_ar: string } | null
}

export interface SelectedQuestion extends QuestionItem {
  order: number
  points_override?: number
}

export interface FilterOption {
  id: number
  name_ar: string
  icon?: string
}

export interface ExamBuilderProps {
  subjects: FilterOption[]
  grades: FilterOption[]
  semesters: FilterOption[]
  units: FilterOption[]
  lessons: FilterOption[]
  groups?: FilterOption[]
  examId?: string
  initialData?: any
}

/**
 * UNIFIED STATE: covers both exam metadata AND question bank filters.
 * subjectId/gradeId/semesterId/unitId/lessonId are shared — set once, used everywhere.
 */
export interface ExamFormState {
  // ── Exam metadata ──────────────────────────────────────────
  title: string
  description: string
  examType: ExamType
  duration: string
  passingScore: string
  instructions: string
  isPublished: boolean
  availableFrom: string
  availableUntil: string
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResultsImmediately: boolean
  allowedAttempts: string
  groupId?: string

  // ── Shared hierarchy (drives BOTH exam settings + bank filter) ──
  subjectId: string
  gradeId: string
  semesterId: string
  unitId: string
  lessonId: string

  // ── Bank-only extra filters (not saved to exam) ────────────
  bankSearch: string
  bankQuestionType: string
  bankDifficulty: string
}

export const EXAM_TYPE_OPTIONS: {
  value: ExamType
  label: string
  icon: string
  color: string
}[] = [
  {
    value: 'partial',
    label: 'اختبار جزئي',
    icon: '📝',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    value: 'monthly',
    label: 'اختبار شهري',
    icon: '📅',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    value: 'midterm',
    label: 'نصف الترم',
    icon: '📊',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    value: 'final',
    label: 'امتحان نهائي',
    icon: '🎓',
    color: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    value: 'homework',
    label: 'واجب منزلي',
    icon: '🏠',
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  {
    value: 'custom',
    label: 'مخصص',
    icon: '⚙️',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
  },
]

export const TYPE_AR: Record<string, string> = {
  mcq: 'اختيار متعدد',
  true_false: 'صح/خطأ',
  fill_blank: 'ملء فراغ',
}
export const DIFF_AR: Record<string, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}
export const DIFF_COLOR: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
}
export const TYPE_COLOR: Record<string, string> = {
  mcq: 'bg-blue-50 text-blue-700 border-blue-200',
  true_false: 'bg-violet-50 text-violet-700 border-violet-200',
  fill_blank: 'bg-teal-50 text-teal-700 border-teal-200',
}

export const DEFAULT_FORM: ExamFormState = {
  title: '',
  description: '',
  examType: 'partial',
  duration: '30',
  passingScore: '',
  instructions: '',
  isPublished: false,
  availableFrom: '',
  availableUntil: '',
  shuffleQuestions: true,
  shuffleOptions: true,
  showResultsImmediately: true,
  allowedAttempts: '1',
  groupId: '',
  subjectId: '',
  gradeId: '',
  semesterId: '',
  unitId: '',
  lessonId: '',
  bankSearch: '',
  bankQuestionType: '',
  bankDifficulty: '',
}
