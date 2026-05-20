import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function clearAttempt() {
  const attemptId = 'd781ab7a-9ffa-4137-9f5b-98931bf2befe'
  console.log(`Clearing student answers for attempt: ${attemptId}`)
  const { error: err1 } = await supabase.from('student_answers').delete().eq('attempt_id', attemptId)
  if (err1) {
    console.error('Error deleting student answers:', err1.message)
  } else {
    console.log('Successfully deleted student answers.')
  }

  console.log(`Clearing exam attempt: ${attemptId}`)
  const { error: err2 } = await supabase.from('exam_attempts').delete().eq('id', attemptId)
  if (err2) {
    console.error('Error deleting exam attempt:', err2.message)
  } else {
    console.log('Successfully deleted exam attempt.')
  }
}

clearAttempt()
