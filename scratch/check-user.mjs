import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing supabase URL or service role key.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUser() {
  const targetEmail = 'tasneemelatter@gmail.com'
  console.log(`Checking user info for: ${targetEmail}`)
  
  // Get user from auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error("Error listing auth users:", authError)
    return
  }
  
  const authUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())
  if (!authUser) {
    console.log(`User ${targetEmail} DOES NOT exist in auth.users!`)
    return
  }
  
  console.log("Auth User details:", {
    id: authUser.id,
    email: authUser.email,
    role: authUser.role,
    last_sign_in_at: authUser.last_sign_in_at,
    user_metadata: authUser.user_metadata,
    app_metadata: authUser.app_metadata
  })

  // Check profiles / students / teachers
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()
    
  if (profError) {
    console.log("Profile error:", profError.message)
  } else {
    console.log("Profile details:", profile)
  }

  // Also check students table
  const { data: student, error: studError } = await supabase
    .from('students')
    .select('*')
    .eq('id', authUser.id)
    .single()
    
  if (studError) {
    console.log("Student table error:", studError.message)
  } else {
    console.log("Student details:", student)
  }
}

checkUser()
