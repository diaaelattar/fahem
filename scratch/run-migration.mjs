import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const filePath = path.join(process.cwd(), 'supabase/migrations/20260529000001_teacher_questions_and_ads.sql')
  const sql = fs.readFileSync(filePath, 'utf8')
  
  console.log('Executing SQL migration...')
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    console.error('Error running migration via RPC:', error)
  } else {
    console.log('Migration executed successfully! Result:', data)
  }
}

run()
