import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedSemesters() {
  const { data, error } = await supabase.from('semesters').select('*')
  if (error) {
    console.error('Error fetching semesters:', error)
    return
  }
  
  if (data.length === 0) {
    console.log('Semesters table is empty. Seeding...')
    const { error: insertError } = await supabase.from('semesters').insert([
      { name_ar: 'الترم الأول', name_en: 'First Term', sort_order: 1 },
      { name_ar: 'الترم الثاني', name_en: 'Second Term', sort_order: 2 }
    ])
    if (insertError) {
      console.error('Error inserting semesters:', insertError)
    } else {
      console.log('Semesters seeded successfully!')
    }
  } else {
    console.log('Semesters already exist:', data)
  }
}

seedSemesters()
