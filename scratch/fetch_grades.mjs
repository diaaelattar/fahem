import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local to get keys
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function check() {
  const { data: stages } = await supabase.from('educational_stages').select('*');
  const { data: grades } = await supabase.from('grades').select('*');
  console.log('STAGES:', JSON.stringify(stages, null, 2));
  console.log('GRADES:', JSON.stringify(grades, null, 2));
}

check();
