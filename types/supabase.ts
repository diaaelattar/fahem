// types/supabase.ts
// هذا الملف يُولَّد تلقائياً بواسطة: npx supabase gen types typescript --project-id YOUR_ID > types/supabase.ts
// التعريفات أدناه مكتوبة يدوياً للمشروع

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Role = 'admin' | 'student'
export type QuestionType = 'mcq' | 'true_false' | 'fill_blank'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type FileType = 'pdf' | 'docx' | 'pptx' | 'mp3' | 'mp4' | 'wav' | 'jpg' | 'jpeg' | 'png' | 'youtube' | 'text'
export type ExamType = 'partial' | 'monthly' | 'midterm' | 'final' | 'homework' | 'custom'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: Role
          is_active: boolean
          is_premium: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      students: {
        Row: {
          id: string
          grade_id: number | null
          class_section: string | null
          student_code: string | null
          parent_phone: string | null
          enrollment_date: string
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'enrollment_date'> & { enrollment_date?: string }
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      admins: {
        Row: {
          id: string
          department: string | null
          school_name: string | null
          permissions: Json
        }
        Insert: Database['public']['Tables']['admins']['Row']
        Update: Partial<Database['public']['Tables']['admins']['Insert']>
      }
      educational_stages: {
        Row: { id: number; name_ar: string; name_en: string | null; sort_order: number }
        Insert: Omit<Database['public']['Tables']['educational_stages']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['educational_stages']['Insert']>
      }
      semesters: {
        Row: { id: number; name_ar: string; name_en: string | null; sort_order: number }
        Insert: Omit<Database['public']['Tables']['semesters']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['semesters']['Insert']>
      }
      units: {
        Row: {
          id: number
          subject_id: number | null
          grade_id: number | null
          semester_id: number | null
          name_ar: string
          description: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['units']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['units']['Insert']>
      }
      lessons: {
        Row: {
          id: number
          unit_id: number | null
          name_ar: string
          learning_objectives: string[] | null
          sort_order: number
          duration_minutes: number
          is_active: boolean
          objectives: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>
      }
      grades: {
        Row: { id: number; stage_id: number; name_ar: string; name_en: string | null; grade_number: number; sort_order: number }
        Insert: Omit<Database['public']['Tables']['grades']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['grades']['Insert']>
      }
      subjects: {
        Row: { id: number; name_ar: string; name_en: string | null; category: string | null; applicable_stages: string[] | null; icon: string; color: string }
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>
      }
      documents: {
        Row: {
          id: string
          admin_id: string
          title: string
          description: string | null
          file_url: string | null
          file_type: FileType
          youtube_url: string | null
          file_size_bytes: number | null
          processing_status: ProcessingStatus
          extracted_text: string | null
          metadata: Json
          subject_id: number | null
          grade_id: number | null
          unit_id: number | null
          lesson_id: number | null
          questions_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at' | 'questions_count'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      questions: {
        Row: {
          id: string
          admin_id: string
          document_id: string | null
          question_type: QuestionType
          question_text: string
          question_image_url: string | null
          image_position: 'top' | 'bottom' | 'right' | 'left' | null
          options: Json | null
          correct_answer: string
          explanation: string | null
          difficulty_level: DifficultyLevel
          points: number
          tags: string[]
          subject_id: number | null
          grade_id: number | null
          unit_id: number | null
          lesson_id: number | null
          is_approved: boolean
          usage_count: number
          ai_audit_results: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at' | 'updated_at' | 'usage_count'>
        Update: Partial<Database['public']['Tables']['questions']['Insert']>
      }
      exams: {
        Row: {
          id: string
          admin_id: string
          title: string
          description: string | null
          subject_id: number | null
          grade_id: number | null
          semester_id: number | null
          unit_id: number | null
          lesson_id: number | null
          exam_type: ExamType
          duration_minutes: number
          total_points: number
          passing_score: number | null
          instructions: string | null
          cover_image_url: string | null
          is_published: boolean
          available_from: string | null
          available_until: string | null
          shuffle_questions: boolean
          shuffle_options: boolean
          show_results_immediately: boolean
          allowed_attempts: number
          questions_count: number
          attempts_count: number
          avg_score: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at' | 'updated_at' | 'questions_count' | 'attempts_count' | 'avg_score'>
        Update: Partial<Database['public']['Tables']['exams']['Insert']>
      }
      exam_questions: {
        Row: { id: string; exam_id: string; question_id: string; question_order: number; points_override: number | null }
        Insert: Omit<Database['public']['Tables']['exam_questions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['exam_questions']['Insert']>
      }
      exam_attempts: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          started_at: string
          completed_at: string | null
          time_spent_seconds: number | null
          score: number | null
          percentage: number | null
          is_passed: boolean | null
          answers: Json
          feedback: Json
          attempt_number: number
          ip_address: string | null
          answers_viewed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['exam_attempts']['Row'], 'id' | 'started_at'>
        Update: Partial<Database['public']['Tables']['exam_attempts']['Insert']>
      }
      system_settings: {
        Row: {
          id: number
          free_exam_limit: number
          enable_exam_limit: boolean
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['system_settings']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>
      }
      subscription_plans: {
        Row: {
          id: string
          name_ar: string
          description_ar: string | null
          price: number
          duration_days: number
          features: Json
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscription_plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscription_plans']['Insert']>
      }
      student_subscriptions: {
        Row: {
          id: string
          student_id: string
          plan_id: string
          start_date: string
          end_date: string
          status: 'active' | 'expired' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['student_subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['student_subscriptions']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          student_id: string
          plan_id: string | null
          amount: number
          payment_method: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          reference_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
    }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      get_student_grade: { Args: Record<string, never>; Returns: number }
      can_attempt_exam: { Args: { p_exam_id: string }; Returns: Json }
      grade_exam_attempt: { Args: { p_attempt_id: string }; Returns: Json }
      get_admin_dashboard_stats: { Args: Record<string, never>; Returns: Json }
      get_exam_statistics: { Args: { p_exam_id: string }; Returns: Json }
    }
  }
}

// أنواع مشتقة ومساعدة
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Grade = Database['public']['Tables']['grades']['Row']
export type Subject = Database['public']['Tables']['subjects']['Row']
export type Semester = Database['public']['Tables']['semesters']['Row']
export type Unit = Database['public']['Tables']['units']['Row']
export type Lesson = Database['public']['Tables']['lessons']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Exam = Database['public']['Tables']['exams']['Row']
export type ExamAttempt = Database['public']['Tables']['exam_attempts']['Row']

// أنواع مركّبة (مع الـ joins)
export type StudentWithProfile = Student & { profiles: Profile; grades: Grade | null }
export type QuestionWithRelations = Question & {
  subjects: Subject | null
  grades: Grade | null
  units: Unit | null
  lessons: Lesson | null
}
export type ExamWithRelations = Exam & {
  subjects: Subject | null
  grades: Grade | null
  semesters: Semester | null
  units: Unit | null
  lessons: Lesson | null
}
export type UnitWithLessons = Unit & { lessons: Lesson[] }
