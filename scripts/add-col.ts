import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addSemesterId() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE questions ADD COLUMN IF NOT EXISTS semester_id INTEGER REFERENCES public.semesters(id);',
  })
  if (error) {
    console.log(
      'exec_sql rpc might not exist. Trying another way or just printing error:',
      error
    )
  } else {
    console.log('Column added successfully!')
  }
}

addSemesterId()
