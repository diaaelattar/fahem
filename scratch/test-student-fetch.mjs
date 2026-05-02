import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function testStudentLogin() {
  const email = 'ahmeddiaa@gmail.com';
  const password = 'Password123#';
  
  console.log(`Attempting login with ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Login failed:', error.message);
    return;
  } 
  
  console.log('Login successful for user:', data.user.id);
    
  // 1. Fetch profile
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
    
  if (profErr) {
      console.error('Profile fetch failed:', profErr.message);
      return;
  }
  
  // 2. Fetch student with grades (the query failing with 406)
  const { data: student, error: stdErr } = await supabase
    .from('students')
    .select('*, grades(name_ar)')
    .eq('id', profile.id)
    .single();
    
  if (stdErr) {
      console.error('Student fetch failed:', stdErr);
  } else {
      console.log('Student found:', student);
  }
}

testStudentLogin();
