import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const conten = fs.readFileSync(envPath, 'utf-8');
  conten.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(url, adminKey);

async function testCreateStudent() {
   const email = "teststudent1@domain.com";
   const full_name = "Test Student 1";
   const password = "Password123#";
   
   console.log("1. creating auth");
   const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'student',
      },
    })
    
   if (createError) {
      console.error("Auth Fail:", createError);
      return;
   }
   
   console.log("2. Inserting Profile");
   const newUserId = authData.user.id
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: newUserId,
        email,
        full_name,
        role: 'student',
        is_active: true,
      })
      
   if (profileError) {
      console.error("Profile Insert error:", profileError);
      
      // wait, let's select to see if it exists
      const { data } = await adminClient.from('profiles').select('*').eq('id', newUserId);
      console.log("Existing profile:", data);
      
      await adminClient.auth.admin.deleteUser(newUserId)
      return;
   }
   
   console.log("Done");
}

testCreateStudent()
