import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 3600 // Cache for 1 hour

export async function GET() {
  try {
    const [students, teachers, questions, exams] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabaseAdmin.from('questions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('exam_attempts').select('id', { count: 'exact', head: true }),
    ])

    // We use real counts but add a baseline for marketing
    const baseStudents = 0
    const baseTeachers = 0
    const baseQuestions = 0
    const baseExams = 0

    return NextResponse.json({
      studentsCount: (students.count ?? 0) + baseStudents,
      teachersCount: (teachers.count ?? 0) + baseTeachers,
      questionsCount: (questions.count ?? 0) + baseQuestions,
      examsCount: (exams.count ?? 0) + baseExams,
    })
  } catch (err) {
    console.error('Error fetching landing stats:', err)
    return NextResponse.json(
      {
        studentsCount: 0,
        teachersCount: 0,
        questionsCount: 0,
        examsCount: 0,
      },
      { status: 200 }
    )
  }
}
