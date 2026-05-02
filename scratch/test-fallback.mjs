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

async function testFallback() {
  const email = 'ahmeddiaa@gmail.com';
  const password = '123456789';
  const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
  const profileId = authData.user.id;
  
  const examId = '34bd6fa9-0291-4c8e-92ea-d489af5600d4'; // Just pick one exam ID from earlier
  
  const { data: fallbackAttempt, error } = await supabase
      .from('exam_attempts')
      .select('id')
      .eq('exam_id', examId)
      .eq('student_id', profileId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

  console.log('Fallback logic output:', fallbackAttempt, error);
}

testFallback();
