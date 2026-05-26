import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Test with anon key
)

async function testInsert() {
  const { data, error } = await supabase
    .from('exams')
    .insert({
      title: 'Test',
      exam_type: 'custom',
      duration_minutes: 10,
      passing_score: 50,
      subject_id: 1,
      grade_id: 1,
    })
    .select()

  console.log('Error:', error)
}

testInsert()
