import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) process.env[match[1]] = match[2]?.trim() || '';
  });
}
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTypes() {
  const { data } = await supabase.from('subjects').select('id').limit(1);
  console.log('subjects.id sample:', data);

  const { data: q } = await supabase.from('questions').select('id, subject_id').limit(1);
  console.log('questions.id / subject_id sample:', q);
}
checkTypes();
