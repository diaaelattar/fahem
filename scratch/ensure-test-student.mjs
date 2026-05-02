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
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, adminKey);

async function checkTestStudent() {
  const email = "teststudent1@domain.com";
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('email', email).single();
  if (error) {
    console.log('Test student not found. Creating one...');
    const password = "Password123#";
    const full_name = "Test Student";
    
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'student' },
    });
    
    if (createError) {
      console.error('Failed to create test user:', createError);
      return;
    }
    
    await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      full_name,
      role: 'student',
      is_active: true,
    });
    
    // Also need to add to students table
    // Need a grade_id
    const { data: grades } = await supabase.from('grades').select('id').limit(1).single();
    
    await supabase.from('students').insert({
      id: authData.user.id,
      full_name,
      grade_id: grades?.id || 1,
      class_section: 'A',
    });

    console.log('Created test student: teststudent1@domain.com / Password123#');
  } else {
    console.log('Test student exists:', profile.email);
    // Ensure it's in the students table too
    const { data: student } = await supabase.from('students').select('*').eq('id', profile.id).single();
    if (!student) {
        console.log('Profile exists but not in students table. Adding...');
        const { data: grades } = await supabase.from('grades').select('id').limit(1).single();
        await supabase.from('students').insert({
          id: profile.id,
          full_name: profile.full_name,
          grade_id: grades?.id || 1,
          class_section: 'A',
        });
    }
  }
}

checkTestStudent();
