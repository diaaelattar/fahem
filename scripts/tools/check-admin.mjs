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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(url, key)

async function checkAdminOptions() {
  console.log('Checking admin profile...')
  // Just querying the profiles directly
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin')

  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Admin Profiles:')
    console.log(profiles)
  }
}

checkAdminOptions()
