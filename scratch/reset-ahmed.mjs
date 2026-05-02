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

async function resetAndTest() {
  const email = 'ahmeddiaa@gmail.com';
  const password = 'Password123#'; // Supabase requires strong passwords typically
  
  // Get user by email
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (profile) {
      console.log('Resetting password for', email);
      const { error } = await supabase.auth.admin.updateUserById(profile.id, { password });
      if (error) console.error('Reset error:', error.message);
      else console.log('Reset successful to', password);
  }
}

resetAndTest();
