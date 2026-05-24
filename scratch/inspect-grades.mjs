import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?/);
    if (match) process.env[match[1]] = match[2]?.trim() ?? '';
  });
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('=== STAGES ===');
  const { data: stages, error: e1 } = await supabase.from('educational_stages').select('*').order('sort_order');
  if (e1) console.error(e1);
  else console.log(stages);

  console.log('\n=== GRADES ===');
  const { data: grades, error: e2 } = await supabase.from('grades').select('*').order('stage_id, grade_number');
  if (e2) console.error(e2);
  else console.log(grades);
}

run();
