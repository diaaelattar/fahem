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
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(url, adminKey)

async function testInsertExam() {
  // Let's test with admin service key first
  // Find a subject and grade and question
  const { data: subject } = await supabaseAdmin
    .from('subjects')
    .select('id')
    .limit(1)
    .single()
  const { data: grade } = await supabaseAdmin
    .from('grades')
    .select('id')
    .limit(1)
    .single()

  console.log('Subject:', subject?.id, 'Grade:', grade?.id)
}

testInsertExam()
