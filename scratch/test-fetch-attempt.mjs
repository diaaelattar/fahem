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

async function testFetchAttemptDetails() {
  const email = 'ahmeddiaa@gmail.com';
  const password = '123456789';
  const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
  const profileId = authData.user.id;
  
  const attemptId = '7ee85d74-5705-4503-9310-7032de1b9c86'; 
  
  const { data: attempt, error } = await supabase
    .from('exam_attempts')
    .select(`
      id, score, percentage, is_passed, completed_at, started_at,
      time_spent_seconds, attempt_number, answers, feedback,
      exams(
        id, title, total_points, passing_score, show_results_immediately,
        allowed_attempts, subjects(name_ar, icon),
        grades(name_ar)
      )
    `)
    .eq('id', attemptId)
    .eq('student_id', profileId)
    .single();

  console.log('Attempt fetch output:', attempt ? attempt.id : null, error);
}

testFetchAttemptDetails();
