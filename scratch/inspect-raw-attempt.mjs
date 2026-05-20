import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function inspectRawAttempt() {
  const attemptId = 'd781ab7a-9ffa-4137-9f5b-98931bf2befe'
  
  const { data: attempt, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .single()
    
  if (error) {
    console.error("Error querying attempt:", error.message)
    return
  }
  
  console.log("Raw Attempt:", JSON.stringify(attempt, null, 2))
}

inspectRawAttempt()
