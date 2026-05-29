import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkTeachersColumns() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching teachers table:', error.message)
  } else {
    console.log('Success! Columns in teachers table row:', data && data[0] ? Object.keys(data[0]) : 'No rows found')
  }
}

checkTeachersColumns()
