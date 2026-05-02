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

async function testFetchExam() {
  const email = 'ahmeddiaa@gmail.com';
  const password = '123456789';
  await supabase.auth.signInWithPassword({ email, password });
  
  const examId = '7b75f402-5835-48c9-a3da-49bc1a6093d5'; 
  
  const { data: exam, error } = await supabase
    .from('exams')
    .select('id, title, is_published, grade_id')
    .eq('id', examId)
    .single();

  console.log('Exam query result:', exam, error);
}

testFetchExam();
