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

async function checkExam() {
  const { data: attempt, error: err1 } = await supabase
    .from('exam_attempts')
    .select('id, exam_id, score, percentage, is_passed')
    .eq('student_id', 'c8789ccb-272f-488f-aeb4-5f506e7683fc') // just an example, we will search all
    .limit(10);
    
  const { data: recentAttempts, error: err2 } = await supabase
    .from('exam_attempts')
    .select('id, exam_id, score, percentage, is_passed, exams(passing_score)')
    .order('completed_at', { ascending: false })
    .limit(5);

  console.log('Recent Attempts:', JSON.stringify(recentAttempts, null, 2));
}

checkExam();
