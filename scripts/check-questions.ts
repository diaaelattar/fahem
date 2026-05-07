import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, question_type, is_approved, subject_id, grade_id, unit_id, lesson_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching questions:', error)
  } else {
    console.log('Recent 10 Questions:')
    console.table(data)
    
    // Check how many questions total and how many approved
    const { count: total } = await supabase.from('questions').select('*', { count: 'exact', head: true })
    const { count: approved } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_approved', true)
    
    console.log(`\nTotal questions: ${total}`)
    console.log(`Approved questions: ${approved}`)
  }
}

checkQuestions()
