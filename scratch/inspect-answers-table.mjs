import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function inspectStudentAnswersTable() {
  const studentId = '865b7bb5-6a5a-4483-8013-06b861c99b11'
  console.log(`Inspecting student_answers table for student ID: ${studentId}`)

  const { data: answers, error } = await supabase
    .from('student_answers')
    .select('*, questions(*), exams(*)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error querying student_answers:", error.message)
    return
  }

  console.log(`Found ${answers.length} rows in student_answers table:`)
  answers.forEach((ans, idx) => {
    console.log(`-----------------------------------------`)
    console.log(`${idx + 1}. Attempt ID: ${ans.attempt_id}`)
    console.log(`   Exam Title: ${ans.exams?.title}`)
    console.log(`   Question: "${ans.questions?.question_text}"`)
    console.log(`   Question Type: "${ans.questions?.question_type}"`)
    console.log(`   Student Answer: "${ans.student_answer}"`)
    console.log(`   Correct Answer: "${ans.questions?.correct_answer}"`)
    console.log(`   Is Correct: ${ans.is_correct}`)
    console.log(`   Points Awarded: ${ans.points_awarded}`)
    console.log(`   Score Awarded: ${ans.score_awarded}`)
    console.log(`   Teacher Feedback: "${ans.teacher_feedback}"`)
  })
}

inspectStudentAnswersTable()
