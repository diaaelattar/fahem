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

export interface ExamFormState {
  title: string
  description: string
  subjectId: string
  gradeId: string
  groupId?: string
  semesterId: string
  unitId: string
  lessonId: string
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
}

export const EXAM_TYPE_OPTIONS: { value: ExamType; label: string; color: string }[] = [
  { value: 'partial',  label: 'اختبار جزئي (درس/وحدة)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'monthly',  label: 'اختبار شهري',             color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'midterm',  label: 'نصف الترم',               color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'final',    label: 'امتحان نهائي',            color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'homework', label: 'واجب منزلي',              color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'custom',   label: 'مخصص',                    color: 'bg-slate-50 text-slate-700 border-slate-200' },
]

export const TYPE_AR: Record<string, string> = {
  mcq: 'اختيار متعدد', true_false: 'صح/خطأ', fill_blank: 'ملء فراغ'
}
export const DIFF_AR: Record<string, string> = {
  easy: 'سهل', medium: 'متوسط', hard: 'صعب'
}
export const DIFF_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700'
}
