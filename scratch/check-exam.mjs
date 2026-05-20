import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkExam() {
  const { data: exam, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', '7855cd94-5f02-4159-8134-a94dce33f469')
    .single()
    
  if (error) {
    console.error("Error:", error.message)
    return
  }
  
  console.log("Exam details:", exam)
}

checkExam()
