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
  console.log('Checking group_sessions...');
  const { data: sessions, error: sError } = await supabase.from('group_sessions').select('*').limit(1);
  if (sError) {
    console.error('group_sessions error (table probably does not exist):', sError.message);
  } else {
    console.log('group_sessions table exists! Found sessions:', sessions.length);
  }

  console.log('Checking session_attendance...');
  const { data: attendance, error: aError } = await supabase.from('session_attendance').select('*').limit(1);
  if (aError) {
    console.error('session_attendance error (table probably does not exist):', aError.message);
  } else {
    console.log('session_attendance table exists! Found attendance logs:', attendance.length);
  }
}

checkData();
