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

async function inspectQuestions() {
  const { data: qs, error } = await adminClient
    .from('questions')
    .select('id, question_text, is_approved, admin_id')
  console.log('Total questions in DB:', qs?.length)
  if (qs && qs.length > 0) {
    console.log('First question example:', qs[0])
  }
}

inspectQuestions()
