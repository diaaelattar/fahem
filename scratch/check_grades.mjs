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

async function checkGrades() {
  console.log('--- Checking Grades ---');
  
  const email = "ahmeddiaa@gmail.com";
  const { data: profile } = await adminClient.from('profiles').select('id, full_name').eq('email', email).single();
  const { data: student } = await adminClient.from('students').select('grade_id').eq('id', profile?.id).single();
  
  console.log(`Student: ${profile?.full_name}, Grade ID: ${student?.grade_id}`);

  const { data: exams } = await adminClient.from('exams').select('id, title, grade_id, is_published');
  for (const exam of exams || []) {
    console.log(`Exam: ${exam.title}, Grade ID: ${exam.grade_id}, Published: ${exam.is_published}`);
  }

  process.exit(0);
}

checkGrades();
