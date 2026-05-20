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

async function resetPassword() {
  const targetEmail = 'tasneemelatter@gmail.com'
  const newPassword = '123456' // Or '12345678'
  console.log(`Resetting password for: ${targetEmail}`)
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error("Error listing users:", listError)
    return
  }
  
  const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())
  if (!user) {
    console.log(`User ${targetEmail} not found!`)
    return
  }
  
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword
  })
  
  if (error) {
    console.error("Error updating user password:", error.message)
  } else {
    console.log(`Successfully updated password for ${targetEmail} to: ${newPassword}`)
  }
}

resetPassword()
