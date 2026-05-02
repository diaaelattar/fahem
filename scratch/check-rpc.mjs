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

async function testRpc() {
  const email = 'ahmeddiaa@gmail.com';
  const password = '123456789';
  const { data: { session } } = await supabase.auth.signInWithPassword({ email, password });
  
  if (!session) {
    console.log('Login failed');
    return;
  }
  
  const { data, error } = await supabase.rpc('can_attempt_exam', {
    p_exam_id: '7b75f402-5835-48c9-a3da-49bc1a6093d5',
    p_student_id: session.user.id
  });
  
  console.log('RPC Result:', data, error);
}

testRpc();
