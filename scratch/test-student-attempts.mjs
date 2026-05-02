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

async function testFetchAttempts() {
  const email = 'ahmeddiaa@gmail.com';
  const password = '123456789';
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return console.error('Login failed:', error.message);
  
  const { data: attempts, error: attErr } = await supabase.from('exam_attempts').select('id, exam_id').limit(5);
  console.log('Attempts fetched as student:', attempts);
  if (attErr) console.error('Error fetching attempts:', attErr.message);
}

testFetchAttempts();
