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
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return console.error('Login failed:', error.message);
  
  const { data: student } = await supabase.from('students').select('*').eq('id', data.user.id).single();
  
  const { data: availableExams, error: examErr } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, questions_count, total_points')
    .eq('is_published', true)
    .eq('grade_id', student?.grade_id || 0)
    .limit(6);
    
  console.log('Available exams for student:', availableExams);
  if (examErr) console.error('Exam Error:', examErr);
}

testStudentLogin();
