import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })

    const body = await req.json()
    const { subjectId, gradeId, semesterId, mode, numberOfExams, questionsPerExam, titlePrefix, durationMinutes } = body

    if (!subjectId || !gradeId || !mode) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    let createdExamsCount = 0

    if (mode === 'general') {
      // جلب الأسئلة المعتمدة لهذه المادة والصف
      const { data: bankQuestions } = await supabase
        .from('questions')
        .select('id, points')
        .eq('subject_id', subjectId)
        .eq('grade_id', gradeId)
        .eq('is_approved', true)

      if (!bankQuestions || bankQuestions.length < questionsPerExam) {
        return NextResponse.json({ error: `بنك الأسئلة لا يحتوي على عدد كافٍ من الأسئلة. المتوفر: ${bankQuestions?.length || 0}` }, { status: 400 })
      }

      for (let i = 0; i < numberOfExams; i++) {
        // Shuffle questions
        const shuffled = [...bankQuestions].sort(() => Math.random() - 0.5)
        const selectedQuestions = shuffled.slice(0, questionsPerExam)
        const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0)

        // Insert exam
        const examData = {
          admin_id: user.id,
          title: `${titlePrefix} - نموذج ${i + 1}`,
          subject_id: subjectId,
          grade_id: gradeId,
          semester_id: semesterId || null,
          duration_minutes: durationMinutes || 60,
          total_points: totalPoints,
          is_published: true,
          questions_count: selectedQuestions.length
        }

        const { data: exam, error: examError } = await supabase.from('exams').insert(examData).select('id').single()
        if (examError) throw examError

        // Insert exam questions
        const examQuestionsData = selectedQuestions.map((q, idx) => ({
          exam_id: (exam as any).id,
          question_id: q.id,
          question_order: idx + 1
        }))

        const { error: eqError } = await supabase.from('exam_questions').insert(examQuestionsData)
        if (eqError) throw eqError

        createdExamsCount++
      }

    } else if (mode === 'units') {
      // جلب جميع الوحدات لهذه المادة والصف
      const { data: units } = await supabase
        .from('units')
        .select('id, name_ar')
        .eq('subject_id', subjectId)
        .eq('grade_id', gradeId)

      if (!units || units.length === 0) {
        return NextResponse.json({ error: 'لا توجد وحدات مسجلة لهذه المادة' }, { status: 400 })
      }

      for (const unit of units) {
        const { data: unitQuestions } = await supabase
          .from('questions')
          .select('id, points')
          .eq('subject_id', subjectId)
          .eq('grade_id', gradeId)
          .eq('unit_id', unit.id)
          .eq('is_approved', true)

        if (!unitQuestions || unitQuestions.length === 0) continue

        // اختيار عدد أسئلة محدد (أو كل الأسئلة إذا كان العدد قليل)
        const shuffled = [...unitQuestions].sort(() => Math.random() - 0.5)
        const selectedCount = Math.min(questionsPerExam || 15, shuffled.length)
        const selectedQuestions = shuffled.slice(0, selectedCount)
        const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0)

        const examData = {
          admin_id: user.id,
          title: `اختبار ${unit.name_ar}`,
          subject_id: subjectId,
          grade_id: gradeId,
          semester_id: semesterId || null,
          unit_id: unit.id,
          duration_minutes: durationMinutes || 45,
          total_points: totalPoints,
          is_published: true,
          questions_count: selectedQuestions.length
        }

        const { data: exam, error: examError } = await supabase.from('exams').insert(examData).select('id').single()
        if (examError) throw examError

        const examQuestionsData = selectedQuestions.map((q, idx) => ({
          exam_id: (exam as any).id,
          question_id: q.id,
          question_order: idx + 1
        }))

        const { error: eqError } = await supabase.from('exam_questions').insert(examQuestionsData)
        if (eqError) throw eqError

        createdExamsCount++
      }
    }

    return NextResponse.json({ success: true, count: createdExamsCount })
  } catch (error: any) {
    console.error('Batch exam generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
