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

async function resetAdmin() {
  const email = 'diaaelattardiaa@gmail.com';
  const newPassword = 'Password1234';
  
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (profile) {
      console.log('Resetting admin password to:', newPassword);
      const { error } = await supabase.auth.admin.updateUserById(profile.id, { password: newPassword });
      if (error) console.error('Reset error:', error.message);
      else console.log('Reset successful!');
  }
}

resetAdmin();
