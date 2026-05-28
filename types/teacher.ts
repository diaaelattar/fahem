export interface Grade {
  id: string
  name_ar: string
  grade_number?: number
}

export interface Subject {
  id: string
  name_ar: string
  icon: string
}

export interface Unit {
  id: string
  name_ar: string
  grade_id?: string
  subject_id?: string
  semester_id?: string
  grades?: Grade
  subjects?: Subject
}

export interface TeacherLesson {
  id: number
  name_ar: string
  sort_order: number
  has_content: boolean
  content_status: 'draft' | 'published'
  view_count: number
  unit_id: string
  units?: Unit
}

export interface LessonSection {
  id: string | number
  lesson_id: number
  title: string
  content: string
  sort_order: number
}

export interface LessonExercise {
  id: string | number
  lesson_id: number
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string | null
  sort_order: number
}

export interface StudentGroup {
  id: string
  name_ar: string
  invite_code: string
  is_active: boolean
  teacher_id: string
  grade_id: string
  grades?: Grade
  group_students?: { count: number }[]
}

export interface Student {
  id: string
  name: string
  email?: string
  avatar_url?: string
}

export interface TeacherExam {
  id: number
  title: string
  description?: string
  subject_id: number
  grade_id: number
  semester_id?: number
  unit_id?: number
  lesson_id?: number
  exam_type: 'partial' | 'final' | 'challenge'
  duration_minutes: number
  passing_score?: number
  instructions?: string
  is_published: boolean
  available_from?: string
  available_until?: string
  shuffle_questions: boolean
  shuffle_options: boolean
  show_results_immediately: boolean
  allowed_attempts: number
  group_id?: string
  teacher_id: string
  created_at?: string
}
