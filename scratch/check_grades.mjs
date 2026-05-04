import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ekhsbwcdenmfokmzafzw.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MISSING_KEY'
)

async function checkData() {
  const { data: stages, error: stagesError } = await supabase.from('educational_stages').select('*')
  console.log('Stages:', stages, stagesError)

  const { data: grades, error: gradesError } = await supabase.from('grades').select('*')
  console.log('Grades:', grades, gradesError)
}

checkData()
