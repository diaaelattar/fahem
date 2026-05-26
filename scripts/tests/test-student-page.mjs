import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const conten = fs.readFileSync(envPath, 'utf-8')
  conten.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : ''
    }
  })
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminClient = createClient(url, adminKey)

async function simulateStudent() {
  const email = 'ahmeddiaa@gmail.com'
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()
  if (!profile) {
    console.log('not found')
    return
  }

  console.log('Profile:', profile.id)

  const { data: student } = await adminClient
    .from('students')
    .select('*')
    .eq('id', profile.id)
    .single()
  console.log('Student:', student)

  const { data: exams, error } = await adminClient
    .from('exams')
    .select(
      'id, title, description, duration_minutes, total_points, questions_count, available_from, available_until, subjects(name_ar, icon), grades(name_ar)'
    )
    .eq('is_published', true)

  console.log('Exams Query Error?', error)
  console.log('Exams found:', exams?.length)

  if (exams && exams.length > 0) {
    console.log('Exams Data:', exams[0])
  }
}

simulateStudent()
