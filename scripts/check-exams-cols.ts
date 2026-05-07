import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkExamsColumns() {
  const { data, error } = await supabase
    .from('exams')
    .select('exam_type, lesson_id, unit_id, semester_id')
    .limit(1)

  if (error) {
    console.error('Columns do NOT exist or schema cache not updated:', error.message)
  } else {
    console.log('Success! Columns exist in the database.')
  }
}

checkExamsColumns()
