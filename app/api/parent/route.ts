import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { student_phone, parent_phone } = await req.json()

    if (!student_phone || !parent_phone) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم الطالب ورقم ولي الأمر' },
        { status: 400 }
      )
    }

    // Find student by phone via profiles table (phone stored in students table)
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        grade_id,
        parent_phone,
        wallet_balance,
        profiles!inner(full_name, email)
      `)
      .eq('parent_phone', parent_phone)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'لم يتم العثور على بيانات مطابقة. تأكد من رقم الطالب ورقم ولي الأمر' },
        { status: 404 }
      )
    }

    // Fetch student's exams and results
    const { data: examResults } = await supabaseAdmin
      .from('exam_attempts')
      .select(`
        id, score, max_score, created_at, completed_at, status,
        exams(id, title, passing_score)
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch exercise attempts (lesson progress)
    const { data: exerciseAttempts } = await supabaseAdmin
      .from('exercise_attempts')
      .select(`
        lesson_id, is_correct, attempted_at,
        lesson_exercises(lesson_id, lesson_sections(lesson_id))
      `)
      .eq('student_id', student.id)
      .order('attempted_at', { ascending: false })
      .limit(50)

    // Aggregate lesson completion stats
    const lessonStats: Record<number, { correct: number; total: number }> = {}
    for (const attempt of exerciseAttempts || []) {
      const lessonId = attempt.lesson_id
      if (!lessonId) continue
      if (!lessonStats[lessonId]) lessonStats[lessonId] = { correct: 0, total: 0 }
      lessonStats[lessonId].total++
      if (attempt.is_correct) lessonStats[lessonId].correct++
    }

    // Summary stats
    const totalExams = examResults?.length ?? 0
    const passedExams = examResults?.filter(r => {
      const score = r.score ?? 0
      const max = r.max_score ?? 100
      const examsData = Array.isArray(r.exams) ? r.exams[0] : (r.exams as any)
      const passing = examsData?.passing_score ?? 60
      return (score / max) * 100 >= passing
    }).length ?? 0
    const avgScore = totalExams > 0
      ? Math.round((examResults!.reduce((sum, r) => sum + (r.score ?? 0), 0) / examResults!.reduce((sum, r) => sum + (r.max_score ?? 100), 0)) * 100)
      : 0

    return NextResponse.json({
      student: {
        name: (student.profiles as any)?.full_name ?? 'الطالب',
        grade_id: student.grade_id,
        wallet_balance: student.wallet_balance ?? 0,
      },
      stats: {
        total_exams: totalExams,
        passed_exams: passedExams,
        avg_score: avgScore,
        lessons_practiced: Object.keys(lessonStats).length,
      },
      recent_exams: examResults?.slice(0, 10) ?? [],
      lesson_stats: lessonStats,
    })
  } catch (err) {
    console.error('Parent dashboard error:', err)
    return NextResponse.json({ error: 'حدث خطأ في النظام' }, { status: 500 })
  }
}
