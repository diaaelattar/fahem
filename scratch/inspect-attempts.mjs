import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function inspectStudentAttempts() {
  const studentId = '865b7bb5-6a5a-4483-8013-06b861c99b11'
  console.log(`Inspecting attempts for student ID: ${studentId}`)

  const { data: attempts, error: attemptsError } = await supabase
    .from('exam_attempts')
    .select('*, exams(title, total_points, passing_score)')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })

  if (attemptsError) {
    console.error("Error querying exam_attempts:", attemptsError.message)
    return
  }

  console.log(`Found ${attempts.length} attempts in exam_attempts:`)
  for (const att of attempts) {
    console.log("=========================================")
    console.log(`Attempt ID: ${att.id}`)
    console.log(`Exam ID: ${att.exam_id}`)
    console.log(`Exam Title: ${att.exams?.title}`)
    console.log(`Score: ${att.score} / ${att.exams?.total_points} (Passing: ${att.exams?.passing_score})`)
    console.log(`Percentage: ${att.percentage}%`)
    console.log(`Is Passed: ${att.is_passed}`)
    console.log(`Completed At: ${att.completed_at}`)
    console.log("-----------------------------------------")
    
    const answersObj = att.answers || {}
    const feedbackObj = att.feedback || {}
    const questionIds = Object.keys(answersObj)
    
    if (questionIds.length === 0) {
      console.log("No answers found in this attempt record.")
      continue
    }
    
    // Fetch all questions details
    const { data: questionList, error: qError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds)
      
    if (qError) {
      console.error("  Error fetching questions:", qError.message)
      continue
    }
    
    console.log(`Answers details (${questionList.length} questions):`)
    questionList.forEach((q, idx) => {
      const studentAns = answersObj[q.id]
      const feedback = feedbackObj[q.id] || {}
      
      console.log(`  ${idx + 1}. Question: "${q.question_text}"`)
      console.log(`     Student's Answer: "${studentAns}"`)
      console.log(`     Correct Answer: "${q.correct_answer}"`)
      console.log(`     Calculated Correct: ${studentAns?.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase()}`)
      console.log(`     Recorded as Correct: ${feedback.is_correct}`)
      console.log(`     Explanation: ${q.explanation}`)
    })
  }
}

inspectStudentAttempts()
