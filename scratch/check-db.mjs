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

async function checkData() {
  console.log('Checking students...');
  const { data: students, error: sError } = await supabase.from('profiles').select('*').eq('role', 'student').limit(5);
  if (sError) console.error('Students error:', sError);
  else console.log('Students:', students);

  console.log('Checking exams...');
  const { data: exams, error: eError } = await supabase.from('exams').select('id, title, is_published').limit(5);
  if (eError) console.error('Exams error:', eError);
  else console.log('Exams:', exams);
}

checkData();
