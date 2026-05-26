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

async function approveAll() {
  console.log('Approving all questions in the bank...')
  const { data, error } = await adminClient
    .from('questions')
    .update({ is_approved: true })
    .eq('is_approved', false)

  if (error) {
    console.error('Bulk approval failed:', error)
  } else {
    console.log(
      'Success! All pending questions are now approved and ready for students.'
    )
  }
}

approveAll()
